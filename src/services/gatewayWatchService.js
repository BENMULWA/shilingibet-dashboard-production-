import { fetchAPI } from "../utils/fetchRequest";

const token = () => JSON.parse(sessionStorage.getItem("user") || "null")?.token;

// Gateway watchdog: Mamlaka balances every minute, unexplained outflows, alerts and the withdrawal hold.
export async function getGatewayWatch(hours = 24) {
  const response = await fetchAPI(`admin/analytics/gateway-watch?hours=${hours}`, "GET", null, token());
  return response.data;
}

export async function checkGatewayNow() {
  const response = await fetchAPI("admin/gateway-watch/check", "POST", {}, token());
  return response.data;
}

export async function acknowledgeGatewayAlerts({ reason, resumeWithdrawals }) {
  const response = await fetchAPI("admin/gateway-watch/acknowledge", "POST", { reason, resumeWithdrawals }, token());
  return response.data;
}

export async function setGatewayHold({ active, reason }) {
  const response = await fetchAPI("admin/gateway-watch/hold", "POST", { active, reason }, token());
  return response.data;
}
