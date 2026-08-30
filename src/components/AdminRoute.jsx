import { Navigate, Outlet } from "react-router-dom";
import { normalizeStaffRole, readStoredUser } from "../utils/authSession";

export default function AdminRoute() {
  const role = normalizeStaffRole(readStoredUser());
  return role === "admin" || role === "super_admin"
    ? <Outlet />
    : <Navigate to="/dashboard" replace />;
}
