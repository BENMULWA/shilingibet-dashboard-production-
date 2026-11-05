import { fetchAPI } from "../utils/fetchRequest";

const token = () => JSON.parse(sessionStorage.getItem("user") || "null")?.token;

export const listAnnouncements = () => fetchAPI("admin/announcements?limit=30", "GET", null, token());

export const createAnnouncement = ({ title, message }) =>
  fetchAPI("admin/announcements", "POST", { title: title || "", message }, token());

export const deleteAnnouncement = (id) => fetchAPI(`admin/announcements/${id}`, "DELETE", null, token());
