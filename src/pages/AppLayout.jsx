import { Navigate, Outlet, useLocation } from "react-router-dom";
import { readStoredUser, usesAgentConsole } from "../utils/authSession";

function AppLayout() {
  const user = readStoredUser();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace />;
  // Chat-only roles (like Support) work from the agent console.
  if (usesAgentConsole(user)) {
    const agentPaths = ["/users", "/bets", "/transactions"];
    const agentPath = agentPaths.find(
      (path) => location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
    return (
      <Navigate
        to={agentPath ? `/agent${location.pathname}` : "/agent/support"}
        replace
      />
    );
  }
  return <Outlet />;
}

export default AppLayout;
