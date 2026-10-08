export const STAFF_ROLES = ["support", "admin", "super_admin"];

// Who can open each area of the back office. Route guards and the sidebar
// both read from here so navigation and access never drift apart.
// The API must still enforce these rules; this only shapes the UI.
export const ROLE_ACCESS = {
  staff: STAFF_ROLES,
  admin: ["admin", "super_admin"],
  superAdmin: ["super_admin"],
};

// Sign staff out after this long without any interaction.
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

export function normalizeStaffRole(user) {
  const role = user?.adminLevel || user?.loginRole || user?.role;
  return role === "superadmin" ? "super_admin" : role;
}

export function hasRole(user, roles) {
  return roles.includes(normalizeStaffRole(user));
}

// Returns the JWT expiry in ms, or null when the token carries no readable exp.
export function tokenExpiresAt(token) {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const { exp } = JSON.parse(json);
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  const expiresAt = tokenExpiresAt(token);
  return expiresAt !== null && expiresAt <= Date.now();
}

export function isValidStaffSession(user) {
  return Boolean(
    user?.token &&
      STAFF_ROLES.includes(normalizeStaffRole(user)) &&
      !isTokenExpired(user.token)
  );
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
