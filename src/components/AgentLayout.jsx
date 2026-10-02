import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { FiLogOut, FiMenu } from "react-icons/fi";
import {
  HiOutlineBanknotes,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCube,
  HiOutlineUsers,
} from "react-icons/hi2";
import { useAuthState } from "../context/AuthContext";
import { Modal, Switch } from "antd";
import {
  disconnectSocket,
  initializeSocket,
  setAgentStatus,
  subscribeAgentStatus,
} from "../services/socketService";

function AgentLayout() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const onlineRef = useRef(false);
  const { logout } = useAuthState();
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(sessionStorage.getItem("user"));
  const pageTitles = {
    "/agent/support": "Support Chat",
    "/agent/users": "Users",
    "/agent/bets": "Bets",
    "/agent/transactions": "Transactions",
  };
  const pageTitle = pageTitles[location.pathname] || "Support";

  useEffect(() => {
    const token = user?.token;
    if (!token) return undefined;

    const socket = initializeSocket(token);
    const handleConnect = () => {
      setIsConnected(true);
      if (onlineRef.current) socket.emit("agent:go_online");
    };
    const handleDisconnect = () => setIsConnected(false);
    const unsubscribeStatus = subscribeAgentStatus((status) => {
      const online = status === "online";
      onlineRef.current = online;
      setIsOnline(online);
    });

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    if (socket.connected) handleConnect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      unsubscribeStatus();
      disconnectSocket();
    };
  }, [user?.token]);

  const handleAvailabilityChange = (checked) => {
    const socket = initializeSocket(user?.token);
    onlineRef.current = checked;
    setIsOnline(checked);
    setAgentStatus(checked ? "online" : "offline");
    if (socket.connected) {
      socket.emit(checked ? "agent:go_online" : "agent:go_offline");
    }
  };

  const handleLogout = () => setIsModalVisible(true);
  const confirmLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Minimal Sidebar - Hidden on mobile */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-30 w-56 flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-transform duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* Logo Section */}
        <div className="flex items-center gap-3 px-4 h-14 md:h-16 border-b border-slate-100 dark:border-slate-700">
          <div className="w-9 h-9 rounded-lg bg-[#f9ce36] flex items-center justify-center">
            <span className="text-slate-900 dark:text-slate-100 font-bold text-sm">N</span>
          </div>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Support</span>
        </div>

        {/* Agent tools */}
        <nav className="flex-1 py-4 px-3 flex flex-col gap-2">
          <NavLink
            to="/agent/support"
            title="Support Chat"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                isActive ? "bg-[#f9ce36] text-black" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`
            }
          >
            <HiOutlineChatBubbleLeftRight size={20} />
            <span className="text-sm font-medium">Support Chat</span>
          </NavLink>
          <NavLink
            to="/agent/users"
            title="Users (read only)"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                isActive ? "bg-[#f9ce36] text-black" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`
            }
          >
            <HiOutlineUsers size={20} />
            <span className="text-sm font-medium">Users</span>
          </NavLink>
          <NavLink
            to="/agent/bets"
            title="Bets (read only)"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                isActive ? "bg-[#f9ce36] text-black" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`
            }
          >
            <HiOutlineCube size={20} />
            <span className="text-sm font-medium">Bets</span>
          </NavLink>
          <NavLink
            to="/agent/transactions"
            title="Transactions (read only)"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                isActive ? "bg-[#f9ce36] text-black" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`
            }
          >
            <HiOutlineBanknotes size={20} />
            <span className="text-sm font-medium">Transactions</span>
          </NavLink>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 transition-colors"
          >
            <FiLogOut size={20} />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-10 sticky top-0">
          <div className="flex items-center justify-between px-3 md:px-4 lg:px-6 h-14 md:h-16">
            <div className="flex items-center space-x-3 md:space-x-4">
              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                onClick={() => setMobileMenuOpen(true)}
              >
                <FiMenu className="text-slate-600 dark:text-slate-300" size={20} />
              </button>
              <div>
                <h4 className="text-sm md:text-base font-semibold text-slate-800 dark:text-slate-100">
                  {pageTitle}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                  Agent Dashboard
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5">
                <Switch
                  size="small"
                  checked={isOnline}
                  disabled={!isConnected}
                  onChange={handleAvailabilityChange}
                  aria-label="Toggle support availability"
                />
                <span className={`text-xs font-medium ${isOnline ? "text-emerald-700" : "text-slate-500 dark:text-slate-400"}`}>
                  {isOnline ? "Online" : "Offline"}
                </span>
              </div>
              {/* Mobile logout button */}
              <button
                onClick={handleLogout}
                className="md:hidden p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 transition-colors"
              >
                <FiLogOut size={18} />
              </button>
              {/* User Avatar */}
              <div className="flex items-center space-x-2 md:space-x-3 pl-2 md:pl-3 border-l border-slate-200 dark:border-slate-700">
                <div className="relative">
                  <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-[#f9ce36] flex items-center justify-center">
                    <span className="text-slate-900 dark:text-slate-100 font-medium text-xs md:text-sm">
                      {user?.phone?.slice(-2) || "AG"}
                    </span>
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 md:w-2.5 md:h-2.5 rounded-full border-2 border-white ${isOnline ? "bg-emerald-500" : "bg-slate-400"}`} />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {user?.phone || "Agent"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Support Agent</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-hidden bg-slate-50 dark:bg-slate-900">
          <div className="p-2 md:p-4 lg:p-6 h-full">
            <Outlet />
          </div>
        </main>

        {/* Footer - Hidden on mobile */}
        <footer className="hidden sm:block bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-2 md:py-3 px-4 md:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{`© ${new Date().getFullYear()} ShilingiBet. All rights reserved.`}</span>
            <span>Powered by ShilingiBet</span>
          </div>
        </footer>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal
        title="Confirm Logout"
        open={isModalVisible}
        onOk={confirmLogout}
        onCancel={() => setIsModalVisible(false)}
        okText="Yes, Logout"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
        centered
        width="90%"
        style={{ maxWidth: 400 }}
      >
        <p className="text-slate-600 dark:text-slate-300">Are you sure you want to logout?</p>
      </Modal>
    </div>
  );
}

export default AgentLayout;
