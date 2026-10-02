import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FiActivity,
  FiBell,
  FiChevronLeft,
  FiChevronRight,
  FiGift,
  FiLogOut,
  FiMenu,
  FiPercent,
  FiShield,
  FiUserCheck,
  FiX,
} from "react-icons/fi";
import {
  HiOutlineBanknotes,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCog6Tooth,
  HiOutlineCube,
  HiOutlineHome,
  HiOutlineUsers,
} from "react-icons/hi2";
import { MdOutlineSms } from "react-icons/md";
import { Modal } from "antd";

import { useAuthState } from "../context/AuthContext";
import { normalizeStaffRole } from "../utils/authSession";
import { useGetSecondaryWallet } from "../hooks/useTransfer";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";

const ROLE_LABELS = {
  super_admin: "Super Admin",
  admin: "Admin",
  support: "Support",
};

// Sidebar grouped the way operators think about the business:
// what's happening, who's playing, where the money is, what's risky.
const NAV_SECTIONS = [
  {
    title: "Overview",
    items: [
      { text: "Dashboard", to: "/dashboard", icon: HiOutlineHome, hideFor: ["support"] },
      { text: "Support Console", to: "/agent/support", icon: FiBell, onlyFor: ["support"] },
    ],
  },
  {
    title: "Players & Betting",
    items: [
      { text: "Players", to: "/users", icon: HiOutlineUsers },
      { text: "Bets", to: "/bets", icon: HiOutlineCube },
      { text: "Transactions", to: "/transactions", icon: HiOutlineBanknotes },
    ],
  },
  {
    title: "Promotions",
    items: [
      { text: "Cashbacks", to: "/cashback", icon: FiPercent, roles: ["admin", "super_admin"] },
      { text: "Free Bets", to: "/free-bets", icon: FiGift, roles: ["super_admin"] },
      { text: "Bulk SMS", to: "/sms", icon: MdOutlineSms, roles: ["admin", "super_admin"] },
    ],
  },
  {
    title: "Risk & Compliance",
    items: [
      { text: "Fraud Alerts", to: "/fraud-alerts", icon: FiShield, roles: ["admin", "super_admin"] },
      { text: "Audit Logs", to: "/audit", icon: FiActivity, roles: ["admin", "super_admin"] },
    ],
  },
  {
    title: "Administration",
    items: [
      { text: "Staff", to: "/staff", icon: FiUserCheck, roles: ["super_admin"] },
      { text: "Support Admin", to: "/support-admin", icon: HiOutlineChatBubbleLeftRight, roles: ["super_admin"] },
      { text: "Settings", to: "/settings", icon: HiOutlineCog6Tooth, roles: ["admin", "super_admin"] },
    ],
  },
];

const PAGE_TITLES = [
  ["/dashboard", "Dashboard"],
  ["/users", "Players"],
  ["/bets", "Bets"],
  ["/transactions", "Transactions"],
  ["/sms", "Bulk SMS"],
  ["/cashback", "Cashbacks"],
  ["/audit", "Audit Logs"],
  ["/settings", "Settings"],
  ["/support-admin", "Support Admin"],
  ["/staff", "Staff Management"],
  ["/free-bets", "Free Bets"],
  ["/fraud-alerts", "Fraud Alerts"],
];

const canSee = (item, role) => {
  if (item.onlyFor) return item.onlyFor.includes(role);
  if (item.hideFor?.includes(role)) return false;
  return !item.roles || item.roles.includes(role);
};

const initialsOf = (user) => {
  const source = user?.name?.trim() || "";
  if (source) {
    return source
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }
  return (ROLE_LABELS[normalizeStaffRole(user)] || "ST").slice(0, 2).toUpperCase();
};

function NairobiClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="tabular hidden xl:inline text-xs text-slate-500 dark:text-slate-400" title="Nairobi time (EAT)">
      {now.toLocaleString("en-KE", {
        timeZone: "Africa/Nairobi",
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })}{" "}
      EAT
    </span>
  );
}

