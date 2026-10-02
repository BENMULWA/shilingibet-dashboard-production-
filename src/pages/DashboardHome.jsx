import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import * as XLSX from "xlsx";
import {
  FiAlertTriangle,
  FiArrowDownLeft,
  FiArrowUpRight,
  FiAward,
  FiCalendar,
  FiChevronRight,
  FiClock,
  FiDownload,
  FiGift,
  FiLock,
  FiPercent,
  FiRefreshCw,
  FiRotateCcw,
  FiShield,
  FiTarget,
  FiTrendingUp,
  FiUserCheck,
  FiUserPlus,
  FiUsers,
  FiXCircle,
} from "react-icons/fi";
import { HiOutlineBanknotes } from "react-icons/hi2";
import { TbReceiptTax } from "react-icons/tb";

import { useGetAnalytics } from "../hooks/useGetAnalytics";
import { useGetSecondaryWallet } from "../hooks/useTransfer";
import { useAuthState } from "../context/AuthContext";
import { normalizeStaffRole } from "../utils/authSession";
import KpiCard, { StatTile } from "../components/dashboard/KpiCard";
import { percentChange } from "../utils/metrics";
import ActivityFeed from "../components/dashboard/ActivityFeed";
import RevenueChart from "../components/RevenueChart";
import InvoiceTable from "../components/InvoiceTable";

// Payout float at or below this is critical; below twice this is a warning.
const TREASURY_LOW_THRESHOLD = 5000;

const kes = (amount, { compact = false } = {}) => {
  const value = Number(amount) || 0;
  if (compact && Math.abs(value) >= 1_000_000) return `KES ${(value / 1_000_000).toFixed(2)}M`;
  return `KES ${value.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};
const count = (value) => (Number(value) || 0).toLocaleString("en-KE");
const pct = (value) => `${(Number.isFinite(value) ? value : 0).toFixed(1)}%`;

// Each period knows its own range and the equal-length range before it,
// so every card can say "up 12% vs yesterday".
const buildPeriods = (now) => {
  const today = [startOfDay(now), endOfDay(now)];
  const yesterday = [startOfDay(subDays(now, 1)), endOfDay(subDays(now, 1))];
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  return [
    { id: "today", label: "Today", compareLabel: "yesterday", range: today, previous: yesterday },
    {
      id: "yesterday",
      label: "Yesterday",
      compareLabel: "day before",
      range: yesterday,
      previous: [startOfDay(subDays(now, 2)), endOfDay(subDays(now, 2))],
    },
    {
      id: "7d",
      label: "Last 7 days",
      compareLabel: "prior 7 days",
      range: [startOfDay(subDays(now, 6)), endOfDay(now)],
      previous: [startOfDay(subDays(now, 13)), endOfDay(subDays(now, 7))],
    },
    {
      id: "month",
      label: "This month",
      compareLabel: "same days last month",
      range: [startOfMonth(now), endOfDay(now)],
      previous: [lastMonthStart, endOfDay(subMonths(now, 1))],
    },
    {
      id: "last_month",
      label: "Last month",
      compareLabel: "month before",
      range: [lastMonthStart, endOfMonth(lastMonthStart)],
      previous: [startOfMonth(subMonths(now, 2)), endOfMonth(subMonths(now, 2))],
    },
  ];
};

function SectionTitle({ title, description, action }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="text-[15px] font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
        {description && <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function LiveBadge({ live, updatedAt, fetching }) {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!live) return undefined;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [live]);

  if (!live) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
        <FiClock size={11} /> Historical view
      </span>
    );
  }
  const seconds = updatedAt ? Math.max(0, Math.round((Date.now() - updatedAt) / 1000)) : null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      LIVE
      <span className="tabular font-normal">
        {fetching ? "· updating…" : seconds !== null ? `· ${seconds}s ago` : ""}
      </span>
    </span>
  );
}

function AttentionItem({ to, icon, label, value, detail, tone }) {
  const Icon = icon;
  const alert = tone === "red" || tone === "amber";
  const iconTone = {
    red: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    ok: "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-400",
  }[tone];
  return (
    <Link to={to} className="group flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-700/40">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconTone}`}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className={`tabular truncate text-[15px] font-semibold ${alert ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}>{value}</p>
        {detail && <p className={`truncate text-[11px] ${tone === "red" ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}>{detail}</p>}
      </div>
      <FiChevronRight className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 dark:text-slate-600" aria-hidden="true" />
    </Link>
  );
}

