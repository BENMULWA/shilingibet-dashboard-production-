import { fetchAPI } from "../utils/fetchRequest";
import {
  downloadAuthenticatedFile,
  exportDateQuery,
} from "../utils/downloadRequest";

export async function BetsService(page = 1, limit = 10) {
  const user = JSON.parse(sessionStorage.getItem("user"));

  const token = user.token;

  try {
    const response = await fetchAPI(
      `admin/bets?page=${page}&limit=${limit}`,
      "GET",
      null,
      token
    );

    return {
      bets: (response?.data || []).map(normalizeAdminBet),
      page: response?.meta?.page || page,
      limit: response?.meta?.limit || limit,
      total: response?.meta?.total || 0,
      totalPages: response?.meta?.pages || 0,
    };
  } catch (error) {
    throw new Error(
      error.message || "Something went wrong while fetching bets"
    );
  }
}

export async function getWinLossesByPhone(phone, page = 1, limit = 10) {
  const user = JSON.parse(sessionStorage.getItem("user"));

  const { token } = user;

  try {
    const response = await fetchAPI(
      `admin/bets?phone=${encodeURIComponent(
        phone,
      )}&page=${page}&limit=${limit}`,
      "GET",
      null,
      token
    );
    return {
      data: {
        data: (response?.data || []).map(normalizeAdminBet),
        pagination: response?.meta || { page, limit, total: 0 },
      },
    };
  } catch (error) {
    throw new Error(
      error.message || "Something went wrong while fetching bets"
    );
  }
}

function normalizeAdminBet(bet) {
  return {
    ...bet,
    game: bet.game || (bet.source === "virtual" ? "Virtual game" : "Sportsbook"),
    type: bet.source || "sportsbook",
    amount: bet.stake ?? 0,
    recurringBalance: bet.balanceAfter,
    phone: bet.user?.phone,
  };
}
export async function exportBets(start, end) {
  if (!start || !end) {
    throw new Error("Start and end dates are required");
  }

  await downloadAuthenticatedFile(
    `admin/exports/bets?${exportDateQuery(start, end)}`,
    `bets-${start}-to-${end}.csv`,
  );
  return { message: "Bets exported successfully" };
}
