import { useState } from "react";
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
import { FiRefreshCw, FiDatabase } from "react-icons/fi";
import { TbArrowDown, TbArrowUp, TbReceiptTax } from "react-icons/tb";
import * as XLSX from "xlsx";
import { useGetAnalytics } from "../hooks/useGetAnalytics";
import { useFormatCurrency } from "../hooks/useFormatCurrency";
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

export default function DashboardHome() {
  const { formatCurrency } = useFormatCurrency();
  const today = new Date();

  const [dateRange, setDateRange] = useState([
    startOfDay(today),
    endOfDay(today),
  ]);
  const [startDate, endDate] = dateRange;
  const [activeFilter, setActiveFilter] = useState("today");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { analytics, isLoading, refetch } = useGetAnalytics(startDate, endDate);

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
  //
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
      <div className="bg-white rounded-xl p-5 border border-slate-200">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              Analytics Overview
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
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
          <div className="flex flex-col sm:flex-row gap-3 items-center pt-4 mt-4 border-t border-slate-100">
            <div className="flex items-center rounded-lg px-3 py-2 w-full sm:w-auto border border-slate-200 bg-slate-50 focus-within:border-slate-400 focus-within:bg-white transition-colors">
              <FiCalendar className="text-slate-400 mr-2" size={16} />
              <DatePicker
                selectsRange
                startDate={startDate}
                endDate={endDate}
                onChange={handleDateChange}
                placeholderText="Select date range"
                dateFormat="MMM d, yyyy"
                className="bg-transparent text-slate-700 outline-none w-full sm:w-48 text-sm"
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatsCard
          icon={<FaUser size={20} className="text-blue-600" />}
          bgColor="bg-blue-100"
          number={isLoading ? <Shimmer /> : analytics?.analytics?.allUsers ?? 0}
          title="Registered Users"
          change="All users on platform"
        />
        <StatsCard
          icon={<FaUsers size={20} className="text-purple-600" />}
          bgColor="bg-purple-100"
          number={
            isLoading ? (
              <Shimmer />
            ) : (
              analytics?.analytics?.totalReferredUsers ?? 0
            )
          }
          title="Referred Users"
          change="Users joined via referral"
        />
        <StatsCard
          icon={<FaMoneyBillWave size={20} className="text-green-600" />}
          bgColor="bg-green-100"
          number={
            isLoading ? (
              <Shimmer />
            ) : (
              formatCurrency(analytics?.analytics?.totalRevenue ?? 0)
            )
          }
          title="Total Revenue"
          change="Revenue earned"
        />
        <StatsCard
          icon={<FaCoins size={20} className="text-yellow-600" />}
          bgColor="bg-yellow-100"
          number={
            isLoading ? (
              <Shimmer />
            ) : (
              formatCurrency(analytics?.analytics?.betAmount ?? 0)
            )
          }
          title="Bet Amount"
          change="Total amount bet"
        />
        <StatsCard
          icon={<FaTrophy size={20} className="text-pink-600" />}
          bgColor="bg-pink-100"
          number={
            isLoading ? (
              <Shimmer />
            ) : (
              formatCurrency(analytics?.analytics?.winAmount ?? 0)
            )
          }
          title="Win Amount"
          change="Winnings paid"
        />
        <StatsCard
          icon={<FaMoneyBillWave size={20} className="text-orange-600" />}
          bgColor="bg-orange-100"
          number={
            isLoading ? (
              <Shimmer />
            ) : (
              formatCurrency(analytics?.analytics?.profit ?? 0)
            )
          }
          title={analytics?.analytics?.isLoss ? "Loss" : "Profit"}
          change={
            analytics?.analytics?.isLoss ? "Overall loss" : "Overall profit"
          }
          isLoss={analytics?.analytics?.isLoss}
        />
        <StatsCard
          icon={<TbArrowUp size={20} className="text-green-600" />}
          bgColor="bg-green-100"
          number={
            isLoading ? (
              <Shimmer />
            ) : (
              formatCurrency(analytics?.analytics?.totalDeposit ?? 0)
            )
          }
          title="Deposits"
          change="Total deposits"
        />
        <StatsCard
          icon={<TbArrowDown size={20} className="text-red-600" />}
          bgColor="bg-red-100"
          number={
            isLoading ? (
              <Shimmer />
            ) : (
              formatCurrency(analytics?.analytics?.totalWithdrawal ?? 0)
            )
          }
          title="Withdrawals"
          change="Total withdrawals"
        />
        <StatsCard
          icon={<TbReceiptTax size={20} className="text-indigo-600" />}
          bgColor="bg-indigo-100"
          number={
            isLoading ? (
              <Shimmer />
            ) : (
              formatCurrency(analytics?.analytics?.totalTax ?? 0)
            )
          }
          title="Tax"
          change="Tax collected"
        />
        <StatsCard
          icon={<FaPiggyBank size={20} className="text-emerald-600" />}
          bgColor="bg-emerald-100"
          number={
            isLoading ? (
              <Shimmer />
            ) : (
              formatCurrency(analytics?.analytics?.totalReferralEarnings ?? 0)
            )
          }
          title="Referral Bonus"
          change="Bonus awarded"
        />
        <StatsCard
          icon={<FaGift size={20} className="text-fuchsia-600" />}
          bgColor="bg-fuchsia-100"
          number={
            isLoading ? (
              <Shimmer />
            ) : (
              formatCurrency(analytics?.analytics?.totalWelcomeBonus ?? 0)
            )
          }
          title="Welcome Bonus"
          change="Welcome bonuses credited"
        />
        <StatsCard
          icon={<FaCoins size={20} className="text-cyan-600" />}
          bgColor="bg-cyan-100"
          number={
            isLoading ? (
              <Shimmer />
            ) : (
              formatCurrency(analytics?.analytics?.totalCashback ?? 0)
            )
          }
          title="Cashback"
          change="Cashback awarded"
        />
        <StatsCard
          icon={<FiRefreshCw size={20} className="text-cyan-600" />}
          bgColor="bg-teal-100"
          number={
            isLoading ? (
              <Shimmer />
            ) : (
              formatCurrency(analytics?.analytics?.rollbackAmount ?? 0)
            )
          }
          title="Rollback Amount"
          change="Total rolled back"
        />

        <StatsCard
          icon={<FiDatabase size={20} className="text-violet-600" />}
          bgColor="bg-violet-100"
          number={
            isLoading ? (
              <Shimmer />
            ) : (
              formatCurrency(analytics?.analytics?.playerBalance ?? 0)
            )
          }
          title="Users Balance"
          change="Total balance across players"
        />
        <StatsCard
          icon={<FiDatabase size={20} className="text-fuchsia-600" />}
          bgColor="bg-fuchsia-100"
          number={
            isLoading ? (
              <Shimmer />
            ) : (
              formatCurrency(analytics?.analytics?.playerBonusBalance ?? 0)
            )
          }
          title="Users Bonus Balance"
          change="Restricted betting funds"
        />
        <StatsCard
          icon={<FiDatabase size={20} className="text-sky-600" />}
          bgColor="bg-sky-100"
          number={
            isLoading ? (
              <Shimmer />
            ) : (
              formatCurrency(analytics?.analytics?.playerWithdrawableBalance ?? 0)
            )
          }
          title="Users Withdrawable"
          change="Cash available for withdrawal"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-1 lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 min-h-[320px]">
          <div className="mb-4">
            <h4 className="text-base font-semibold text-slate-800">Revenue Trends</h4>
            <p className="text-sm text-slate-500">Monthly revenue performance</p>
          </div>
          <RevenueChart />
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 min-h-[320px]">
          <div className="mb-4">
            <h4 className="text-base font-semibold text-slate-800">Transaction Flow</h4>
            <p className="text-sm text-slate-500">Deposits vs Withdrawals</p>
          </div>
          <CustomerActivityChart
            deposits={analytics?.analytics?.totalDeposit}
            withdrawals={analytics?.analytics?.totalWithdrawal}
          />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl p-5 border border-slate-200">
        <div className="mb-4">
          <h4 className="text-base font-semibold text-slate-800">Recent Transactions</h4>
          <p className="text-sm text-slate-500">Latest transaction records</p>
        </div>
        <InvoiceTable />
      </div>
    </div>
  );
}
