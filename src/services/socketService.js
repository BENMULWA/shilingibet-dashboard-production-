import { io } from "socket.io-client";

import { SOCKET_URL as BASE_SOCKET_URL } from "../utils/ApiConfigs";

const SOCKET_URL = BASE_SOCKET_URL;

let socket = null;
let agentStatus = "offline";
const statusListeners = new Set();

const notifyAgentStatus = (status) => {
  agentStatus = status || "offline";
  statusListeners.forEach((listener) => listener(agentStatus));
};

export const getAgentStatus = () => agentStatus;

export const setAgentStatus = (status) => notifyAgentStatus(status);

export const subscribeAgentStatus = (listener) => {
  statusListeners.add(listener);
  listener(agentStatus);
  return () => statusListeners.delete(listener);
};

export const initializeSocket = (token) => {
  // Reuse the same instance while it is connecting as well as after it connects.
  // Creating one socket per component causes conflicting agent status events.
  if (socket) {
    return socket;
  }

  socket = io(`${SOCKET_URL}/support-chat`, {
    auth: {
      token: token,
    },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
    notifyAgentStatus("offline");
  });

  socket.on("agent:online_confirmed", () => notifyAgentStatus("online"));
  socket.on("agent:status_confirmed", ({ status }) => notifyAgentStatus(status));

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.emit("agent:go_offline");
    socket.disconnect();
    socket = null;
  }
  notifyAgentStatus("offline");
};

export default {
  initializeSocket,
  getSocket,
  disconnectSocket,
  getAgentStatus,
  setAgentStatus,
  subscribeAgentStatus,
};
