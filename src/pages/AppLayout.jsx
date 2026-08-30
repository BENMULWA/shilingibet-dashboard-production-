import { Navigate, Outlet, useLocation } from "react-router-dom";
import { normalizeStaffRole, readStoredUser } from "../utils/authSession";

function AppLayout() {
  const user = readStoredUser();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace />;
  const supportReadPaths = ["/users", "/bets", "/transactions"];
  const supportReadPath = supportReadPaths.find(
    (path) => location.pathname === path || location.pathname.startsWith(`${path}/`)
  );
  if (normalizeStaffRole(user) === "support") {
    return (
      <Navigate
        to={supportReadPath ? `/agent${location.pathname}` : "/agent/support"}
        replace
      />
    );
  }
  return <Outlet />;
}

export default AppLayout;
