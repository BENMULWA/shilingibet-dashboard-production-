import { fetchAPI } from "../utils/fetchRequest";

export async function getFraudAlerts(page = 1, limit = 20) {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const token = user?.token;

  try {
    const res = await fetchAPI(
      `admin/fraud/alerts?page=${page}&limit=${limit}`,
      "GET",
      null,
      token
    );
    return {
      alerts: res?.data || [],
      pagination: res?.meta || {},
    };
  } catch (error) {
    throw new Error(
      error.message || "Something went wrong while fetching fraud alerts"
    );
  }
}

export async function getFraudStats(days = 7) {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const token = user?.token;

  try {
    const res = await fetchAPI(
      `admin/fraud/stats?days=${days}`,
      "GET",
      null,
      token
    );
    return res;
  } catch (error) {
    throw new Error(
      error.message || "Something went wrong while fetching fraud statistics"
    );
  }
}

export async function resolveFraudAlert(alertId, status = "resolved_legitimate", resolutionNotes = "") {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const token = user?.token;

  try {
    const res = await fetchAPI(
      `admin/fraud/alerts/${alertId}/resolve`,
      "PATCH",
      { status, resolutionNotes },
      token
    );
    return res;
  } catch (error) {
    throw new Error(
      error.message || "Something went wrong while resolving fraud alert"
    );
  }
}

export async function getUserFraudProfile(userId) {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const token = user?.token;

  try {
    const res = await fetchAPI(
      `admin/fraud/user/${userId}`,
      "GET",
      null,
      token
    );
    return res;
  } catch (error) {
    throw new Error(
      error.message || "Something went wrong while fetching user fraud profile"
    );
  }
}
