import { Suspense, lazy, useMemo } from "react";
import { BrowserRouter as Router, Link, Navigate, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider, theme as antdTheme } from "antd";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { ROLE_ACCESS } from "./utils/authSession";
import AppLayout from "./pages/AppLayout";
import AgentAppLayout from "./pages/AgentAppLayout";
import DashboardLayout from "./components/DashboardLayout";
import AgentLayout from "./components/AgentLayout";
import RoleRoute from "./components/RoleRoute";
import Loader from "./components/Loader";
import Login from "./pages/auth/Login";

// Pages load on demand so staff only download the screens their role can open.
const DashboardHome = lazy(() => import("./pages/DashboardHome"));
const Users = lazy(() => import("./pages/Users"));
const Bets = lazy(() => import("./pages/Bets"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Settings = lazy(() => import("./pages/Settings"));
const SupportSms = lazy(() => import("./pages/SupportSms"));
const SupportChat = lazy(() => import("./pages/SupportChat"));
const SuperAdminDashboard = lazy(() => import("./pages/SuperAdminDashboard"));
const StaffManagement = lazy(() => import("./pages/StaffManagement"));
const FreeBets = lazy(() => import("./pages/FreeBets"));
const FraudAlerts = lazy(() => import("./pages/FraudAlerts"));
const Cashbacks = lazy(() => import("./pages/Cashbacks"));
const Audit = lazy(() => import("./pages/Audit"));
const ResetPassword = lazy(() => import("./pages/auth/resetPassword"));

function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center dark:bg-slate-900">
      <p className="text-5xl font-black text-brand">404</p>
      <p className="text-slate-600 dark:text-slate-300">This page doesn&apos;t exist.</p>
      <Link to="/" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-black">
        Back to the dashboard
      </Link>
    </div>
  );
}

function AppRoutes() {
  const { isDark } = useTheme();
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10 * 1000,
            refetchOnWindowFocus: true,
          },
        },
      }),
    []
  );
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: {
            colorPrimary: "#f9ce36",
            colorSuccess: "#10b981",
            colorWarning: "#f59e0b",
            colorError: "#ef4444",
            colorInfo: "#3b82f6",
            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            fontSize: 15,
            borderRadius: 10,
            ...(isDark
              ? {
                  colorBgContainer: "#121d18",
                  colorBgElevated: "#16231d",
                  colorBgLayout: "#0a120e",
                  colorBorder: "#24352c",
                  colorBorderSecondary: "#1b2a22",
                  colorText: "#e2e8f0",
                  colorTextSecondary: "#94a3b8",
                }
              : {
                  colorBgContainer: "#ffffff",
                  colorBgLayout: "#f8fafc",
                  colorBorder: "#e2e8f0",
                  colorText: "#1e293b",
                  colorTextSecondary: "#64748b",
                }),
          },
          components: {
            Button: {
              colorPrimary: "#f9ce36",
              colorPrimaryHover: "#e6bd2e",
              colorPrimaryActive: "#d4ad26",
              borderRadius: 10,
              controlHeight: 40,
            },
            Input: {
              borderRadius: 10,
              controlHeight: 40,
            },
            Select: {
              borderRadius: 10,
              controlHeight: 40,
            },
            Table: {
              borderRadius: 12,
              headerBg: isDark ? "#0a120e" : "#f8fafc",
              headerColor: isDark ? "#94a3b8" : "#64748b",
            },
            Modal: {
              borderRadiusLG: 16,
            },
            Card: {
              borderRadiusLG: 16,
            },
            Dropdown: {
              borderRadiusLG: 12,
            },
          },
        }}
        modal={{
          centered: true,
          transitionName: "",
          maskTransitionName: "",
        }}
      >
        <AuthProvider>
          <Router>
            <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="login" element={<Login />} />
              <Route path="reset" element={<ResetPassword />} />

              {/* Admin and super admin back office */}
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardLayout />}>
                  <Route index element={<DashboardHome />} />
                  <Route path="dashboard" element={<DashboardHome />} />
                  <Route element={<RoleRoute allow={ROLE_ACCESS.staff} />}>
                    <Route path="users" element={<Users />} />
                    <Route path="bets" element={<Bets />} />
                    <Route path="transactions" element={<Transactions />} />
                  </Route>
                  <Route element={<RoleRoute allow={ROLE_ACCESS.admin} />}>
                    <Route path="sms" element={<SupportSms />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="fraud-alerts" element={<FraudAlerts />} />
                    <Route path="cashback" element={<Cashbacks />} />
                    <Route path="audit" element={<Audit />} />
                  </Route>
                  <Route element={<RoleRoute allow={ROLE_ACCESS.superAdmin} />}>
                    <Route path="free-bets" element={<FreeBets />} />
                    <Route path="support-admin" element={<SuperAdminDashboard />} />
                    <Route path="staff" element={<StaffManagement />} />
                  </Route>
                </Route>
              </Route>

              {/* Support agent console */}
              <Route element={<AgentAppLayout />}>
                <Route path="/agent" element={<AgentLayout />}>
                  <Route index element={<Navigate to="/agent/support" replace />} />
                  <Route path="support" element={<SupportChat />} />
                  <Route path="sms" element={<Navigate to="/agent/support" replace />} />
                  <Route path="users" element={<Users />} />
                  <Route path="bets" element={<Bets />} />
                  <Route path="transactions" element={<Transactions />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </Router>
        </AuthProvider>
      </ConfigProvider>
      <Toaster
        position="top-center"
        gutter={12}
        containerStyle={{ margin: "8px" }}
        toastOptions={{
          success: {
            duration: 3000,
            style: {
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "white",
            },
            iconTheme: {
              primary: "white",
              secondary: "#10b981",
            },
          },
          error: {
            duration: 4000,
            style: {
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              color: "white",
            },
            iconTheme: {
              primary: "white",
              secondary: "#ef4444",
            },
          },
          style: {
            fontSize: "14px",
            maxWidth: "400px",
            padding: "14px 20px",
            borderRadius: "12px",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
            fontFamily: "Inter, sans-serif",
          },
        }}
      />
    </QueryClientProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  );
}

export default App;
