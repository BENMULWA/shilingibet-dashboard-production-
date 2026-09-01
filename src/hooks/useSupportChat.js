import { useState, useEffect, useCallback, useRef } from "react";
import {
  initializeSocket,
  getSocket,
  getAgentStatus,
  setAgentStatus as setSharedAgentStatus,
  subscribeAgentStatus,
} from "../services/socketService";
import { API_URL } from "../utils/ApiConfigs";

// Notification sound using Web Audio API
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Create oscillator for the notification tone
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure the sound - a pleasant notification tone
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
    oscillator.frequency.setValueAtTime(988, audioContext.currentTime + 0.1); // B5 note
    oscillator.frequency.setValueAtTime(1047, audioContext.currentTime + 0.2); // C6 note

    oscillator.type = "sine";

    // Fade in and out for a smoother sound
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.25);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.4);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.4);

    // Clean up
    setTimeout(() => {
      audioContext.close();
    }, 500);
  } catch (err) {
    console.warn("Could not play notification sound:", err);
  }
};

export const useSupportChat = () => {
  const [queue, setQueue] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [history, setHistory] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [agentStatus, setAgentStatus] = useState(getAgentStatus);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineAgents, setOnlineAgents] = useState([]);
  const [isClosingChat, setIsClosingChat] = useState(false);
  const currentSessionRef = useRef(null);
  const closeChatTimeoutRef = useRef(null);

  // Keep ref in sync with state
  useEffect(() => {
    currentSessionRef.current = currentSession;
  }, [currentSession]);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");
    const token = user?.token;

    if (!token) {
      setError("No authentication token found");
      setIsLoading(false);
      return;
    }

    const socket = initializeSocket(token);
    const unsubscribeStatus = subscribeAgentStatus(setAgentStatus);

    // Connection events
    socket.on("connect", () => {
      setIsConnected(true);
      setError(null);
      setIsLoading(false);
      socket.emit("agent:get_stats");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      setSharedAgentStatus("offline");
    });

    socket.on("connect_error", (err) => {
      setError(err.message);
      setIsConnected(false);
      setIsLoading(false);
    });

    // Agent error
    socket.on("agent:error", (data) => {
      console.error("Agent error:", data.message);
      // Reset closing state if there was an error closing chat
      setIsClosingChat(false);
      if (closeChatTimeoutRef.current) {
        clearTimeout(closeChatTimeoutRef.current);
        closeChatTimeoutRef.current = null;
      }
    });

    // Agent online confirmed - receive queue and active chats
    socket.on("agent:online_confirmed", (data) => {
      setQueue(data.queue || []);
      setActiveChats(data.activeChats || []);
      setHistory(data.history || []);
      setSharedAgentStatus("online");
      socket.emit("agent:get_stats");
    });

    socket.on("agent:status_confirmed", (data) => {
      setSharedAgentStatus(data.status || "offline");
    });

    // Queue updates
    socket.on("agent:queue", (data) => {
      setQueue(data.queue || []);
    });

    // Active chats list
    socket.on("agent:active_chats", (data) => {
      setActiveChats(data.chats || []);
    });

    socket.on("agent:history", (data) => {
      setHistory(data.chats || []);
    });

    socket.on("agent:history_opened", (data) => {
      setCurrentSession(data.session);
      setMessages(data.messages || []);
      setIsTyping(false);
    });

    // Stats update
    socket.on("agent:stats", (data) => {
      setStats(data.stats || {});
    });

    // New chat waiting in queue
    socket.on("agent:new_chat_waiting", (data) => {
      playNotificationSound();
      setQueue((prev) => {
        if (prev.find((c) => c.sessionId === data.session.sessionId)) {
          return prev;
        }
        return [...prev, data.session];
      });
    });

    // Chat accepted successfully
    socket.on("agent:chat_accepted", (data) => {
      setCurrentSession(data.session);
      setMessages(data.messages || []);
      // Move from queue to active
      setQueue((prev) => prev.filter((c) => c.sessionId !== data.session.sessionId));
      setActiveChats((prev) => {
        if (prev.find((c) => c.sessionId === data.session.sessionId)) {
          return prev;
        }
        return [...prev, data.session];
      });
    });

    // Chat assigned (auto-assigned)
    socket.on("agent:chat_assigned", (data) => {
      setActiveChats((prev) => {
        if (prev.find((c) => c.sessionId === data.session.sessionId)) {
          return prev;
        }
        return [...prev, data.session];
      });
      socket.emit("agent:get_stats");
    });

    // Chat transferred to this agent
    socket.on("agent:chat_transferred_to_you", (data) => {
      setActiveChats((prev) => {
        if (prev.find((c) => c.sessionId === data.session.sessionId)) {
          return prev;
        }
        return [...prev, data.session];
      });
    });

    // Chat taken by another agent
    socket.on("agent:chat_taken", (data) => {
      setQueue((prev) => prev.filter((c) => c.sessionId !== data.sessionId));
    });

    // Customer message received
    socket.on("agent:customer_message", (data) => {
      playNotificationSound();
      setMessages((prev) => {
        // Check if we're in this chat
        if (currentSessionRef.current?.sessionId === data.sessionId) {
          // Avoid duplicates
          if (prev.find((m) => m._id === data.message._id)) {
            return prev;
          }
          return [...prev, data.message];
        }
        return prev;
      });
      // Update active chat
      setActiveChats((prev) =>
        prev.map((c) =>
          c.sessionId === data.sessionId
            ? { ...c, lastMessageAt: new Date().toISOString() }
            : c
        )
      );
    });

    // New message in chat room
    socket.on("chat:new_message", (data) => {
      const message = data?.message ?? data;
      if (!message?._id) return;
      setMessages((prev) => {
        if (prev.find((m) => m._id === message._id)) {
          return prev;
        }
        return [...prev, message];
      });
    });

    // Message sent confirmation
    socket.on("agent:message_sent", (data) => {
      // Update temp message with real ID
      setMessages((prev) =>
        prev.map((m) => (m.tempId === data.tempId ? { ...m, _id: data.messageId } : m))
      );
    });

    // Chat joined - receive messages
    socket.on("agent:chat_joined", (data) => {
      setCurrentSession(data.session);
      setMessages(data.messages || []);
    });

    // Typing indicators
    socket.on("chat:typing", (data) => {
      if (data.userType === "customer") {
        setIsTyping(true);
      }
    });

    socket.on("chat:stop_typing", () => {
      setIsTyping(false);
    });

    // Chat ended - handles both agent closing and customer ending chat
    socket.on("chat:ended", (data) => {
      console.log("chat:ended received:", data);
      // Clear the close chat timeout since we got confirmation
      if (closeChatTimeoutRef.current) {
        clearTimeout(closeChatTimeoutRef.current);
        closeChatTimeoutRef.current = null;
      }
      setIsClosingChat(false);

      setMessages((prev) => {
        if (currentSessionRef.current?.sessionId === data.sessionId) {
          return [
            ...prev,
            {
              _id: "system_end_" + Date.now(),
              senderType: "system",
              content: `Chat ended by ${data.closedBy}`,
              createdAt: new Date().toISOString(),
            },
          ];
        }
        return prev;
      });

      // Clear current session if it was closed
      if (currentSessionRef.current?.sessionId === data.sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }

      setActiveChats((prev) => prev.filter((c) => c.sessionId !== data.sessionId));
      socket.emit("agent:get_stats");
    });

    // Alternative event name for chat closed (in case server uses this)
    socket.on("agent:chat_closed", (data) => {
      console.log("agent:chat_closed received:", data);
      if (closeChatTimeoutRef.current) {
        clearTimeout(closeChatTimeoutRef.current);
        closeChatTimeoutRef.current = null;
      }
      setIsClosingChat(false);

      if (currentSessionRef.current?.sessionId === data.sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }
      setActiveChats((prev) => prev.filter((c) => c.sessionId !== data.sessionId));
      socket.emit("agent:get_stats");
    });

    // Customer abandoned
    socket.on("chat:customer_abandoned", (data) => {
      if (currentSessionRef.current?.sessionId === data.sessionId) {
        setMessages((prev) => [
          ...prev,
          {
            _id: "system_abandoned_" + Date.now(),
            senderType: "system",
            content: "Customer disconnected",
            createdAt: new Date().toISOString(),
          },
        ]);
      }
      setActiveChats((prev) => prev.filter((c) => c.sessionId !== data.sessionId));
    });

    // Message deleted
    socket.on("agent:message_deleted", (data) => {
      console.log("agent:message_deleted received:", data);
      if (currentSessionRef.current?.sessionId === data.sessionId) {
        setMessages((prev) => prev.filter((m) => m._id !== data.messageId));
      }
    });

    // Chat rated
    socket.on("agent:chat_rated", (data) => {
      if (currentSessionRef.current?.sessionId === data.sessionId) {
        const stars = "★".repeat(data.score) + "☆".repeat(5 - data.score);
        setMessages((prev) => [
          ...prev,
          {
            _id: "system_rated_" + Date.now(),
            senderType: "system",
            content: `Customer rated: ${stars}${data.feedback ? " - " + data.feedback : ""}`,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
      socket.emit("agent:get_stats");
    });

    // Chat transferred (from this agent)
    socket.on("agent:chat_transferred", (data) => {
      if (currentSessionRef.current?.sessionId === data.sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }
      setActiveChats((prev) => prev.filter((c) => c.sessionId !== data.sessionId));
    });

    // Reconcile from MongoDB so queues stay correct after reconnects, backend
    // restarts, and deployments with more than one API process.
    const refreshTimer = window.setInterval(() => {
      if (socket.connected) socket.emit("agent:get_stats");
    }, 5000);

    if (socket.connected) {
      setIsConnected(true);
      setIsLoading(false);
      socket.emit("agent:get_stats");
    }

    return () => {
      window.clearInterval(refreshTimer);
      unsubscribeStatus();
    };
  }, []);

  // Go online
  const goOnline = useCallback(() => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("agent:go_online");
    }
  }, []);

  // Go away
  const goAway = useCallback(() => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("agent:go_away");
      setSharedAgentStatus("away");
    }
  }, []);

  // Go offline
  const goOffline = useCallback(() => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("agent:go_offline");
      setSharedAgentStatus("offline");
    }
  }, []);

  // Accept chat from queue
  const acceptChat = useCallback((sessionId) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("agent:accept_chat", { sessionId });
    }
  }, []);

  // Join existing chat
  const joinChat = useCallback((session) => {
    const socket = getSocket();
    if (!socket?.connected || !session?.sessionId) return false;

    setCurrentSession(session);
    setMessages([]);
    setIsTyping(false);
    socket.emit("agent:join_chat", { sessionId: session.sessionId });
    return true;
  }, []);

  const viewHistory = useCallback((sessionId) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("agent:view_history", { sessionId });
    }
  }, []);

  // Send message
  const sendMessage = useCallback((content) => {
    const socket = getSocket();
    const session = currentSessionRef.current;
    if (socket?.connected && session) {
      const tempId = "temp_" + Date.now();

      // Optimistic update
      const newMessage = {
        _id: tempId,
        tempId,
        senderType: "agent",
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newMessage]);

      socket.emit("agent:send_message", {
        sessionId: session.sessionId,
        content,
        tempId,
      });

      return true;
    }
    return false;
  }, []);

  // Delete message
  const deleteMessage = useCallback((messageId) => {
    const socket = getSocket();
    const session = currentSessionRef.current;

    if (!socket?.connected) {
      return { success: false, error: "Not connected to server." };
    }

    if (!session) {
      return { success: false, error: "No active chat selected." };
    }

    if (!messageId) {
      return { success: false, error: "No message selected." };
    }

    // Optimistic update - remove message immediately
    setMessages((prev) => prev.filter((m) => m._id !== messageId));

    socket.emit("agent:delete_message", {
      sessionId: session.sessionId,
      messageId,
    });

    return { success: true };
  }, []);

  // Close chat
  const closeChat = useCallback(() => {
    const socket = getSocket();
    const session = currentSessionRef.current;

    console.log("closeChat called", { socketConnected: socket?.connected, session });

    // Check if socket is connected
    if (!socket?.connected) {
      return { success: false, error: "Not connected to server. Please refresh the page." };
    }

    // Check if there's an active session
    if (!session) {
      return { success: false, error: "No active chat selected." };
    }

    // Set loading state
    setIsClosingChat(true);

    console.log("Emitting agent:close_chat", { sessionId: session.sessionId });

    // Emit the close event
    socket.emit("agent:close_chat", { sessionId: session.sessionId });

    // Set a timeout in case server doesn't respond
    closeChatTimeoutRef.current = setTimeout(() => {
      console.log("Close chat timeout - server did not respond");
      setIsClosingChat(false);
    }, 10000); // 10 second timeout

    return { success: true };
  }, []);

  // Fetch online agents for transfer
  const fetchOnlineAgents = useCallback(async () => {
    try {
      const user = JSON.parse(sessionStorage.getItem("user") || "{}");
      const response = await fetch(`${API_URL}/support-chat/agent/online-agents`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      const data = await response.json();
      if (data.success !== false && data.data?.agents) {
        setOnlineAgents(data.data.agents);
        return data.data.agents;
      }
      return [];
    } catch (err) {
      console.error("Error fetching online agents:", err);
      return [];
    }
  }, []);

  // Transfer chat
  const transferChat = useCallback((toAgentId, reason) => {
    const socket = getSocket();
    const session = currentSessionRef.current;
    if (socket?.connected && session && toAgentId) {
      socket.emit("agent:transfer_chat", {
        sessionId: session.sessionId,
        toAgentId,
        reason: reason || "",
      });
      return true;
    }
    return false;
  }, []);

  // Typing indicator
  const sendTyping = useCallback(() => {
    const socket = getSocket();
    const session = currentSessionRef.current;
    if (socket?.connected && session) {
      socket.emit("agent:typing", { sessionId: session.sessionId });
    }
  }, []);

  const sendStopTyping = useCallback(() => {
    const socket = getSocket();
    const session = currentSessionRef.current;
    if (socket?.connected && session) {
      socket.emit("agent:stop_typing", { sessionId: session.sessionId });
    }
  }, []);

  return {
    queue,
    activeChats,
    history,
    currentSession,
    messages,
    stats,
    isConnected,
    isLoading,
    error,
    agentStatus,
    isTyping,
    onlineAgents,
    isClosingChat,
    goOnline,
    goAway,
    goOffline,
    acceptChat,
    joinChat,
    viewHistory,
    sendMessage,
    deleteMessage,
    closeChat,
    transferChat,
    fetchOnlineAgents,
    sendTyping,
    sendStopTyping,
    setCurrentSession,
  };
};

export default useSupportChat;
