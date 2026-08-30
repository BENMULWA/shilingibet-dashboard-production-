const SMS_API_URL = (import.meta.env.VITE_SMS_API_URL || "").replace(/\/$/, "");

function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

async function smsRequest(path, options = {}) {
  if (!SMS_API_URL) throw new Error("VITE_SMS_API_URL is not configured");

  const token = getSession()?.token;
  if (!token) throw new Error("Your session has expired. Please sign in again.");

  const response = await fetch(`${SMS_API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.message || "SMS service request failed");
  }
  return data;
}

export const sendBulkSms = (payload) =>
  smsRequest("/api/sms/bulk", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getSmsStats = () => smsRequest("/api/sms/stats");
export const getSmsProviders = () => smsRequest("/api/sms/providers");
export const getSmsBatches = () => smsRequest("/api/sms/batches?limit=20");
export const getSmsContacts = () => smsRequest("/api/sms/contacts?limit=500");