const DETAIL_TABS = [
  { key: "money", label: "Money" },
  { key: "betting", label: "Betting" },
  { key: "players", label: "Players & bonuses" },
];

export default function DashboardHome() {
  const { user } = useAuthState();
  const canManageOperations = ["admin", "super_admin"].includes(normalizeStaffRole(user));

  const periods = useMemo(() => buildPeriods(new Date()), []);
  const [periodId, setPeriodId] = useState("today");
  const [customRange, setCustomRange] = useState([null, null]);
  const [showCustom, setShowCustom] = useState(false);
  const [detailTab, setDetailTab] = useState("money");

  const period = useMemo(() => {
    if (periodId !== "custom") return periods.find((p) => p.id === periodId);
    const [start, end] = customRange;
    const days = differenceInCalendarDays(end, start) + 1;
    return {
      id: "custom",
      label: `${format(start, "d MMM")} – ${format(end, "d MMM yyyy")}`,
      compareLabel: `prior ${days} day${days === 1 ? "" : "s"}`,
      range: [startOfDay(start), endOfDay(end)],
      previous: [startOfDay(subDays(start, days)), endOfDay(subDays(start, 1))],
    };
  }, [periodId, customRange, periods]);

  const isLive = period.id === "today";
  const [startDate, endDate] = period.range;

  const { analytics: current, isLoading, isFetching, refetch, dataUpdatedAt } = useGetAnalytics(startDate, endDate, { live: isLive });
  const { analytics: previous } = useGetAnalytics(period.previous[0], period.previous[1]);
  const { secondaryWalletBalance, isLoading: treasuryLoading } = useGetSecondaryWallet(canManageOperations, { live: isLive });

  const a = current?.analytics || {};
  const p = previous?.analytics;
  const attention = current?.attention || {};
  const change = (key) => (p ? percentChange(a[key], p[key]) : undefined);

  const treasuryBalance = Number(secondaryWalletBalance?.balance || 0);
  const treasuryTone =
    treasuryBalance <= TREASURY_LOW_THRESHOLD ? "red" : treasuryBalance <= TREASURY_LOW_THRESHOLD * 2 ? "amber" : "ok";
  const ggrMargin = a.betAmount ? (a.totalRevenue / a.betAmount) * 100 : 0;
  const floatCoverage = a.playerWithdrawableBalance ? (treasuryBalance / a.playerWithdrawableBalance) * 100 : 100;
  const avgStake = a.betCount ? a.betAmount / a.betCount : 0;
  const netCash = a.totalDeposit - a.totalWithdrawal;

  const applyCustomRange = (dates) => {
    const [start, end] = dates;
    setCustomRange([start, end]);
    if (start && end) {
      setPeriodId("custom");
      setShowCustom(false);
    }
  };

  const exportToExcel = () => {
    const rows = [
      ["ShilingiBet performance report"],
      ["Period", `${format(startDate, "d MMM yyyy HH:mm")} – ${format(endDate, "d MMM yyyy HH:mm")}`],
      ["Generated", format(new Date(), "d MMM yyyy HH:mm")],
      [],
      ["Metric", "Value", "Previous period"],
      ["Gross gaming revenue (GGR)", a.totalRevenue, p?.totalRevenue ?? ""],
      ["Total staked (turnover)", a.betAmount, p?.betAmount ?? ""],
      ["Bets placed", a.betCount, p?.betCount ?? ""],
      ["Paid to winners", a.winAmount, p?.winAmount ?? ""],
      ["Voided / refunded", a.rollbackAmount, p?.rollbackAmount ?? ""],
      ["Active players", a.activeBettors, p?.activeBettors ?? ""],
      ["New sign-ups", a.allUsers, p?.allUsers ?? ""],
      ["First-time depositors", a.firstTimeDepositors, p?.firstTimeDepositors ?? ""],
      ["Deposits (KES)", a.totalDeposit, p?.totalDeposit ?? ""],
      ["Deposits (count)", a.depositCount, p?.depositCount ?? ""],
      ["Failed deposits", a.failedDeposits, p?.failedDeposits ?? ""],
      ["Withdrawals (KES)", a.totalWithdrawal, p?.totalWithdrawal ?? ""],
      ["Withdrawals (count)", a.withdrawalCount, p?.withdrawalCount ?? ""],
      ["Net cash in", netCash, p ? p.totalDeposit - p.totalWithdrawal : ""],
      ["Tax collected", a.totalTax, p?.totalTax ?? ""],
      ["Referral bonus paid", a.totalReferralEarnings, p?.totalReferralEarnings ?? ""],
      ["Cashback paid", a.totalCashback, p?.totalCashback ?? ""],
      ["Welcome bonus paid", a.totalWelcomeBonus, p?.totalWelcomeBonus ?? ""],
      [],
      ["Right now"],
      ["Player balances (total)", a.playerBalance],
      ["Withdrawable by players", a.playerWithdrawableBalance],
      ["Locked bonus funds", a.playerBonusBalance],
      ["Payout float", treasuryBalance],
      ["Withdrawals waiting", attention.pendingWithdrawals],
      ["Withdrawals waiting (KES)", attention.pendingWithdrawalAmount],
    ];
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    sheet["!cols"] = [{ wch: 30 }, { wch: 22 }, { wch: 18 }];
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Report");
    XLSX.writeFile(book, `ShilingiBet_${format(startDate, "yyyy-MM-dd")}_to_${format(endDate, "yyyy-MM-dd")}.xlsx`);
  };

  const greeting = (() => {
    const hour = new Date().getHours();
    return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  })();

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header + period selector */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {greeting}
              {user?.name ? `, ${user.name.split(" ")[0]}` : ""}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Platform overview</h1>
              <LiveBadge live={isLive} updatedAt={dataUpdatedAt} fetching={isFetching} />
            </div>
            <p className="tabular mt-1 text-xs text-slate-500 dark:text-slate-400">
              {format(startDate, "EEE d MMM yyyy, HH:mm")} – {format(endDate, "EEE d MMM yyyy, HH:mm")} · compared with {period.compareLabel}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-900" role="tablist" aria-label="Reporting period">
              {periods.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="tab"
                  aria-selected={periodId === option.id}
                  onClick={() => {
                    setPeriodId(option.id);
                    setShowCustom(false);
                  }}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    periodId === option.id
                      ? "bg-brand text-black shadow-sm"
                      : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {option.label}
                </button>
              ))}
              <button
                type="button"
                role="tab"
                aria-selected={periodId === "custom"}
                onClick={() => setShowCustom((open) => !open)}
                className={`flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  periodId === "custom"
                    ? "bg-brand text-black shadow-sm"
                    : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <FiCalendar size={12} /> {periodId === "custom" ? period.label : "Custom"}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => refetch()}
                aria-label="Refresh numbers"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <FiRefreshCw size={15} className={isFetching ? "animate-spin" : ""} />
              </button>
              <button
                type="button"
                onClick={exportToExcel}
                disabled={isLoading}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-bold text-black hover:bg-brand-hover disabled:opacity-50"
              >
                <FiDownload size={14} /> Export report
              </button>
            </div>
          </div>
        </div>

        {showCustom && (
          <div className="mt-4 flex flex-col items-start gap-2 border-t border-slate-100 pt-4 dark:border-slate-700 sm:flex-row sm:items-center">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pick a start and end date:</span>
            <DatePicker
              selectsRange
              inline
              startDate={customRange[0]}
              endDate={customRange[1]}
              maxDate={new Date()}
              onChange={applyCustomRange}
            />
          </div>
        )}
      </section>

      {/* Needs attention: one calm panel, colour only where a person must act */}
      {canManageOperations && (
        <section aria-label="Needs attention" className="rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800">
          <div className="grid grid-cols-1 divide-y divide-slate-100 dark:divide-slate-700/60 sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-4 xl:divide-x">
            <AttentionItem
              to="/settings"
              icon={HiOutlineBanknotes}
              label="Payout float"
              value={treasuryLoading ? "…" : kes(treasuryBalance)}
              detail={treasuryTone === "red" ? "Too low: withdrawals will fail" : treasuryTone === "amber" ? "Running low" : "Healthy"}
              tone={treasuryTone}
            />
            <AttentionItem
              to="/transactions"
              icon={FiClock}
              label="Withdrawals waiting"
              value={`${count(attention.pendingWithdrawals)} · ${kes(attention.pendingWithdrawalAmount)}`}
              detail={attention.pendingWithdrawals > 0 ? "Requested, not yet paid" : "None waiting"}
              tone={attention.pendingWithdrawals > 0 ? "amber" : "ok"}
            />
            <AttentionItem
              to="/transactions"
              icon={FiAlertTriangle}
              label="Manual review"
              value={count(attention.manualReview)}
              detail={attention.manualReview > 0 ? "Payments we couldn't confirm" : "Nothing to review"}
              tone={attention.manualReview > 0 ? "red" : "ok"}
            />
            <AttentionItem
              to="/fraud-alerts"
              icon={FiShield}
              label="Bonuses on hold"
              value={count(attention.heldReferralAwards)}
              detail={attention.heldReferralAwards > 0 ? "Flagged as suspicious" : "None on hold"}
              tone={attention.heldReferralAwards > 0 ? "amber" : "ok"}
            />
          </div>
        </section>
      )}

      {/* The four numbers that matter most */}
      <section aria-label="Key results" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <KpiCard
          emphasis
          title="Gross gaming revenue"
          hint="GGR: what the house kept from bets (stakes on losing bets plus net virtual-game results). Our gaming income before costs."
          value={kes(a.totalRevenue, { compact: true })}
          meta={`Margin ${pct(ggrMargin)}`}
          icon={FiTrendingUp}
          tone="gold"
          loading={isLoading}
          change={change("totalRevenue")}
          changeLabel={period.compareLabel}
        />
        <KpiCard
          title="Net cash in"
          hint="Deposits minus withdrawals paid in this period. Negative means more left the platform than came in."
          value={kes(netCash, { compact: true })}
          valueClassName={netCash < 0 ? "!text-red-600 dark:!text-red-400" : ""}
          meta={`${kes(a.totalDeposit, { compact: true })} in · ${kes(a.totalWithdrawal, { compact: true })} out`}
          icon={HiOutlineBanknotes}
          tone={netCash < 0 ? "red" : "green"}
          loading={isLoading}
          change={p ? percentChange(netCash, p.totalDeposit - p.totalWithdrawal) : undefined}
          changeLabel={period.compareLabel}
        />
        <KpiCard
          title="Total staked"
          hint="Turnover: the total amount players bet, win or lose."
          value={kes(a.betAmount, { compact: true })}
          meta={`${count(a.betCount)} bets`}
          icon={FiTarget}
          tone="blue"
          loading={isLoading}
          change={change("betAmount")}
          changeLabel={period.compareLabel}
        />
        <KpiCard
          title="Active players"
          hint="Players who placed at least one bet in this period."
          value={count(a.activeBettors)}
          meta={`${count(a.allUsers)} new sign-ups`}
          icon={FiUsers}
          tone="violet"
          loading={isLoading}
          change={change("activeBettors")}
          changeLabel={period.compareLabel}
        />
      </section>

      {/* Everything else, one group at a time */}
      <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 dark:border-slate-700">
          <h2 className="text-[15px] font-semibold text-slate-800 dark:text-slate-100">Breakdown</h2>
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900" role="tablist" aria-label="Breakdown group">
            {DETAIL_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={detailTab === tab.key}
                onClick={() => setDetailTab(tab.key)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  detailTab === tab.key ? "bg-brand text-black shadow-sm" : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-6 p-5 lg:grid-cols-5">
          {detailTab === "money" && (
            <>
              <StatTile title="Deposits" hint="M-Pesa deposits that completed successfully." value={kes(a.totalDeposit)} meta={`${count(a.depositCount)} deposits`} loading={isLoading} change={change("totalDeposit")} changeLabel={period.compareLabel} />
              <StatTile title="Withdrawals paid" hint="Money successfully sent to players' M-Pesa." value={kes(a.totalWithdrawal)} meta={`${count(a.withdrawalCount)} payouts`} loading={isLoading} change={change("totalWithdrawal")} changeLabel={period.compareLabel} positiveIsGood={false} />
              <StatTile title="First-time depositors" hint="Players whose very first successful deposit happened in this period. The key growth number." value={count(a.firstTimeDepositors)} meta={a.allUsers ? `${pct((a.firstTimeDepositors / a.allUsers) * 100)} of sign-ups` : undefined} loading={isLoading} change={change("firstTimeDepositors")} changeLabel={period.compareLabel} />
              <StatTile title="Failed deposits" hint="Deposit attempts that failed or timed out (cancelled M-Pesa prompt, wrong PIN). A spike can mean a payment problem." value={count(a.failedDeposits)} loading={isLoading} change={change("failedDeposits")} changeLabel={period.compareLabel} positiveIsGood={false} />
              <StatTile title="Tax collected" hint="Excise duty on deposits plus withholding tax on withdrawals, due to KRA." value={kes(a.totalTax)} loading={isLoading} change={change("totalTax")} changeLabel={period.compareLabel} />
            </>
          )}
          {detailTab === "betting" && (
            <>
              <StatTile title="Paid to winners" hint="Winnings credited to players from settled bets." value={kes(a.winAmount)} meta={a.betAmount ? `${pct((a.winAmount / a.betAmount) * 100)} of stakes returned` : undefined} loading={isLoading} change={change("winAmount")} changeLabel={period.compareLabel} positiveIsGood={false} />
              <StatTile title="Bets placed" hint="Number of bets placed in this period." value={count(a.betCount)} meta={a.betCount ? `Avg stake ${kes(Math.round(avgStake))}` : undefined} loading={isLoading} change={change("betCount")} changeLabel={period.compareLabel} />
              <StatTile title="Voided bets" hint="Stakes refunded because the game provider cancelled the bet." value={kes(a.rollbackAmount)} loading={isLoading} change={change("rollbackAmount")} changeLabel={period.compareLabel} positiveIsGood={false} />
            </>
          )}
          {detailTab === "players" && (
            <>
              <StatTile title="New sign-ups" hint="Players who registered in this period." value={count(a.allUsers)} loading={isLoading} change={change("allUsers")} changeLabel={period.compareLabel} />
              <StatTile title="Referred sign-ups" hint="Players who joined using someone's referral link." value={count(a.totalReferredUsers)} meta={a.allUsers ? `${pct((a.totalReferredUsers / a.allUsers) * 100)} of sign-ups` : undefined} loading={isLoading} change={change("totalReferredUsers")} changeLabel={period.compareLabel} />
              <StatTile title="Referral bonus paid" hint="KES 10 paid to the referrer once their friend has deposited KES 50 or more." value={kes(a.totalReferralEarnings)} loading={isLoading} change={change("totalReferralEarnings")} changeLabel={period.compareLabel} />
              <StatTile title="Cashback paid" hint="Daily cashback credited to players on their net losses." value={kes(a.totalCashback)} loading={isLoading} change={change("totalCashback")} changeLabel={period.compareLabel} />
              <StatTile title="Welcome bonus" hint="Sign-up bonus. Switched off for new players; this shows historic awards only." value={kes(a.totalWelcomeBonus)} meta="Switched off" loading={isLoading} />
            </>
          )}
        </div>

        {/* Balances right now: always visible, one slim strip */}
        <div className="grid grid-cols-1 gap-4 border-t border-slate-100 bg-slate-50/60 px-5 py-4 dark:border-slate-700 dark:bg-slate-900/30 sm:grid-cols-3">
          <StatTile title="Player balances (total)" hint="Every player's wallet, cash plus bonus. Our liability to players right now." value={kes(a.playerBalance)} loading={isLoading} />
          <StatTile
            title="Withdrawable cash"
            hint="The part of balances players can withdraw today. The payout float should cover this."
            value={kes(a.playerWithdrawableBalance)}
            meta={canManageOperations ? `Float covers ${pct(Math.min(floatCoverage, 999))}` : undefined}
            loading={isLoading}
          />
          <StatTile title="Locked bonus funds" hint="Bonus money usable for betting but not yet withdrawable." value={kes(a.playerBonusBalance)} loading={isLoading} />
        </div>
      </section>

      {/* Trend + live feed side by side */}
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800 xl:col-span-3">
          <SectionTitle title="Revenue trend" description="GGR, stakes and winnings, last 12 months" />
          <RevenueChart />
        </section>
        <div className="min-w-0 xl:col-span-2">{canManageOperations && <ActivityFeed maxHeight={330} />}</div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <SectionTitle
          title="Latest transactions"
          description="The five most recent deposits and withdrawals"
          action={
            <Link to="/transactions" className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:underline dark:text-brand">
              View all <FiChevronRight />
            </Link>
          }
        />
        <InvoiceTable />
      </section>
    </div>
  );
}
