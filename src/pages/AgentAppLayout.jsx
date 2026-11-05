import { Navigate, Outlet } from "react-router-dom";
import { STAFF_ROLES, normalizeStaffRole, readStoredUser } from "../utils/authSession";

function AgentAppLayout() {
  const user = readStoredUser();
  if (!user) return <Navigate to="/login" replace />;
  // Support agents, admins and super admins can all answer customers here.
  if (!STAFF_ROLES.includes(normalizeStaffRole(user))) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default AgentAppLayout;
