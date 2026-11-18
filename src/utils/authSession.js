// Staff roles are defined by the super admin on the Roles page and stored by
// the API. Each signed-in user carries the permission keys of their role.
// The API enforces every permission; these checks only shape the UI.
export const SUPER_ADMIN = "super_admin";

// Labels for the built-in roles. Custom roles fall back to their key.
export const ROLE_LABELS = {
  super_admin: "Super Admin",
  admin: "Admin",
  support: "Support",
  finance: "Finance",
  risk: "Risk & Compliance",
  marketing: "Marketing",
};

// Used only for sessions started before the API returned permissions.
const LEGACY_PERMISSIONS = {
  support: ["players.view", "bets.view", "transactions.view", "chat.agent"],
  admin: [
    "dashboard.view", "players.view", "players.edit", "players.credit", "players.delete", "players.export",
    "bets.view", "bets.export", "bets.reconcile", "transactions.view", "transactions.export",
    "transactions.reconcile", "treasury.view", "cashback.view", "sms.send", "announcements.manage",
    "events.manage", "fraud.view", "fraud.resolve", "audit.view", "chat.agent",
  ],
};

// Sign staff out after this long without any interaction.
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

export function normalizeStaffRole(user) {
  const role = user?.adminLevel || user?.loginRole || user?.role;
  return role === "superadmin" ? SUPER_ADMIN : role;
}

export function roleLabel(user) {
  const role = normalizeStaffRole(user);
  if (!role) return "Staff";
  return ROLE_LABELS[role] || role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function isSuperAdmin(user = readStoredUser()) {
  return normalizeStaffRole(user) === SUPER_ADMIN;
}

export function permissionsOf(user) {
  if (Array.isArray(user?.permissions)) return user.permissions;
  return LEGACY_PERMISSIONS[normalizeStaffRole(user)] || [];
}

// True when the user holds at least one of the given permissions.
// Super admins hold every permission.
export function canUser(user, ...permissions) {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  const granted = permissionsOf(user);
  return permissions.some((permission) => granted.includes(permission));
}

// Shorthand for the signed-in user.
export function can(...permissions) {
  return canUser(readStoredUser(), ...permissions);
}

// Staff who answer chat but have no back office dashboard work from the agent console.
export function usesAgentConsole(user) {
  return !canUser(user, "dashboard.view") && canUser(user, "chat.agent");
}

// Where a staff member lands after signing in, or when they open a page they cannot use.
const HOME_CANDIDATES = [
  ["/users", "players.view"],
  ["/transactions", "transactions.view"],
  ["/finance", "finance.view", "treasury.view"],
  ["/bets", "bets.view"],
  ["/fraud-alerts", "fraud.view"],
  ["/cashback", "cashback.view"],
  ["/free-bets", "freebets.view"],
  ["/sms", "sms.send"],
  ["/announcements", "announcements.manage"],
  ["/audit", "audit.view"],
  ["/settings", "treasury.view", "players.credit", "events.manage"],
  ["/support-admin", "chat.supervise"],
];

export function homePathFor(user) {
  if (canUser(user, "dashboard.view")) return "/dashboard";
  if (usesAgentConsole(user)) return "/agent/support";
  const match = HOME_CANDIDATES.find(([, ...permissions]) => canUser(user, ...permissions));
  return match ? match[0] : "/no-access";
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

// Staff accounts carry their role key in adminLevel. Very old staff records
// used the role field itself; players have role "user" and no adminLevel.
const LEGACY_STAFF_ROLES = ["support", "admin", "super_admin", "superadmin"];
function isStaffRole(user) {
  if (user?.adminLevel) return true;
  return LEGACY_STAFF_ROLES.includes(user?.loginRole) || LEGACY_STAFF_ROLES.includes(user?.role);
}

export function isValidStaffSession(user) {
  return Boolean(
    user?.token &&
      isStaffRole(user) &&
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
