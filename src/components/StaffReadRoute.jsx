import { Navigate, Outlet } from "react-router-dom";
import { STAFF_ROLES, normalizeStaffRole, readStoredUser } from "../utils/authSession";

export default function StaffReadRoute() {
  const role = normalizeStaffRole(readStoredUser());
  return STAFF_ROLES.includes(role)
    ? <Outlet />
    : <Navigate to="/login" replace />;
}
