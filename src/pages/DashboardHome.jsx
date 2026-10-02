import { useEffect, useState } from "react";
import { FiCalendar, FiFilter, FiDownload } from "react-icons/fi";
import {
  FaUser,
  FaUsers,
  FaMoneyBillWave,
  FaCoins,
  FaTrophy,
  FaPiggyBank,
  FaGift,
} from "react-icons/fa";
import { FiRefreshCw, FiDatabase, FiAlertTriangle } from "react-icons/fi";
import { HiOutlineBanknotes } from "react-icons/hi2";
import { TbArrowDown, TbArrowUp, TbReceiptTax } from "react-icons/tb";
import * as XLSX from "xlsx";
import { useGetAnalytics } from "../hooks/useGetAnalytics";
import { useGetSecondaryWallet } from "../hooks/useTransfer";
import { useFormatCurrency } from "../hooks/useFormatCurrency";
import { useAuthState } from "../context/AuthContext";
import { normalizeStaffRole } from "../utils/authSession";
import Shimmer from "../components/Shimmer";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  format,
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  differenceInDays,
  addDays,
} from "date-fns";
import StatsCard from "../components/StatsCard";
import { Dropdown, Button, Space } from "antd";
import { DownOutlined } from "@ant-design/icons";
import InvoiceTable from "../components/InvoiceTable";
import RevenueChart from "../components/RevenueChart";
import CustomerActivityChart from "../components/CustomerActivityChart";

// Treasury balance below this is flagged red; below 2x this is flagged amber.
// Tune this to whatever float level actually feels "safe" for your payout volume.
const TREASURY_LOW_THRESHOLD = 5000;

function SectionHeading({ children }) {
  return (
    <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3">
      {children}
    </h5>
  );
}

function LiveIndicator({ live, updatedAt }) {
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (!live) return undefined;
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [live]);

  if (!live) return null;

  const secondsAgo = updatedAt ? Math.max(0, Math.round((Date.now() - updatedAt) / 1000)) : null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      Live{secondsAgo !== null ? ` · updated ${secondsAgo}s ago` : ""}
    </div>
  );
}

