import { fetchAPI } from "../utils/fetchRequest";

const token = () => JSON.parse(sessionStorage.getItem("user") || "null")?.token;

export async function listStaff(page = 1, limit = 20) {
  return fetchAPI(`admin/staff?page=${page}&limit=${limit}`, "GET", null, token());
}

export async function updateStaff(id, changes) {
  return fetchAPI(`admin/staff/${id}`, "PATCH", changes, token());
}

export async function sendStaffPasswordReset(id) {
  return fetchAPI(`admin/staff/${id}/send-password-reset`, "POST", {}, token());
}
