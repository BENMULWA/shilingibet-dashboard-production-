import { Navigate, Outlet } from "react-router-dom";
import { normalizeStaffRole, readStoredUser } from "../utils/authSession";

export default function SuperAdminRoute() {
  const user = readStoredUser();
  return normalizeStaffRole(user) === "super_admin"
    ? <Outlet />
    : <Navigate to="/dashboard" replace />;
}
