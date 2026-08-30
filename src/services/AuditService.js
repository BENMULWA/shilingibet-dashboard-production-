import { fetchAPI } from "../utils/fetchRequest";

const token = () => JSON.parse(sessionStorage.getItem("user") || "null")?.token;
const get = (path) => fetchAPI(`admin/audit/${path}`, "GET", null, token());

export const getAuditLogs = (page = 1, limit = 10) => get(`logs?page=${page}&limit=${limit}`);
export const getAuditLogsByDate = (date) => get(`logs/date/${date}`);
export const getAuditDates = () => get("dates");
export const getAuditStats = () => get("stats");
export const getAuditLogsByUser = (userId, page = 1, limit = 10) =>
  get(`user/${encodeURIComponent(userId)}?page=${page}&limit=${limit}`);
