import { useState, useRef, useEffect, useCallback } from "react";
import { Input, Button, Empty, Badge, Spin, Alert, Modal, Radio, Space } from "antd";
import {
  FiSend,
  FiSearch,
  FiUser,
  FiClock,
  FiCheckCircle,
  FiWifi,
  FiWifiOff,
  FiX,
  FiArrowRight,
  FiTrash2,
} from "react-icons/fi";
import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2";
import useSupportChat from "../hooks/useSupportChat";

function SupportChat() {
  const {
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
  } = useSupportChat();

  const [viewMode, setViewMode] = useState("queue");
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [transferReason, setTransferReason] = useState("");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Check if input should be enabled
  const canSendMessage =
    isConnected && agentStatus !== "offline" && currentSession?.status === "active";

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const handleSelectQueueChat = (session) => {
    acceptChat(session.sessionId);
  };

  const handleSelectActiveChat = (session) => {
    joinChat(session);
  };

  const handleSelectHistoryChat = (session) => {
    viewHistory(session.sessionId);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !currentSession) return;
    sendMessage(newMessage);
    setNewMessage("");
    sendStopTyping();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    sendTyping();
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendStopTyping();
    }, 2000);
  };

  const handleCloseChat = () => {
    setShowCloseModal(true);
  };

  const confirmCloseChat = () => {
    console.log("confirmCloseChat called");
    const result = closeChat();
    console.log("closeChat result:", result);
    setShowCloseModal(false);
    if (result && !result.success) {
      alert(result.error);
    }
  };

  const handleOpenTransferModal = async () => {
    setShowTransferModal(true);
    setLoadingAgents(true);
    setSelectedAgent(null);
    setTransferReason("");
    await fetchOnlineAgents();
    setLoadingAgents(false);
  };

  const handleTransfer = () => {
    if (!selectedAgent) {
      return;
    }
    const success = transferChat(selectedAgent, transferReason);
    if (success) {
      setShowTransferModal(false);
      setSelectedAgent(null);
      setTransferReason("");
    }
  };

  const filteredQueue = queue.filter((session) =>
    session.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.customer?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredActiveChats = activeChats.filter((session) =>
    session.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.customer?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHistory = history.filter((session) =>
    session.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.customer?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayList =
    viewMode === "queue"
      ? filteredQueue
      : viewMode === "active"
      ? filteredActiveChats
      : filteredHistory;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden h-[calc(100vh-120px)] md:h-[calc(100vh-180px)] flex items-center justify-center">
        <Spin size="large" tip="Connecting to chat..." />
      </div>
    );
  }

  if (error && !isConnected) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden h-[calc(100vh-120px)] md:h-[calc(100vh-180px)] flex items-center justify-center p-4">
        <Alert
          type="error"
          message="Connection Error"
          description={error}
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden h-[calc(100vh-120px)] md:h-[calc(100vh-180px)] flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col ${currentSession ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="px-3 md:px-4 py-3 md:py-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-[#f9ce36]/20 flex items-center justify-center flex-shrink-0">
                <HiOutlineChatBubbleLeftRight className="text-amber-600" size={18} />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-semibold text-slate-900">Support Chat</h3>
                <p className="text-xs text-slate-500">
                  {queue.length} waiting · {activeChats.length} active · {history.length} closed
                </p>
              </div>
            </div>
            {/* Connection Status */}
            <div className={`flex items-center gap-1 md:gap-1.5 px-2 py-1 rounded-full text-xs ${
              isConnected ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}>
              {isConnected ? <FiWifi size={12} /> : <FiWifiOff size={12} />}
              <span className="hidden sm:inline">{isConnected ? "Live" : "Offline"}</span>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2 mb-2 md:mb-3">
            <button
              onClick={() => setViewMode("queue")}
              className={`flex-1 py-1.5 md:py-2 px-2 md:px-3 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                viewMode === "queue"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Queue
              {queue.length > 0 && (
                <Badge
                  count={queue.length}
                  style={{ marginLeft: 6, backgroundColor: "#f59e0b" }}
                  size="small"
                />
              )}
            </button>
            <button
              onClick={() => setViewMode("history")}
              className={`flex-1 py-1.5 md:py-2 px-2 md:px-3 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                viewMode === "history"
                  ? "bg-slate-200 text-slate-800"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              History
            </button>
            <button
              onClick={() => setViewMode("active")}
              className={`flex-1 py-1.5 md:py-2 px-2 md:px-3 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                viewMode === "active"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Active
              {activeChats.length > 0 && (
                <Badge
                  count={activeChats.length}
                  style={{ marginLeft: 6, backgroundColor: "#10b981" }}
                  size="small"
                />
              )}
            </button>
          </div>

          <div className="relative">
            <Input
              prefix={<FiSearch className="text-slate-400" size={14} />}
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              className="w-full"
              size="middle"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {displayList.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  viewMode === "queue"
                    ? "No chats waiting"
                    : viewMode === "active"
                    ? "No active chats"
                    : "No closed chats"
                }
              />
            </div>
          ) : (
            displayList.map((session) => (
              <div
                key={session.sessionId}
                onClick={() =>
                  viewMode === "queue"
                    ? handleSelectQueueChat(session)
                    : viewMode === "active"
                    ? handleSelectActiveChat(session)
                    : handleSelectHistoryChat(session)
                }
                className={`px-4 py-3 cursor-pointer border-b border-slate-50 transition-colors ${
                  currentSession?.sessionId === session.sessionId
                    ? "bg-[#f9ce36]/10 border-l-2 border-l-[#f9ce36]"
                    : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center">
                      <FiUser className="text-slate-500" size={18} />
                    </div>
                    {viewMode === "queue" && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-amber-500 rounded-full border-2 border-white" />
                    )}
                    {viewMode === "active" && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                    )}
                    {viewMode === "history" && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-slate-400 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-slate-900 text-sm">
                        {session.customer?.name || "Guest"}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatTime(session.lastMessageAt || session.waitingStartedAt || session.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 truncate">
                      {session.customer?.email || "No email"}
                    </p>
                    {viewMode === "queue" && session.queuePosition && (
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                        Queue #{session.queuePosition}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats */}
        {stats && (
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-slate-900">{stats.todayChats || 0}</div>
                <div className="text-xs text-slate-500">Today</div>
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900">{stats.totalChats || 0}</div>
                <div className="text-xs text-slate-500">Total</div>
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900">
                  {stats.avgRating ? stats.avgRating.toFixed(1) : "N/A"}
                </div>
                <div className="text-xs text-slate-500">Rating</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Area - Shows on mobile when session selected, always on desktop */}
      <div className={`flex-1 flex-col ${currentSession ? 'flex' : 'hidden md:flex'}`}>
        {currentSession ? (
          <>
            {/* Chat Header */}
            <div className="px-3 md:px-5 py-3 md:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 md:gap-3">
                {/* Back button for mobile */}
                <button
                  onClick={() => setCurrentSession(null)}
                  className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <FiArrowRight className="text-slate-600 rotate-180" size={18} />
                </button>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#f9ce36] flex items-center justify-center flex-shrink-0">
                  <span className="text-slate-900 font-semibold text-xs md:text-sm">
                    {(currentSession.customer?.name || "G").charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-slate-900 text-sm md:text-base truncate">
                    {currentSession.customer?.name || "Guest"}
                  </h4>
                  <p className="text-xs text-slate-500 truncate hidden sm:block">
                    {currentSession.customer?.email || "No email"}
                  </p>
                </div>
              </div>
              {currentSession.status === "closed" ? (
                <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
                  Closed
                </span>
              ) : (
              <div className="flex items-center gap-1.5 md:gap-2">
                <Button
                  icon={<FiArrowRight size={14} />}
                  onClick={handleOpenTransferModal}
                  className="hidden sm:flex items-center"
                  size="small"
                >
                  Transfer
                </Button>
                <Button
                  icon={<FiArrowRight size={14} />}
                  onClick={handleOpenTransferModal}
                  className="sm:hidden"
                  size="small"
                />
                <Button
                  danger
                  icon={<FiX size={14} />}
                  onClick={handleCloseChat}
                  className="hidden sm:flex items-center"
                  size="small"
                  loading={isClosingChat}
                  disabled={isClosingChat}
                >
                  {isClosingChat ? "Closing..." : "Close"}
                </Button>
                <Button
                  danger
                  icon={<FiX size={14} />}
                  onClick={handleCloseChat}
                  className="sm:hidden"
                  size="small"
                  loading={isClosingChat}
                  disabled={isClosingChat}
                />
              </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3 md:space-y-4 bg-slate-50/50">
              {messages.map((msg, index) => (
                <div
                  key={msg._id || index}
                  className={`flex ${
                    msg.senderType === "agent"
                      ? "justify-end"
                      : msg.senderType === "system"
                      ? "justify-center"
                      : "justify-start"
                  }`}
                >
                  {msg.senderType === "system" ? (
                    <div className="bg-amber-50 text-amber-800 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm">
                      {msg.content}
                    </div>
                  ) : (
                    <div
                      className={`max-w-[85%] md:max-w-[70%] ${
                        msg.senderType === "agent"
                          ? "bg-[#f9ce36] text-slate-900 rounded-2xl rounded-br-md"
                          : "bg-white text-slate-800 rounded-2xl rounded-bl-md border border-slate-200"
                      } px-3 md:px-4 py-2 md:py-2.5 shadow-sm`}
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <div
                        className={`flex items-center gap-1 mt-1 ${
                          msg.senderType === "agent" ? "justify-end" : ""
                        }`}
                      >
                        <FiClock
                          size={10}
                          className={
                            msg.senderType === "agent"
                              ? "text-slate-700/60"
                              : "text-slate-400"
                          }
                        />
                        <span
                          className={`text-xs ${
                            msg.senderType === "agent"
                              ? "text-slate-700/60"
                              : "text-slate-400"
                          }`}
                        >
                          {formatMessageTime(msg.createdAt)}
                        </span>
                        {msg.senderType === "agent" && currentSession.status !== "closed" && (
                          <>
                            <FiCheckCircle
                              size={12}
                              className="text-slate-700/60 ml-1"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                Modal.confirm({
                                  title: "Delete Message",
                                  content: "Are you sure you want to delete this message?",
                                  okText: "Delete",
                                  okType: "danger",
                                  onOk: () => {
                                    deleteMessage(msg._id);
                                    return Promise.resolve();
                                  },
                                });
                              }}
                              className="ml-2 p-1 rounded hover:bg-slate-900/10 transition-colors"
                              title="Delete message"
                            >
                              <FiTrash2 size={12} className="text-slate-700/60 hover:text-red-600" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-slate-500 px-3 md:px-4 py-1.5 md:py-2 rounded-2xl border border-slate-200 text-xs md:text-sm italic">
                    Customer is typing...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input / history status */}
            {currentSession.status === "closed" ? (
              <div className="border-t border-slate-100 bg-white px-4 py-3 text-center text-sm text-slate-500">
                This conversation is closed and available as read-only history.
              </div>
            ) : (
            <div className="px-3 md:px-5 py-3 md:py-4 border-t border-slate-100 bg-white">
              <div className="flex items-end gap-2 md:gap-3">
                <div className="flex-1">
                  <Input.TextArea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    autoSize={{ minRows: 1, maxRows: 3 }}
                    className="resize-none text-sm"
                    disabled={!canSendMessage}
                  />
                </div>
                <Button
                  type="primary"
                  icon={<FiSend size={16} />}
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || !canSendMessage}
                  className="h-9 md:h-10 px-3 md:px-4"
                >
                  <span className="hidden sm:inline">Send</span>
                </Button>
              </div>
              <p className="text-xs text-slate-400 mt-1.5 md:mt-2 hidden sm:block">
                {!isConnected
                  ? "Disconnected - reconnecting..."
                  : agentStatus === "offline"
                  ? "Go online to send messages"
                  : "Press Enter to send, Shift+Enter for new line"}
              </p>
            </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 hidden md:flex items-center justify-center bg-slate-50/50">
            <div className="text-center px-4">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#f9ce36]/20 flex items-center justify-center mx-auto mb-4">
                <HiOutlineChatBubbleLeftRight className="text-amber-600" size={28} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                {agentStatus === "offline"
                  ? "You are offline"
                  : "Select a chat"}
              </h3>
              <p className="text-sm text-slate-500 max-w-xs">
                {agentStatus === "offline"
                  ? "Go online to start receiving chats"
                  : "Accept a chat from the queue or select from active chats"}
              </p>
              {agentStatus === "offline" && (
                <Button
                  type="primary"
                  onClick={goOnline}
                  className="mt-4"
                >
                  Go Online
                </Button>
              )}
            </div>
          </div>
        )}
      </div>


      {/* Transfer Modal */}
      <Modal
        title="Transfer Chat"
        open={showTransferModal}
        onCancel={() => {
          setShowTransferModal(false);
          setSelectedAgent(null);
          setTransferReason("");
        }}
        onOk={handleTransfer}
        okText="Transfer"
        okButtonProps={{ disabled: !selectedAgent }}
        confirmLoading={loadingAgents}
      >
        <div className="py-4">
          <p className="text-slate-600 mb-4">
            Select an agent to transfer this chat to:
          </p>

          {loadingAgents ? (
            <div className="flex justify-center py-8">
              <Spin tip="Loading agents..." />
            </div>
          ) : onlineAgents.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No other agents are online
            </div>
          ) : (
            <Radio.Group
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full"
            >
              <Space direction="vertical" className="w-full">
                {onlineAgents.map((agent) => (
                  <Radio
                    key={agent.userId}
                    value={agent.userId}
                    className="w-full p-3 border rounded-lg hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{agent.username}</span>
                      <span className="text-xs text-slate-500">
                        {agent.currentChats}/{agent.maxChats} chats
                      </span>
                    </div>
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          )}

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Reason (optional)
            </label>
            <Input.TextArea
              placeholder="Enter reason for transfer..."
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </Modal>

      {/* Close Chat Confirmation Modal */}
      <Modal
        title="Close Chat"
        open={showCloseModal}
        onCancel={() => setShowCloseModal(false)}
        onOk={confirmCloseChat}
        okText="Yes, Close"
        okType="danger"
        okButtonProps={{ loading: isClosingChat }}
        cancelButtonProps={{ disabled: isClosingChat }}
      >
        <p className="py-4">Are you sure you want to close this chat?</p>
      </Modal>
    </div>
  );
}

export default SupportChat;
