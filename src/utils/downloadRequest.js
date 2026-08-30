import { API_URL } from "./ApiConfigs";

export async function downloadAuthenticatedFile(path, filename) {
  const user = JSON.parse(sessionStorage.getItem("user") || "null");
  if (!user?.token) throw new Error("Authentication token missing");

  const response = await fetch(`${API_URL}/${path}`, {
    headers: { Authorization: `Bearer ${user.token}` },
  });

  if (!response.ok) {
    let message = "Export failed";
    try {
      const error = await response.json();
      message = error?.message || message;
    } catch {
      // Keep the generic message for non-JSON failures.
    }

    if (response.status === 401) {
      sessionStorage.removeItem("user");
      window.location.assign("/login");
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export function exportDateQuery(start, end) {
  return new URLSearchParams({
    dateFrom: `${start}T00:00:00.000Z`,
    dateTo: `${end}T23:59:59.999Z`,
  }).toString();
}
