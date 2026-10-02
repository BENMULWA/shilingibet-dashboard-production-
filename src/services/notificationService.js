import { fetchAPI } from "../utils/fetchRequest";

const token = () => JSON.parse(sessionStorage.getItem("user") || "null")?.token;

export async function listNotifications({ page = 1, limit = 20, unreadOnly = false } = {}) {
  return fetchAPI(
    `admin/notifications?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`,
    "GET",
    null,
    token()
  );
}

export async function markNotificationRead(id) {
  return fetchAPI(`admin/notifications/${id}/read`, "POST", {}, token());
}

export async function markAllNotificationsRead() {
  return fetchAPI("admin/notifications/read-all", "POST", {}, token());
}
