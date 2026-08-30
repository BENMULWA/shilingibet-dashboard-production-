export const STAFF_ROLES = ["support", "admin", "super_admin"];

export function normalizeStaffRole(user) {
  const role = user?.adminLevel || user?.loginRole || user?.role;
  return role === "superadmin" ? "super_admin" : role;
}

export function isValidStaffSession(user) {
  return Boolean(user?.token && STAFF_ROLES.includes(normalizeStaffRole(user)));
}

export function readStoredUser() {
  try {
    const stored = sessionStorage.getItem("user");
    if (!stored) return null;

    const user = JSON.parse(stored);
    if (!isValidStaffSession(user)) {
      sessionStorage.removeItem("user");
      return null;
    }

    return user;
  } catch {
    sessionStorage.removeItem("user");
    return null;
  }
}
