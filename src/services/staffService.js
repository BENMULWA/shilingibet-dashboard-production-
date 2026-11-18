import { fetchAPI } from "../utils/fetchRequest";

const token = () => JSON.parse(sessionStorage.getItem("user") || "null")?.token;

export async function listStaff(page = 1, limit = 20) {
  return fetchAPI(`admin/staff?page=${page}&limit=${limit}`, "GET", null, token());
}

export async function createStaff(payload) {
  return fetchAPI("admin/staff", "POST", payload, token());
}

export async function updateStaff(id, changes) {
  return fetchAPI(`admin/staff/${id}`, "PATCH", changes, token());
}

export async function sendStaffPasswordReset(id) {
  return fetchAPI(`admin/staff/${id}/send-password-reset`, "POST", {}, token());
}

// Staff roles and the permission catalog. Super admins only.
export async function listRoles() {
  const response = await fetchAPI("admin/roles", "GET", null, token());
  return response.data;
}

export async function createRole(payload) {
  return fetchAPI("admin/roles", "POST", payload, token());
}

export async function updateRole(key, changes) {
  return fetchAPI(`admin/roles/${key}`, "PATCH", changes, token());
}

export async function deleteRole(key) {
  return fetchAPI(`admin/roles/${key}`, "DELETE", null, token());
}
