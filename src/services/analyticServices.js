import { fetchAPI } from "../utils/fetchRequest";

export async function analyticsServices({ startDate, endDate }) {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const token = user?.token;

  try {
    const res = await fetchAPI(
      `admin/analytics/overview?dateFrom=${encodeURIComponent(
        `${startDate}T00:00:00.000Z`,
      )}&dateTo=${encodeURIComponent(`${endDate}T23:59:59.999Z`)}`,
      "GET",
      null,
      token
    );
    const cards = res?.data?.cards || {};
    return {
      analytics: {
        allUsers: cards.registeredUsers || 0,
        totalReferredUsers: cards.referredUsers || 0,
        totalRevenue: cards.totalRevenue || 0,
        betAmount: cards.betAmount || 0,
        winAmount: cards.winAmount || 0,
        profit: cards.profit || 0,
        isLoss: (cards.profit || 0) < 0,
        totalDeposit: cards.deposits || 0,
        totalWithdrawal: cards.withdrawals || 0,
        totalTax: cards.tax || 0,
        totalReferralEarnings: cards.referralBonus || 0,
        totalWelcomeBonus: cards.welcomeBonus || 0,
        totalCashback: cards.cashback || 0,
        rollbackAmount: cards.rollbackAmount || 0,
        playerBalance: cards.playersBalance || 0,
        playerBonusBalance: cards.playersBonusBalance || 0,
        playerWithdrawableBalance: cards.playersWithdrawableBalance || 0,
      },
    };
  } catch (error) {
    throw new Error(error);
  }
}
export async function getMonthlyAnalytics() {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const response = await fetchAPI(
    "admin/analytics/monthly?months=12",
    "GET",
    null,
    user?.token
  );
  return response?.data || [];
}