export default function DashboardHome() {
  const { formatCurrency } = useFormatCurrency();
  const { user } = useAuthState();
  const canManageOperations = ["admin", "super_admin"].includes(
    normalizeStaffRole(user)
  );
  const today = new Date();

  const [dateRange, setDateRange] = useState([
    startOfDay(today),
    endOfDay(today),
  ]);
  const [startDate, endDate] = dateRange;
  const [activeFilter, setActiveFilter] = useState("today");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isLiveEligible = activeFilter === "today";
  const { analytics, isLoading, refetch, dataUpdatedAt } = useGetAnalytics(
    startDate,
    endDate,
    { live: isLiveEligible }
  );
  const { secondaryWalletBalance, isLoading: treasuryLoading } =
    useGetSecondaryWallet(canManageOperations, { live: isLiveEligible });

  const treasuryBalance = Number(secondaryWalletBalance?.balance || 0);
  const treasuryStatus =
    treasuryBalance <= TREASURY_LOW_THRESHOLD
      ? "critical"
      : treasuryBalance <= TREASURY_LOW_THRESHOLD * 2
        ? "warning"
        : "healthy";

  const treasuryStyles = {
    critical: {
      border: "border-red-200 dark:border-red-900",
      bg: "bg-red-50 dark:bg-red-950/40",
      icon: "bg-red-100 dark:bg-red-900/50",
      iconColor: "text-red-600 dark:text-red-400",
      text: "text-red-700 dark:text-red-400",
    },
    warning: {
      border: "border-amber-200 dark:border-amber-900",
      bg: "bg-amber-50 dark:bg-amber-950/40",
      icon: "bg-amber-100 dark:bg-amber-900/50",
      iconColor: "text-amber-600 dark:text-amber-400",
      text: "text-amber-700 dark:text-amber-400",
    },
    healthy: {
      border: "border-emerald-200 dark:border-emerald-900",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      icon: "bg-emerald-100 dark:bg-emerald-900/50",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      text: "text-emerald-700 dark:text-emerald-400",
    },
  }[treasuryStatus];

  // ✅ Export to Excel
  const exportToExcel = () => {
    const data = [
      ["Metric", "Value"],
      ["Registered Users", analytics?.analytics?.allUsers ?? 0],
      ["Referred Users", analytics?.analytics?.totalReferredUsers ?? 0],
      ["Total Revenue", analytics?.analytics?.totalRevenue ?? 0],
      ["Bet Amount", analytics?.analytics?.betAmount ?? 0],
      ["Win Amount", analytics?.analytics?.winAmount ?? 0],
      ["Profit", analytics?.analytics?.profit ?? 0],
      ["Users Balance", analytics?.analytics?.playerBalance ?? 0],
      ["Users Bonus Balance", analytics?.analytics?.playerBonusBalance ?? 0],
      ["Users Withdrawable Balance", analytics?.analytics?.playerWithdrawableBalance ?? 0],
      ["Total Deposit", analytics?.analytics?.totalDeposit ?? 0],
      ["Total Withdrawal", analytics?.analytics?.totalWithdrawal ?? 0],
      ["Referral Bonus", analytics?.analytics?.totalReferralEarnings ?? 0],
      ["Welcome Bonus", analytics?.analytics?.totalWelcomeBonus ?? 0],
      ["Cashback", analytics?.analytics?.totalCashback ?? 0],
      ["Tax", analytics?.analytics?.totalTax ?? 0],
      ["Withdrawal Treasury Balance", treasuryBalance],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Analytics");

    const fileName = `Analytics_${format(startDate, "yyyy-MM-dd")}_to_${format(
      endDate,
      "yyyy-MM-dd"
    )}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const timeFilters = [
    {
      id: "today",
      label: "Today",
      dates: [startOfDay(today), endOfDay(today)],
    },
    {
      id: "yesterday",
      label: "Yesterday",
      dates: [startOfDay(subDays(today, 1)), endOfDay(subDays(today, 1))],
    },
    {
      id: "this_week",
      label: "This Week",
      dates: [startOfWeek(today), endOfWeek(today)],
    },
    {
      id: "last_week",
      label: "Last Week",
      dates: [startOfWeek(subDays(today, 7)), endOfWeek(subDays(today, 7))],
    },
    {
      id: "this_month",
      label: "This Month",
      dates: [startOfMonth(today), endOfMonth(today)],
    },
    {
      id: "last_month",
      label: "Last Month",
      dates: [
        startOfMonth(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
        endOfMonth(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
      ],
    },
  ];

  const handleFilterChange = (filterId) => {
    const filter = timeFilters.find((f) => f.id === filterId);
    setDateRange(filter.dates);
    setActiveFilter(filterId);
    setShowDatePicker(false);
    refetch();
  };

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    if (!start && !end) return handleFilterChange("today");
    if (start && !end) {
      const rangeLength = differenceInDays(today, start);
      const smartEndDate = rangeLength > 30 ? addDays(start, 30) : today;
      setDateRange([start, smartEndDate]);
      setActiveFilter("custom");
      return;
    }
    setDateRange([start, end]);
    if (start && end) setActiveFilter("custom");
  };

  const applyFilters = () => {
    refetch();
    setShowDatePicker(false);
  };

  const getActiveFilterLabel = () =>
    timeFilters.find((f) => f.id === activeFilter)?.label || "Custom Range";

  const items = timeFilters.map((filter) => ({
    key: filter.id,
    label: (
      <span
        className={
          activeFilter === filter.id ? "text-green-600 font-medium" : ""
        }
      >
        {filter.label}
      </span>
    ),
  }));

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Analytics Overview
              </h3>
              <LiveIndicator live={isLiveEligible} updatedAt={dataUpdatedAt} />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {startDate && endDate
                ? `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`
                : "Select a date range"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Dropdown
              menu={{
                items,
                onClick: (e) => handleFilterChange(e.key),
                selectable: true,
              }}
              trigger={["click"]}
            >
              <Button className="h-9 px-3 rounded-lg border-slate-200 hover:border-slate-300 hover:bg-slate-50">
                <Space>
                  <FiCalendar className="text-slate-500" size={14} />
                  {getActiveFilterLabel()}
                  <DownOutlined className="text-slate-400" />
                </Space>
              </Button>
            </Dropdown>

            <Button
              icon={<FiFilter size={14} />}
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`h-9 px-3 rounded-lg ${
                activeFilter === "custom"
                  ? "bg-[#f9ce36] text-slate-900 border-[#f9ce36]"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              Custom Range
            </Button>

            <Button
              icon={<FiDownload size={14} />}
              onClick={exportToExcel}
              disabled={isLoading}
              className="h-9 px-3 rounded-lg bg-[#f9ce36] text-slate-900 border-[#f9ce36] hover:bg-[#e6bd2e]"
            >
              Export
            </Button>
          </div>
        </div>

        {showDatePicker && (
          <div className="flex flex-col sm:flex-row gap-3 items-center pt-4 mt-4 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center rounded-lg px-3 py-2 w-full sm:w-auto border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus-within:border-slate-400 focus-within:bg-white transition-colors">
              <FiCalendar className="text-slate-400 mr-2" size={16} />
              <DatePicker
                selectsRange
                startDate={startDate}
                endDate={endDate}
                onChange={handleDateChange}
                placeholderText="Select date range"
                dateFormat="MMM d, yyyy"
                className="bg-transparent text-slate-700 dark:text-slate-200 outline-none w-full sm:w-48 text-sm"
              />
            </div>
            <Button
              type="primary"
              onClick={applyFilters}
              className="h-9 px-4 rounded-lg bg-[#f9ce36] hover:bg-[#e6bd2e] border-0 w-full sm:w-auto text-slate-900"
            >
              Apply
            </Button>
          </div>
        )}
      </div>

      {/* Treasury alert banner — persistent, not just a toast, so it can't be missed */}
      {canManageOperations && !treasuryLoading && treasuryStatus !== "healthy" && (
        <div
          className={`flex items-center gap-3 rounded-xl border p-4 ${treasuryStyles.border} ${treasuryStyles.bg}`}
        >
          <FiAlertTriangle className={`shrink-0 ${treasuryStyles.iconColor}`} size={20} />
          <p className={`text-sm font-medium ${treasuryStyles.text}`}>
            {treasuryStatus === "critical"
              ? `Withdrawal treasury critically low (KES ${treasuryBalance.toLocaleString()}) — most withdrawals will fail until it's funded.`
              : `Withdrawal treasury is running low (KES ${treasuryBalance.toLocaleString()}) — consider topping it up soon.`}
          </p>
        </div>
      )}

      {/* Pulse Strip — the numbers to check first */}
      <div>
        <SectionHeading>Platform Pulse</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {canManageOperations && (
            <div className={`rounded-xl p-5 border ${treasuryStyles.border} ${treasuryStyles.bg}`}>
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <p className={`text-xs font-medium uppercase tracking-wide truncate ${treasuryStyles.text}`}>
                    Withdrawal Treasury
                  </p>
                  <h3 className={`text-base font-semibold truncate ${treasuryStyles.text}`}>
                    {treasuryLoading ? <Shimmer /> : formatCurrency(treasuryBalance)}
                  </h3>
                  <p className={`text-xs truncate ${treasuryStyles.text} opacity-80`}>
                    {treasuryStatus === "critical"
                      ? "Critical — fund now"
                      : treasuryStatus === "warning"
                        ? "Running low"
                        : "Healthy"}
                  </p>
                </div>
                <div className={`${treasuryStyles.icon} p-3 rounded-lg flex-shrink-0`}>
                  <HiOutlineBanknotes size={20} className={treasuryStyles.iconColor} />
                </div>
              </div>
            </div>
          )}
          <StatsCard
            icon={<FaUser size={20} className="text-blue-600" />}
            bgColor="bg-blue-100"
            number={isLoading ? <Shimmer /> : analytics?.analytics?.allUsers ?? 0}
            title="Registered Users"
            change="All users on platform"
          />
          <StatsCard
            icon={<FaMoneyBillWave size={20} className="text-green-600" />}
            bgColor="bg-green-100"
            number={
              isLoading ? <Shimmer /> : formatCurrency(analytics?.analytics?.totalRevenue ?? 0)
            }
            title="Gross Gaming Revenue"
            change="Revenue earned"
          />
          <StatsCard
            icon={<FaMoneyBillWave size={20} className="text-orange-600" />}
            bgColor="bg-orange-100"
            number={
              isLoading ? <Shimmer /> : formatCurrency(analytics?.analytics?.profit ?? 0)
            }
            title={analytics?.analytics?.isLoss ? "Net Loss" : "Net Profit"}
            change={
              analytics?.analytics?.isLoss
                ? "Withdrawals exceed deposits"
                : "Deposits minus withdrawals"
            }
            isLoss={analytics?.analytics?.isLoss}
          />
        </div>
      </div>

      {/* Money In */}
      <div>
        <SectionHeading>Money In</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={<TbArrowUp size={20} className="text-green-600" />}
            bgColor="bg-green-100"
            number={
              isLoading ? <Shimmer /> : formatCurrency(analytics?.analytics?.totalDeposit ?? 0)
            }
            title="Deposits"
            change="Total deposits"
          />
          <StatsCard
            icon={<FaPiggyBank size={20} className="text-emerald-600" />}
            bgColor="bg-emerald-100"
            number={
              isLoading
                ? <Shimmer />
                : formatCurrency(analytics?.analytics?.totalReferralEarnings ?? 0)
            }
            title="Referral Bonus"
            change="Bonus awarded"
          />
          <StatsCard
            icon={<FaGift size={20} className="text-fuchsia-600" />}
            bgColor="bg-fuchsia-100"
            number={
              isLoading
                ? <Shimmer />
                : formatCurrency(analytics?.analytics?.totalWelcomeBonus ?? 0)
            }
            title="Welcome Bonus"
            change="Disabled for new signups"
          />
          <StatsCard
            icon={<FaCoins size={20} className="text-cyan-600" />}
            bgColor="bg-cyan-100"
            number={
              isLoading ? <Shimmer /> : formatCurrency(analytics?.analytics?.totalCashback ?? 0)
            }
            title="Cashback"
            change="Cashback awarded"
          />
        </div>
      </div>

      {/* Betting Activity */}
      <div>
        <SectionHeading>Betting Activity</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatsCard
            icon={<FaCoins size={20} className="text-yellow-600" />}
            bgColor="bg-yellow-100"
            number={
              isLoading ? <Shimmer /> : formatCurrency(analytics?.analytics?.betAmount ?? 0)
            }
            title="Total Staked"
            change="Total amount bet"
          />
          <StatsCard
            icon={<FaTrophy size={20} className="text-pink-600" />}
            bgColor="bg-pink-100"
            number={
              isLoading ? <Shimmer /> : formatCurrency(analytics?.analytics?.winAmount ?? 0)
            }
            title="Payouts to Players"
            change="Winnings paid"
          />
          <StatsCard
            icon={<FiRefreshCw size={20} className="text-teal-600" />}
            bgColor="bg-teal-100"
            number={
              isLoading ? <Shimmer /> : formatCurrency(analytics?.analytics?.rollbackAmount ?? 0)
            }
            title="Voided / Refunded Bets"
            change="Total rolled back"
          />
        </div>
      </div>

      {/* Money Out & Player Liability */}
      <div>
        <SectionHeading>Money Out &amp; Player Liability</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={<TbArrowDown size={20} className="text-red-600" />}
            bgColor="bg-red-100"
            number={
              isLoading ? <Shimmer /> : formatCurrency(analytics?.analytics?.totalWithdrawal ?? 0)
            }
            title="Withdrawals"
            change="Total withdrawals"
          />
          <StatsCard
            icon={<FiDatabase size={20} className="text-violet-600" />}
            bgColor="bg-violet-100"
            number={
              isLoading ? <Shimmer /> : formatCurrency(analytics?.analytics?.playerBalance ?? 0)
            }
            title="Total Player Liability"
            change="Total balance across players"
          />
          <StatsCard
            icon={<FiDatabase size={20} className="text-fuchsia-600" />}
            bgColor="bg-fuchsia-100"
            number={
              isLoading
                ? <Shimmer />
                : formatCurrency(analytics?.analytics?.playerBonusBalance ?? 0)
            }
            title="Locked Bonus Funds"
            change="Restricted betting funds"
          />
          <StatsCard
            icon={<FiDatabase size={20} className="text-sky-600" />}
            bgColor="bg-sky-100"
            number={
              isLoading
                ? <Shimmer />
                : formatCurrency(analytics?.analytics?.playerWithdrawableBalance ?? 0)
            }
            title="Real Cash Exposure"
            change="Cash available for withdrawal"
          />
        </div>
      </div>

      {/* Financial Health */}
      <div>
        <SectionHeading>Financial Health</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={<TbReceiptTax size={20} className="text-indigo-600" />}
            bgColor="bg-indigo-100"
            number={
              isLoading ? <Shimmer /> : formatCurrency(analytics?.analytics?.totalTax ?? 0)
            }
            title="Tax"
            change="Tax collected"
          />
          <StatsCard
            icon={<FaUsers size={20} className="text-purple-600" />}
            bgColor="bg-purple-100"
            number={
              isLoading ? <Shimmer /> : analytics?.analytics?.totalReferredUsers ?? 0
            }
            title="Referred Users"
            change="Users joined via referral"
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-1 lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 min-h-[320px]">
          <div className="mb-4">
            <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100">Revenue Trends</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">Monthly revenue performance</p>
          </div>
          <RevenueChart />
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 min-h-[320px]">
          <div className="mb-4">
            <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100">Transaction Flow</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">Deposits vs Withdrawals</p>
          </div>
          <CustomerActivityChart
            deposits={analytics?.analytics?.totalDeposit}
            withdrawals={analytics?.analytics?.totalWithdrawal}
          />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
        <div className="mb-4">
          <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100">Recent Transactions</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">Latest transaction records</p>
        </div>
        <InvoiceTable />
      </div>
    </div>
  );
}
