import { useState, useCallback } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  FiMenu,
  FiChevronLeft,
  FiChevronRight,
  FiBell,
  FiLogOut,
  FiGift,
  FiShield,
  FiPercent,
  FiActivity,
  FiUserCheck,
} from "react-icons/fi";
import {
  HiOutlineHome,
  HiOutlineUsers,
  HiOutlineCog6Tooth,
  HiOutlineCube,
  HiOutlineBanknotes,
  HiOutlineChatBubbleLeftRight,
} from "react-icons/hi2";
import { MdOutlineSms } from "react-icons/md";
import { useAuthState } from "../context/AuthContext";
import { normalizeStaffRole } from "../utils/authSession";
import { Modal } from "antd";
import { useGetSecondaryWallet } from "../hooks/useTransfer";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";

function DashboardLayout() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { logout, user } = useAuthState();
  const isSuperAdmin = normalizeStaffRole(user) === "super_admin";
  const isSupport = normalizeStaffRole(user) === "support";
  const canManageOperations = ["admin", "super_admin"].includes(
    normalizeStaffRole(user),
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { secondaryWalletBalance, isLoading: treasuryLoading } =
    useGetSecondaryWallet(canManageOperations);

  const treasuryBalance = new Intl.NumberFormat("en-KE", {
    maximumFractionDigits: 2,
  }).format(Number(secondaryWalletBalance?.balance || 0));

  const handleLogout = () => setIsModalVisible(true);
  const confirmLogout = () => {
    logout();
    navigate("/login");
  };

  const isMobile = () => window.innerWidth < 768;

  const handleItemClick = useCallback(() => {
    if (isMobile()) setMobileMenuOpen(false);
  }, []);

  const getPageTitle = () => {
    if (location.pathname.startsWith("/dashboard") || location.pathname === "/")
      return "Dashboard";
    if (location.pathname.startsWith("/users")) return "Users";
    if (location.pathname.startsWith("/bets")) return "Bets";
    if (location.pathname.startsWith("/transactions")) return "Transactions";
    if (location.pathname.startsWith("/sms")) return "Bulk SMS";
    if (location.pathname.startsWith("/cashback")) return "Cashbacks";
    if (location.pathname.startsWith("/audit")) return "Audit";
    if (location.pathname.startsWith("/settings")) return "Settings";
    if (location.pathname.startsWith("/support-admin")) return "Support Admin";
    if (location.pathname.startsWith("/staff")) return "Staff Management";
    if (location.pathname.startsWith("/support")) return "Support Chat";
    if (location.pathname.startsWith("/free-bets")) return "Free Bets";
    if (location.pathname.startsWith("/fraud-alerts")) return "Fraud Alerts";
    return "Dashboard";
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-30 flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ease-in-out
          ${sidebarOpen ? "w-64" : "w-20"}
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0`}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100 dark:border-slate-700">
          {sidebarOpen ? (
            <Link to="/" className="flex items-center space-x-2">
              <img src="/shilingibet.png" className="h-8 w-auto" alt="Logo" />
            </Link>
          ) : (
            <div className="w-full flex justify-center">
              <div className="w-9 h-9 rounded-lg bg-[#f9ce36] flex items-center justify-center">
                <span className="text-slate-900 font-bold text-sm">N</span>
              </div>
            </div>
          )}
          <button
            onClick={() =>
              isMobile()
                ? setMobileMenuOpen(false)
                : setSidebarOpen(!sidebarOpen)
            }
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            {sidebarOpen ? (
              <FiChevronLeft size={18} />
            ) : (
              <FiChevronRight size={18} />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {!isSupport && (
            <SidebarItem
              icon={<HiOutlineHome size={20} />}
              text="Dashboard"
              to="/dashboard"
              sidebarOpen={sidebarOpen}
              onNavigate={handleItemClick}
            />
          )}
          {isSupport && (
            <SidebarItem
              icon={<FiBell size={20} />}
              text="Support Console"
              to="/agent/support"
              sidebarOpen={sidebarOpen}
              onNavigate={handleItemClick}
            />
          )}
          {isSuperAdmin && (
            <>
              <SidebarItem
                icon={<FiUserCheck size={20} />}
                text="Staff"
                to="/staff"
                sidebarOpen={sidebarOpen}
                onNavigate={handleItemClick}
              />
              <SidebarItem
                icon={<HiOutlineChatBubbleLeftRight size={20} />}
                text="Support Admin"
                to="/support-admin"
                sidebarOpen={sidebarOpen}
                onNavigate={handleItemClick}
              />
              <SidebarItem
                icon={<FiGift size={20} />}
                text="Free Bets"
                to="/free-bets"
                sidebarOpen={sidebarOpen}
                onNavigate={handleItemClick}
              />
            </>
          )}
          <SidebarItem
            icon={<HiOutlineUsers size={20} />}
            text="Users"
            to="/users"
            sidebarOpen={sidebarOpen}
            onNavigate={handleItemClick}
          />
          <SidebarItem
            icon={<HiOutlineCube size={20} />}
            text="Bets"
            to="/bets"
            sidebarOpen={sidebarOpen}
            onNavigate={handleItemClick}
          />
          <SidebarItem
            icon={<HiOutlineBanknotes size={20} />}
            text="Transactions"
            to="/transactions"
            sidebarOpen={sidebarOpen}
            onNavigate={handleItemClick}
          />
          {canManageOperations && (
            <>
              <SidebarItem
                icon={<MdOutlineSms size={20} />}
                text="Bulk SMS"
                to="/sms"
                sidebarOpen={sidebarOpen}
                onNavigate={handleItemClick}
              />
              <SidebarItem
                icon={<FiShield size={20} />}
                text="Fraud Alerts"
                to="/fraud-alerts"
                sidebarOpen={sidebarOpen}
                onNavigate={handleItemClick}
              />
              <SidebarItem
                icon={<FiPercent size={20} />}
                text="Cashbacks"
                to="/cashback"
                sidebarOpen={sidebarOpen}
                onNavigate={handleItemClick}
              />
              <SidebarItem
                icon={<FiActivity size={20} />}
                text="Audit Logs"
                to="/audit"
                sidebarOpen={sidebarOpen}
                onNavigate={handleItemClick}
              />
              <SidebarItem
                icon={<HiOutlineCog6Tooth size={20} />}
                text="Settings"
                to="/settings"
                sidebarOpen={sidebarOpen}
                onNavigate={handleItemClick}
              />
            </>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors ${
              !sidebarOpen && "justify-center"
            }`}
          >
            <FiLogOut size={20} />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
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
          <div className="flex items-center justify-between px-4 lg:px-6 h-16">
            <div className="flex items-center space-x-4">
              <button
                className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                onClick={() => setMobileMenuOpen(true)}
              >
                <FiMenu className="text-slate-600 dark:text-slate-300" size={22} />
              </button>
              <div className="hidden sm:block">
                <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                  {getPageTitle()}
                </h4>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              {canManageOperations && <div
                className="flex items-center gap-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1.5"
                title="Available withdrawal treasury balance"
              >
                <HiOutlineBanknotes
                  className="shrink-0 text-emerald-600 dark:text-emerald-400"
                  size={18}
                />
                <div className="leading-tight">
                  <p className="hidden md:block text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                    Withdrawal balance
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-300 whitespace-nowrap">
                    {treasuryLoading
                      ? "Loading…"
                      : `${secondaryWalletBalance?.currency || "KES"} ${treasuryBalance}`}
                  </p>
                </div>
              </div>}

              <ThemeToggle />

              {/* Notifications */}
              <NotificationBell />

              {/* User Avatar */}
              <div className="flex items-center space-x-3 pl-3 border-l border-slate-200 dark:border-slate-700">
                <div className="relative">
                  <div className="w-9 h-9 rounded-lg bg-[#f9ce36] flex items-center justify-center">
                    <span className="text-slate-900 font-medium text-sm">
                      AD
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800" />
                </div>
                <div className="hidden lg:block">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Admin</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
          <div className="p-4 lg:p-6">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-3 px-6">
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
      >
        <p className="text-slate-600 dark:text-slate-300">Are you sure you want to logout?</p>
      </Modal>
    </div>
  );
}

function SidebarItem({ icon, text, to, sidebarOpen, onNavigate }) {
  return (
    <NavLink
      to={to}
      end
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center rounded-lg px-3 py-2.5 transition-colors ${
          sidebarOpen ? "" : "justify-center"
        } ${
          isActive
            ? "bg-[#f9ce36] text-black"
            : "text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700"
        }`
      }
    >
      <span className="flex-shrink-0">{icon}</span>
      {sidebarOpen && (
        <span className="ml-3 text-sm font-medium whitespace-nowrap">
          {text}
        </span>
      )}
    </NavLink>
  );
}

export default DashboardLayout;
