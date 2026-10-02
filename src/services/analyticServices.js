import { fetchAPI } from "../utils/fetchRequest";

const getToken = () => JSON.parse(sessionStorage.getItem("user") || "null")?.token;

// Dates are sent as exact instants so "today" means midnight-to-midnight in the
// staff member's own timezone (EAT), not a UTC day that starts at 3am.
export async function analyticsServices({ startDate, endDate }) {
  const params = new URLSearchParams({
    dateFrom: new Date(startDate).toISOString(),
    dateTo: new Date(endDate).toISOString(),
  });
  const res = await fetchAPI(`admin/analytics/overview?${params}`, "GET", null, getToken());
  const cards = res?.data?.cards || {};
  const attention = res?.data?.attention || {};

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
      betCount: cards.betCount || 0,
      activeBettors: cards.activeBettors || 0,
      depositCount: cards.depositCount || 0,
      withdrawalCount: cards.withdrawalCount || 0,
      failedDeposits: cards.failedDeposits || 0,
      firstTimeDepositors: cards.firstTimeDepositors || 0,
    },
    attention: {
      pendingWithdrawals: attention.pendingWithdrawals || 0,
      pendingWithdrawalAmount: attention.pendingWithdrawalAmount || 0,
      manualReview: attention.manualReview || 0,
      heldReferralAwards: attention.heldReferralAwards || 0,
    },
  };
}

export async function getMonthlyAnalytics() {
  const response = await fetchAPI("admin/analytics/monthly?months=12", "GET", null, getToken());
  return response?.data || [];
}

export async function getRecentActivity({ limit = 30 } = {}) {
  const response = await fetchAPI(`admin/analytics/activity?limit=${limit}`, "GET", null, getToken());
  return response?.data || [];
}
