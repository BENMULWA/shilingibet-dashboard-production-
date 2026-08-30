import { fetchAPI } from "../utils/fetchRequest";
import { readStoredUser } from "../utils/authSession";

function token() {
  return readStoredUser()?.token;
}

function queryString(values) {
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  return query.toString();
}

export async function getFreeBetCampaigns(filters = {}) {
  const query = queryString(filters);
  const response = await fetchAPI(
    `admin/freebet/campaigns${query ? `?${query}` : ""}`,
    "GET",
    null,
    token(),
  );
  const data = response?.data || {};
  return {
    campaigns: data.campaigns || [],
    page: data.page || filters.page || 1,
    perPage: data.per_page || filters.perPage || 20,
    total: data.total || 0,
  };
}

export async function createFreeBetCampaign(payload) {
  return fetchAPI("admin/freebet/campaigns", "POST", payload, token());
}

export async function updateFreeBetCampaignStatus({ campaignId, status }) {
  return fetchAPI(
    `admin/freebet/campaigns/${encodeURIComponent(campaignId)}/status`,
    "PATCH",
    { status },
    token(),
  );
}

export async function getVirtualGames() {
  const response = await fetchAPI("virtuals/games", "GET");
  return response?.data || [];
}

export async function getFreeBetUsers(filters = {}) {
  const query = queryString(filters);
  const response = await fetchAPI(
    `admin/freebet/users${query ? `?${query}` : ""}`,
    "GET",
    null,
    token(),
  );
  return {
    users: response?.data || [],
    page: response?.meta?.page || filters.page || 1,
    limit: response?.meta?.limit || filters.limit || 20,
    total: response?.meta?.total || 0,
  };
}

export async function awardFreeBets({ campaignId, userIds }) {
  return fetchAPI(
    `admin/freebet/campaigns/${encodeURIComponent(campaignId)}/awards`,
    "POST",
    { userIds },
    token(),
  );
}

export async function getFreeBetAwards(filters = {}) {
  const query = queryString(filters);
  const response = await fetchAPI(
    `admin/freebet/awards${query ? `?${query}` : ""}`,
    "GET",
    null,
    token(),
  );
  const data = response?.data || {};
  return {
    awards: data.freebets || [],
    page: data.page || filters.page || 1,
    perPage: data.per_page || filters.perPage || 20,
    total: data.total || 0,
  };
}

export async function revokeFreeBet({ freeBetId, reason }) {
  return fetchAPI(
    `admin/freebet/awards/${encodeURIComponent(freeBetId)}/revoke`,
    "POST",
    { reason },
    token(),
  );
}
