import { useState, useEffect, useCallback, useRef } from "react";
import { Tabs, Table, Button, Select, Modal, Input, Spin, Alert, Tag } from "antd";
import { FiWifi, FiWifiOff, FiEye, FiRefreshCw } from "react-icons/fi";
import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2";
import { io } from "socket.io-client";
import { API_URL, SOCKET_URL } from "../utils/ApiConfigs";

const { TabPane } = Tabs;
const { TextArea } = Input;

function SuperAdminDashboard() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [agents, setAgents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [agentStatusFilter, setAgentStatusFilter] = useState("");
  const [chatStatusFilter, setChatStatusFilter] = useState("");

  // Chat Viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentViewSession, setCurrentViewSession] = useState(null);
  const currentViewSessionRef = useRef(null);
  const [viewerMessages, setViewerMessages] = useState([]);
  const [viewerLoading, setViewerLoading] = useState(false);

  // Ban Modal
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banTarget, setBanTarget] = useState(null);
  const [banReason, setBanReason] = useState("");

  const stats = {
    totalAgents: agents.length,
    onlineAgents: agents.filter((agent) => agent.onlineStatus === "online").length,
    waitingChats: sessions.filter((session) => session.status === "waiting").length,
    activeChats: sessions.filter((session) => session.status === "active").length,
  };

  const user = JSON.parse(sessionStorage.getItem("user"));
  const token = user?.token;

  // Initialize Socket Connection
  useEffect(() => {
    if (!token) return;

    const newSocket = io(`${SOCKET_URL}/support-chat`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      setError(null);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    newSocket.on("connect_error", (err) => {
      setError("Connection failed: " + err.message);
      setIsConnected(false);
    });

    // Live updates
    newSocket.on("agent:status_changed", () => loadAgents());
    newSocket.on("agent:new_chat_waiting", () => loadSessions());
    newSocket.on("agent:chat_taken", () => loadSessions());
    newSocket.on("chat:new_message", (data) => {
      if (!currentViewSessionRef.current) return;
      setViewerMessages((prev) => [...prev, data.message || data]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  // Load Data
  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadAgents(), loadSessions()]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, loadData]);

  const loadAgents = async () => {
    try {
      let url = `${API_URL}/support-chat/superadmin/agents?`;
      if (agentStatusFilter) url += `status=${agentStatusFilter}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success || data.status) {
        setAgents(data.data.agents);
      }
    } catch (error) {
      console.error("Error loading agents:", error);
    }
  };

  const loadSessions = async () => {
    try {
      let url = `${API_URL}/support-chat/superadmin/sessions?limit=50&`;
      if (chatStatusFilter) url += `status=${chatStatusFilter}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success || data.status) {
        setSessions(data.data.sessions);
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
    }
  };

  const showBanModal = (userId, accountId, username) => {
    setBanTarget({ userId, accountId, username });
    setBanModalOpen(true);
  };

  const handleBan = async () => {
    if (!banTarget) return;

    try {
      await fetch(`${API_URL}/support-chat/superadmin/agents/${banTarget.userId}/ban`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId: banTarget.accountId,
          ban: true,
          reason: banReason,
        }),
      });

      setBanModalOpen(false);
      setBanReason("");
      setBanTarget(null);
      loadAgents();
    } catch (error) {
      console.error("Error banning agent:", error);
    }
  };

  const unbanAgent = async (userId, accountId) => {
    try {
      await fetch(`${API_URL}/support-chat/superadmin/agents/${userId}/ban`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId,
          ban: false,
        }),
      });
      loadAgents();
    } catch (error) {
      console.error("Error unbanning agent:", error);
    }
  };

  const viewChat = async (sessionId) => {
    setViewerLoading(true);
    setViewerOpen(true);

    try {
      const response = await fetch(`${API_URL}/support-chat/superadmin/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success || data.status) {
        setCurrentViewSession(data.data.session);
        currentViewSessionRef.current = data.data.session.sessionId;
        setViewerMessages(data.data.messages);

        // Join session for real-time updates
        if (socket) {
          socket.emit("admin:view_chat", { sessionId });
        }
      }
    } catch (error) {
      console.error("Error viewing chat:", error);
    } finally {
      setViewerLoading(false);
    }
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setCurrentViewSession(null);
    currentViewSessionRef.current = null;
    setViewerMessages([]);
  };

  // Update filters
  useEffect(() => {
    loadAgents();
  }, [agentStatusFilter]);

  useEffect(() => {
    loadSessions();
  }, [chatStatusFilter]);

  // Table Columns
  const agentColumns = [
    {
      title: "Agent",
      dataIndex: "username",
      key: "username",
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "active" ? "success" : status === "suspended" ? "warning" : "error"}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Online",
      dataIndex: "onlineStatus",
      key: "onlineStatus",
      render: (status) => (
        <Tag color={status === "online" ? "success" : "default"}>{status}</Tag>
      ),
    },
    {
      title: "Chats Handled",
      key: "chatsHandled",
      render: (_, record) => record.metrics?.totalChatsHandled || 0,
    },
    {
      title: "Avg Rating",
      key: "avgRating",
      render: (_, record) => {
        if (record.metrics?.ratingsCount) {
          return (record.metrics.totalRatingsSum / record.metrics.ratingsCount).toFixed(1);
        }
        return "N/A";
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <>
          {record.status === "banned" ? (
            <Button size="small" type="primary" onClick={() => unbanAgent(record.userId, record.accountId)}>
              Unban
            </Button>
          ) : record.status === "active" ? (
            <Button size="small" danger onClick={() => showBanModal(record.userId, record.accountId, record.username)}>
              Ban
            </Button>
          ) : (
            <Button size="small" type="primary" onClick={() => unbanAgent(record.userId, record.accountId)}>
              Activate
            </Button>
          )}
        </>
      ),
    },
  ];

  const sessionColumns = [
    {
      title: "Customer",
      key: "customer",
      render: (_, record) => (
        <span className="font-medium">{record.customer?.name || "Guest"}</span>
      ),
    },
    {
      title: "Agent",
      key: "agent",
      render: (_, record) => {
        return record.assignedAgentId?.name || "Unassigned";
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          color={
            status === "active"
              ? "success"
              : status === "waiting"
              ? "warning"
              : status === "closed"
              ? "default"
              : "error"
          }
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "Messages",
      dataIndex: "messageCount",
      key: "messageCount",
      render: (val) => val || 0,
    },
    {
      title: "Started",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (val) => new Date(val).toLocaleString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button size="small" type="primary" icon={<FiEye />} onClick={() => viewChat(record.sessionId)}>
          View
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 flex items-center justify-center min-h-[400px]">
        <Spin size="large" tip="Loading dashboard..." />
      </div>
    );
  }

  if (error && !isConnected) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8">
        <Alert type="error" message="Connection Error" description={error} showIcon />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-[#f9ce36]/20 flex items-center justify-center flex-shrink-0">
              <HiOutlineChatBubbleLeftRight className="text-amber-600" size={20} />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100">SuperAdmin Dashboard</h1>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 hidden sm:block">Monitor and manage all support chat operations</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div
              className={`flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-xs md:text-sm ${
                isConnected ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              }`}
            >
              {isConnected ? <FiWifi size={14} /> : <FiWifiOff size={14} />}
              <span className="font-medium">{isConnected ? "Connected" : "Offline"}</span>
            </div>
            <Button icon={<FiRefreshCw />} onClick={loadData} size="middle" className="hidden sm:flex">
              Refresh
            </Button>
            <Button icon={<FiRefreshCw />} onClick={loadData} size="small" className="sm:hidden" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 md:p-5">
          <h3 className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-1">Support Staff</h3>
          <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.totalAgents}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 md:p-5">
          <h3 className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-1">Agents Online</h3>
          <p className="text-xl md:text-2xl font-bold text-emerald-600">{stats.onlineAgents}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 md:p-5">
          <h3 className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-1">Waiting Chats</h3>
          <p className="text-xl md:text-2xl font-bold text-blue-600">{stats.waitingChats}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 md:p-5">
          <h3 className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-1">Active Chats</h3>
          <p className="text-xl md:text-2xl font-bold text-amber-600">{stats.activeChats}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <Tabs defaultActiveKey="agents" className="px-3 md:px-6 pt-4">
          <TabPane tab="Agents" key="agents">
            <div className="flex flex-wrap gap-2 md:gap-4 mb-4">
              <Select
                placeholder="All Status"
                allowClear
                className="w-full sm:w-auto"
                style={{ minWidth: 120 }}
                value={agentStatusFilter || undefined}
                onChange={(val) => setAgentStatusFilter(val || "")}
                options={[
                  { label: "Active", value: "active" },
                  { label: "Suspended", value: "suspended" },
                  { label: "Banned", value: "banned" },
                ]}
              />
            </div>
            <div className="overflow-x-auto -mx-3 md:-mx-6">
              <div className="min-w-[700px] px-3 md:px-6">
                <Table
                  dataSource={agents}
                  columns={agentColumns}
                  rowKey={(record) => `${record.userId}-${record.accountId}`}
                  pagination={{ pageSize: 10 }}
                  size="small"
                />
              </div>
            </div>
          </TabPane>

          <TabPane tab="Active Chats" key="chats">
            <div className="flex flex-wrap gap-2 md:gap-4 mb-4">
              <Select
                placeholder="All Status"
                allowClear
                className="w-full sm:w-auto"
                style={{ minWidth: 120 }}
                value={chatStatusFilter || undefined}
                onChange={(val) => setChatStatusFilter(val || "")}
                options={[
                  { label: "Waiting", value: "waiting" },
                  { label: "Active", value: "active" },
                  { label: "Closed", value: "closed" },
                ]}
              />
            </div>
            <div className="overflow-x-auto -mx-3 md:-mx-6">
              <div className="min-w-[650px] px-3 md:px-6">
                <Table
                  dataSource={sessions}
                  columns={sessionColumns}
                  rowKey="sessionId"
                  pagination={{ pageSize: 10 }}
                  size="small"
                />
              </div>
            </div>
          </TabPane>
        </Tabs>
      </div>

      {/* Chat Viewer Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <HiOutlineChatBubbleLeftRight />
            <span className="text-sm md:text-base">Chat Viewer (Read-only)</span>
          </div>
        }
        open={viewerOpen}
        onCancel={closeViewer}
        footer={null}
        width="95%"
        style={{ maxWidth: 500 }}
      >
        {viewerLoading ? (
          <div className="flex justify-center py-8">
            <Spin tip="Loading chat..." />
          </div>
        ) : (
          <>
            {currentViewSession && (
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 md:p-4 mb-4">
                <p className="text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Customer:</span>{" "}
                  <span className="font-medium">{currentViewSession.customer?.name || "Guest"}</span>
                </p>
                <p className="text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Status:</span>{" "}
                  <Tag
                    color={
                      currentViewSession.status === "active"
                        ? "success"
                        : currentViewSession.status === "waiting"
                        ? "warning"
                        : "default"
                    }
                  >
                    {currentViewSession.status}
                  </Tag>
                </p>
              </div>
            )}
            <div className="max-h-[50vh] md:max-h-96 overflow-y-auto space-y-3 p-2">
              {viewerMessages.map((msg, index) => (
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
                    <div className="bg-amber-50 text-amber-800 px-3 md:px-4 py-2 rounded-full text-xs md:text-sm">
                      {msg.content}
                    </div>
                  ) : (
                    <div
                      className={`max-w-[85%] md:max-w-[80%] px-3 md:px-4 py-2 rounded-2xl ${
                        msg.senderType === "agent"
                          ? "bg-[#f9ce36] text-slate-900 dark:text-slate-100 rounded-br-md"
                          : "bg-slate-200 text-slate-800 dark:text-slate-100 rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              {viewerMessages.length === 0 && (
                <p className="text-center text-slate-500 dark:text-slate-400 py-8">No messages yet</p>
              )}
            </div>
          </>
        )}
      </Modal>

      {/* Ban Modal */}
      <Modal
        title={`Ban ${banTarget?.username || "Agent"}`}
        open={banModalOpen}
        onCancel={() => {
          setBanModalOpen(false);
          setBanTarget(null);
          setBanReason("");
        }}
        onOk={handleBan}
        okText="Confirm Ban"
        okButtonProps={{ danger: true }}
      >
        <div className="py-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Reason</label>
          <TextArea
            placeholder="Enter reason for banning..."
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            rows={3}
          />
        </div>
      </Modal>
    </div>
  );
}

export default SuperAdminDashboard;
