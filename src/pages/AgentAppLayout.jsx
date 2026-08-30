import { Navigate, Outlet } from "react-router-dom";
import { normalizeStaffRole, readStoredUser } from "../utils/authSession";

function AgentAppLayout() {
  const user = readStoredUser();
  if (!user) return <Navigate to="/login" replace />;
  if (normalizeStaffRole(user) !== "support") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default AgentAppLayout;