function DashboardLayout() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { logout, user } = useAuthState();
  const role = normalizeStaffRole(user);
  const canManageOperations = ["admin", "super_admin"].includes(role);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { secondaryWalletBalance, isLoading: treasuryLoading } =
    useGetSecondaryWallet(canManageOperations);

  const treasuryBalance = new Intl.NumberFormat("en-KE", {
    maximumFractionDigits: 0,
  }).format(Number(secondaryWalletBalance?.balance || 0));

  const confirmLogout = () => {
    logout();
    navigate("/login");
  };

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  // Close the drawer whenever the route changes (e.g. browser back on a phone).
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const pageTitle =
    location.pathname === "/"
      ? "Dashboard"
      : PAGE_TITLES.find(([path]) => location.pathname.startsWith(path))?.[1] || "Dashboard";

  const expanded = sidebarOpen || mobileMenuOpen;

  return (
    <div className="flex h-dvh bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <aside
        aria-label="Main navigation"
        className={`fixed md:static inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-all duration-300 ease-in-out
          ${expanded ? "w-64" : "w-[72px]"}
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0`}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 px-4">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            {expanded ? (
              <img src="/shilingibet.png" className="h-8 w-auto" alt="ShilingiBet" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand font-display text-sm font-black text-black">
                SB
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => (mobileMenuOpen ? closeMobileMenu() : setSidebarOpen((open) => !open))}
            aria-label={mobileMenuOpen ? "Close menu" : sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          >
            {mobileMenuOpen ? <FiX size={18} /> : sidebarOpen ? <FiChevronLeft size={18} /> : <FiChevronRight size={18} />}
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {NAV_SECTIONS.map((section) => {
            const items = section.items.filter((item) => canSee(item, role));
            if (!items.length) return null;
            return (
              <div key={section.title}>
                {expanded ? (
                  <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                    {section.title}
                  </p>
                ) : (
                  <div className="mx-auto mb-2 h-px w-6 bg-slate-200 dark:bg-slate-700" />
                )}
                <div className="space-y-0.5">
                  {items.map((item) => (
                    <SidebarItem
                      key={item.to}
                      icon={<item.icon size={19} />}
                      text={item.text}
                      to={item.to}
                      expanded={expanded}
                      onNavigate={closeMobileMenu}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 dark:border-slate-700 p-3">
          <button
            type="button"
            onClick={() => setIsModalVisible(true)}
            title="Log out"
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40 ${
              expanded ? "" : "justify-center"
            }`}
          >
            <FiLogOut size={19} />
            {expanded && <span className="text-sm font-medium">Log out</span>}
          </button>
        </div>
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden" onClick={closeMobileMenu} />
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-20 border-b border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 lg:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 md:hidden"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <FiMenu className="text-slate-600 dark:text-slate-300" size={22} />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold text-slate-800 dark:text-slate-100">{pageTitle}</h1>
                <NairobiClock />
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {canManageOperations && (
                <div
                  className="hidden items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 dark:border-emerald-900 dark:bg-emerald-950/40 sm:flex"
                  title="Money available to pay player withdrawals"
                >
                  <HiOutlineBanknotes className="shrink-0 text-emerald-600 dark:text-emerald-400" size={18} />
                  <div className="leading-tight">
                    <p className="hidden text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-400 md:block">
                      Payout float
                    </p>
                    <p className="tabular whitespace-nowrap text-xs font-semibold text-emerald-800 dark:text-emerald-300 sm:text-sm">
                      {treasuryLoading ? "Loading…" : `${secondaryWalletBalance?.currency || "KES"} ${treasuryBalance}`}
                    </p>
                  </div>
                </div>
              )}

              <ThemeToggle />
              <NotificationBell />

              <div className="flex items-center gap-3 border-l border-slate-200 pl-3 dark:border-slate-700">
                <div className="relative">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-sm font-bold text-black">
                    {initialsOf(user)}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-800" />
                </div>
                <div className="hidden lg:block">
                  <p className="max-w-[160px] truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                    {user?.name || user?.phone || "Staff"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{ROLE_LABELS[role] || "Staff"}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
          <div className="mx-auto max-w-[1600px] p-4 lg:p-6">
            <Outlet />
          </div>
        </main>

        <footer className="border-t border-slate-200 bg-white px-6 py-3 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-col items-center justify-between gap-1 text-xs text-slate-500 dark:text-slate-400 sm:flex-row">
            <span>© {new Date().getFullYear()} ShilingiBet Back Office</span>
            <span>Signed in as {ROLE_LABELS[role] || "Staff"} · all actions are audited</span>
          </div>
        </footer>
      </div>

      <Modal
        title="Log out?"
        open={isModalVisible}
        onOk={confirmLogout}
        onCancel={() => setIsModalVisible(false)}
        okText="Log out"
        cancelText="Stay signed in"
        okButtonProps={{ danger: true }}
        centered
      >
        <p className="text-slate-600 dark:text-slate-300">You'll need your password and an SMS code to sign back in.</p>
      </Modal>
    </div>
  );
}

function SidebarItem({ icon, text, to, expanded, onNavigate }) {
  return (
    <NavLink
      to={to}
      end
      onClick={onNavigate}
      title={expanded ? undefined : text}
      className={({ isActive }) =>
        `group relative flex items-center rounded-lg px-3 py-2.5 transition-colors ${expanded ? "" : "justify-center"} ${
          isActive
            ? "bg-brand/15 text-slate-900 dark:text-brand"
            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/60"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-brand" />}
          <span className="flex-shrink-0">{icon}</span>
          {expanded && <span className="ml-3 whitespace-nowrap text-sm font-medium">{text}</span>}
        </>
      )}
    </NavLink>
  );
}

export default DashboardLayout;
