import { fetchAPI } from "../utils/fetchRequest";
import {
  downloadAuthenticatedFile,
  exportDateQuery,
} from "../utils/downloadRequest";

const money = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

export const mapUser = (user) => {
  const totalBalance = money(user?.wallet?.totalBalance ?? user?.balance);
  const bonusBalance = money(user?.wallet?.bonusBalance ?? user?.bonusBalance);
  const withdrawableBalance = money(
    user?.wallet?.withdrawableBalance ?? Math.max(0, totalBalance - bonusBalance)
  );

  return {
    ...user,
    accountStatus: user.status === "suspended" ? "blocked" : "active",
    wallet: {
      ...user.wallet,
      balance: totalBalance,
      totalBalance,
      bonusBalance,
      withdrawableBalance,
      currency: user?.wallet?.currency || "KES",
    },
  };
};

export async function userServices(page = 1, limit = 10) {
  const user = JSON.parse(sessionStorage.getItem("user"));

  const token = user?.token;
  try {
    const res = await fetchAPI(
      `admin/users?page=${page}&limit=${limit}`,
      "GET",
      null,
      token
    );
    return {
      users: (res?.data || []).map(mapUser),
      page: res?.meta?.page || page,
      limit: res?.meta?.limit || limit,
      total: res?.meta?.total || 0,
      totalPages: res?.meta?.pages || 0,
    };
  } catch (error) {
    throw new Error(
      error.message || "Something went wrong while fetching bets"
    );
  }
}
export async function getUserByPhone(phone) {
  const user = JSON.parse(sessionStorage.getItem("user"));

  const { token } = user;

  try {
    const response = await fetchAPI(
      `admin/users?phone=${encodeURIComponent(phone)}&limit=20`,
      "GET",
      null,
      token,
    );

    return { user: (response?.data || []).map(mapUser) };
  } catch (error) {
    throw new Error(
      error.message || "Something went wrong while fetching users"
    );
  }
}
export async function exportUsers(start, end) {
  if (!start || !end) {
    throw new Error("Start and end dates are required");
  }

  await downloadAuthenticatedFile(
    `admin/exports/users?${exportDateQuery(start, end)}`,
    `users-${start}-to-${end}.csv`,
  );
  return { message: "Users exported successfully" };
}
