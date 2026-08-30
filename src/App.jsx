import { BrowserRouter as Router, Navigate, Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import Users from "./pages/Users";
import Transactions from "./pages/Transactions";
import Settings from "./pages/Settings";
import Login from "./pages/auth/Login";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";

import AppLayout from "./pages/AppLayout";
import AgentAppLayout from "./pages/AgentAppLayout";
import Bets from "./pages/Bets";
import { ConfigProvider } from "antd";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import AgentLayout from "./components/AgentLayout";
import SupportSms from "./pages/SupportSms";
import SupportChat from "./pages/SupportChat";
import ResetPassword from "./pages/auth/resetPassword";
import StaffManagement from "./pages/StaffManagement";
import FreeBets from "./pages/FreeBets";
import SuperAdminRoute from "./components/SuperAdminRoute";
import AdminRoute from "./components/AdminRoute";
import StaffReadRoute from "./components/StaffReadRoute";
import FraudAlerts from "./pages/FraudAlerts";
import Cashbacks from "./pages/Cashbacks";
import Audit from "./pages/Audit";

function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 100,
      },
    },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#f9ce36",
            colorSuccess: "#10b981",
            colorWarning: "#f59e0b",
            colorError: "#ef4444",
            colorInfo: "#3b82f6",
            fontFamily: "Montserrat, sans-serif",
            borderRadius: 10,
            colorBgContainer: "#ffffff",
            colorBgLayout: "#f8fafc",
            colorBorder: "#e2e8f0",
            colorText: "#1e293b",
            colorTextSecondary: "#64748b",
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
              headerBg: "#f8fafc",
              headerColor: "#64748b",
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
            <Routes>
              <Route path="login" element={<Login />} />
              <Route path="reset" element={<ResetPassword />} />

              {/* Admin Routes */}
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardLayout />}>
                  <Route index element={<DashboardHome />} />
                  <Route path="dashboard" element={<DashboardHome />} />
                  <Route element={<StaffReadRoute />}>
                    <Route path="users" element={<Users />} />
                    <Route path="bets" element={<Bets />} />
                    <Route path="transactions" element={<Transactions />} />
                  </Route>
                  <Route element={<AdminRoute />}>
                    <Route path="sms" element={<SupportSms />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="fraud-alerts" element={<FraudAlerts />} />
                    <Route path="cashback" element={<Cashbacks />} />
                    <Route path="audit" element={<Audit />} />
                  </Route>
                  <Route element={<SuperAdminRoute />}>
                    <Route path="free-bets" element={<FreeBets />} />
                    <Route path="support-admin" element={<SuperAdminDashboard />} />
                    <Route path="staff" element={<StaffManagement />} />
                  </Route>
                </Route>
              </Route>

              {/* Support agent routes */}
              <Route element={<AgentAppLayout />}>
                <Route path="/agent" element={<AgentLayout />}>
                  <Route path="support" element={<SupportChat />} />
                  <Route path="sms" element={<Navigate to="/agent/support" replace />} />
                  <Route path="users" element={<Users />} />
                  <Route path="bets" element={<Bets />} />
                  <Route path="transactions" element={<Transactions />} />
                </Route>
              </Route>
            </Routes>
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
            fontFamily: "Montserrat, sans-serif",
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
