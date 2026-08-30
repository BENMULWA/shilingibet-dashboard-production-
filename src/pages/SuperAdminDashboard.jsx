import { useState, useEffect, useCallback } from "react";
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
  const [operators, setOperators] = useState([]);
  const [agents, setAgents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [agentTenantFilter, setAgentTenantFilter] = useState("");
  const [agentStatusFilter, setAgentStatusFilter] = useState("");
  const [chatTenantFilter, setChatTenantFilter] = useState("");
  const [chatStatusFilter, setChatStatusFilter] = useState("");

  // Chat Viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentViewSession, setCurrentViewSession] = useState(null);
  const [viewerMessages, setViewerMessages] = useState([]);
  const [viewerLoading, setViewerLoading] = useState(false);

  // Ban Modal
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banTarget, setBanTarget] = useState(null);
  const [banReason, setBanReason] = useState("");

  // Stats
  const [stats, setStats] = useState({
    totalOperators: 0,
    activeOperators: 0,
    totalOnlineAgents: 0,
    activeChats: 0,
  });

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
      if (currentViewSession === data.sessionId) {
        setViewerMessages((prev) => [...prev, data.message]);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  // Load Data
  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadOperators(), loadAgents(), loadSessions()]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, loadData]);

  const loadOperators = async () => {
    try {
      const response = await fetch(`${API_URL}/support-chat/superadmin/operators`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.status) {
        setOperators(data.data.operators);
        calculateStats(data.data.operators);
      }
    } catch (error) {
      console.error("Error loading operators:", error);
    }
  };

  const loadAgents = async () => {
    try {
      let url = `${API_URL}/support-chat/superadmin/agents?`;
      if (agentTenantFilter) url += `tenantId=${agentTenantFilter}&`;
      if (agentStatusFilter) url += `status=${agentStatusFilter}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.status) {
        setAgents(data.data.agents);
      }
    } catch (error) {
      console.error("Error loading agents:", error);
    }
  };

  const loadSessions = async () => {
    try {
      let url = `${API_URL}/support-chat/superadmin/sessions?limit=50&`;
      if (chatTenantFilter) url += `tenantId=${chatTenantFilter}&`;
      if (chatStatusFilter) url += `status=${chatStatusFilter}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.status) {
        setSessions(data.data.sessions);
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
    }
  };

  const calculateStats = (ops) => {
    let totalOnline = 0;
    let totalActive = 0;
    let activeOps = 0;

    ops.forEach((op) => {
      const isActive = op.status === "active" && op.supportChat?.enabled;
      if (isActive) activeOps++;
      totalOnline += op.onlineAgentCount || 0;
      totalActive += op.liveStats?.active || 0;
    });

    setStats({
      totalOperators: ops.length,
      activeOperators: activeOps,
      totalOnlineAgents: totalOnline,
      activeChats: totalActive,
    });
  };

  // Actions
  const toggleOperator = async (tenantId, enabled) => {
    try {
      await fetch(`${API_URL}/support-chat/superadmin/operators/${tenantId}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled }),
      });
      loadOperators();
    } catch (error) {
      console.error("Error toggling operator:", error);
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

      if (data.status) {
        setCurrentViewSession(data.data.session);
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
    setViewerMessages([]);
  };

  // Update filters
  useEffect(() => {
    loadAgents();
  }, [agentTenantFilter, agentStatusFilter]);

  useEffect(() => {
    loadSessions();
  }, [chatTenantFilter, chatStatusFilter]);

  // Table Columns
  const operatorColumns = [
    {
      title: "Operator",
      dataIndex: "name",
      key: "name",
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Domain",
      dataIndex: "domain",
      key: "domain",
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => {
        const isActive = record.status === "active" && record.supportChat?.enabled;
        return (
          <Tag color={isActive ? "success" : "error"}>
            {isActive ? "Active" : "Inactive"}
          </Tag>
        );
      },
    },
    {
      title: "Agents Online",
      dataIndex: "onlineAgentCount",
      key: "onlineAgentCount",
      render: (val) => val || 0,
    },
    {
      title: "Waiting",
      key: "waiting",
      render: (_, record) => record.liveStats?.waiting || 0,
    },
    {
      title: "Active Chats",
      key: "active",
      render: (_, record) => record.liveStats?.active || 0,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button
          size="small"
          type={record.supportChat?.enabled ? "default" : "primary"}
          danger={record.supportChat?.enabled}
          onClick={() => toggleOperator(record._id, !record.supportChat?.enabled)}
        >
          {record.supportChat?.enabled ? "Disable" : "Enable"}
        </Button>
      ),
    },
  ];

  const agentColumns = [
    {
      title: "Agent",
      dataIndex: "username",
      key: "username",
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Operator",
      dataIndex: "tenantName",
      key: "tenantName",
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
      title: "Operator",
      dataIndex: "tenantName",
      key: "tenantName",
      render: (val) => val || "Unknown",
    },
    {
      title: "Agent",
      key: "agent",
      render: (_, record) => {
        const agentAccount = record.assignedAgentId?.accounts?.find(
          (acc) => acc.tenant?.toString() === record.tenantId?.toString()
        );
        return agentAccount?.username || "Unassigned";
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
      <div className="bg-white rounded-xl border border-slate-200 p-8 flex items-center justify-center min-h-[400px]">
        <Spin size="large" tip="Loading dashboard..." />
      </div>
    );
  }

  if (error && !isConnected) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8">
        <Alert type="error" message="Connection Error" description={error} showIcon />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-[#f9ce36]/20 flex items-center justify-center flex-shrink-0">
              <HiOutlineChatBubbleLeftRight className="text-amber-600" size={20} />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-900">SuperAdmin Dashboard</h1>
              <p className="text-xs md:text-sm text-slate-500 hidden sm:block">Monitor and manage all support chat operations</p>
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
        <div className="bg-white rounded-xl border border-slate-200 p-3 md:p-5">
          <h3 className="text-xs md:text-sm text-slate-500 mb-1">Total Operators</h3>
          <p className="text-xl md:text-2xl font-bold text-slate-900">{stats.totalOperators}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 md:p-5">
          <h3 className="text-xs md:text-sm text-slate-500 mb-1">Active Operators</h3>
          <p className="text-xl md:text-2xl font-bold text-emerald-600">{stats.activeOperators}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 md:p-5">
          <h3 className="text-xs md:text-sm text-slate-500 mb-1">Agents Online</h3>
          <p className="text-xl md:text-2xl font-bold text-blue-600">{stats.totalOnlineAgents}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 md:p-5">
          <h3 className="text-xs md:text-sm text-slate-500 mb-1">Active Chats</h3>
          <p className="text-xl md:text-2xl font-bold text-amber-600">{stats.activeChats}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <Tabs defaultActiveKey="operators" className="px-3 md:px-6 pt-4">
          <TabPane tab="Operators" key="operators">
            <div className="overflow-x-auto -mx-3 md:-mx-6">
              <div className="min-w-[600px] px-3 md:px-6">
                <Table
                  dataSource={operators}
                  columns={operatorColumns}
                  rowKey="_id"
                  pagination={{ pageSize: 10 }}
                  size="small"
                  className="md:table-auto"
                />
              </div>
            </div>
          </TabPane>

          <TabPane tab="Agents" key="agents">
            <div className="flex flex-wrap gap-2 md:gap-4 mb-4">
              <Select
                placeholder="All Operators"
                allowClear
                className="w-full sm:w-auto"
                style={{ minWidth: 150 }}
                value={agentTenantFilter || undefined}
                onChange={(val) => setAgentTenantFilter(val || "")}
                options={operators.map((op) => ({ label: op.name, value: op._id }))}
              />
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
                placeholder="All Operators"
                allowClear
                className="w-full sm:w-auto"
                style={{ minWidth: 150 }}
                value={chatTenantFilter || undefined}
                onChange={(val) => setChatTenantFilter(val || "")}
                options={operators.map((op) => ({ label: op.name, value: op._id }))}
              />
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
              <div className="bg-slate-50 rounded-lg p-3 md:p-4 mb-4">
                <p className="text-sm">
                  <span className="text-slate-500">Customer:</span>{" "}
                  <span className="font-medium">{currentViewSession.customer?.name || "Guest"}</span>
                </p>
                <p className="text-sm">
                  <span className="text-slate-500">Status:</span>{" "}
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
                          ? "bg-[#f9ce36] text-slate-900 rounded-br-md"
                          : "bg-slate-200 text-slate-800 rounded-bl-md"
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
                <p className="text-center text-slate-500 py-8">No messages yet</p>
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
          <label className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
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
