import { Navigate, Outlet } from "react-router-dom";
import { hasRole, readStoredUser } from "../utils/authSession";

// Renders child routes only for the listed roles. Signed-out visitors go to
// the login page; signed-in staff without access go back to their home page.
export default function RoleRoute({ allow }) {
  const user = readStoredUser();
  if (!user) return <Navigate to="/login" replace />;
  return hasRole(user, allow) ? <Outlet /> : <Navigate to="/" replace />;
}
