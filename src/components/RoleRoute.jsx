import { Navigate, Outlet } from "react-router-dom";
import { canUser, homePathFor, isSuperAdmin, readStoredUser } from "../utils/authSession";

// Renders child routes only for staff holding one of the `need` permissions
// (or super admins, with `superAdmin`). Signed-out visitors go to the login
// page; signed-in staff without access go to their own home page.
export default function RoleRoute({ need = [], superAdmin = false }) {
  const user = readStoredUser();
  if (!user) return <Navigate to="/login" replace />;
  const allowed = superAdmin ? isSuperAdmin(user) : canUser(user, ...need);
  return allowed ? <Outlet /> : <Navigate to={homePathFor(user)} replace />;
}
