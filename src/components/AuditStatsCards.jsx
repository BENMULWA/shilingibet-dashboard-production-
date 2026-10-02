import {
  FiActivity,
  FiUsers,
  FiCalendar,
  FiArrowUpRight,
  FiArrowDownLeft,
} from "react-icons/fi";
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";
import { useGetAuditStats } from "../hooks/useGetAuditLogs";
import Shimmer from "./Shimmer";

function StatCard({ icon, bgColor, title, value, subtitle, isLoading }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-sm text-slate-500 dark:text-slate-400">{title}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        {isLoading ? <Shimmer /> : value}
      </div>
      {subtitle && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

function ActionBreakdown({ actionCounts, isLoading }) {
  const actionConfig = {
    deposit_initiated: { color: "bg-blue-500", label: "Deposits Initiated" },
    deposit_successful: { color: "bg-emerald-500", label: "Deposits Successful" },
    deposit_retry_scheduled: { color: "bg-amber-400", label: "Deposit Retry Scheduled" },
    deposit_retry_executed: { color: "bg-amber-500", label: "Deposit Retry Executed" },
    withdrawal_requested: { color: "bg-orange-500", label: "Withdrawals Requested" },
    withdrawal_successful: { color: "bg-teal-500", label: "Withdrawals Successful" },
    cashback_redeemed: { color: "bg-purple-500", label: "Cashback Redeemed" },
    referral_earnings_redeemed: { color: "bg-pink-500", label: "Referral Redeemed" },
    internal_transfer_success: { color: "bg-indigo-500", label: "Transfer Success" },
    internal_transfer_failed: { color: "bg-red-500", label: "Transfer Failed" },
    secondary_wallet_transfer: { color: "bg-cyan-500", label: "Wallet Transfer" },
  };

  const total = Object.values(actionCounts || {}).reduce((a, b) => a + b, 0) || 1;

  // Sort actions by count descending
  const sortedActions = Object.entries(actionCounts || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6); // Show top 6 actions

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Action Types</h4>
      {isLoading ? (
        <div className="space-y-3">
          <Shimmer />
          <Shimmer />
          <Shimmer />
        </div>
      ) : sortedActions.length > 0 ? (
        <div className="space-y-3">
          {sortedActions.map(([action, count]) => {
            const config = actionConfig[action] || { color: "bg-slate-500", label: action };
            const percentage = ((count / total) * 100).toFixed(1);
            return (
              <div key={action}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-slate-600 dark:text-slate-300 truncate max-w-[150px]">{config.label}</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{count.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className={`${config.color} h-2 rounded-full transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">No data available</p>
      )}
    </div>
  );
}

function TopUsers({ userCounts, isLoading }) {
  // Get top 5 users by activity count
  const topUsers = Object.entries(userCounts || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const maxCount = topUsers[0]?.[1] || 1;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Most Active Users</h4>
      {isLoading ? (
        <div className="space-y-3">
          <Shimmer />
          <Shimmer />
          <Shimmer />
        </div>
      ) : topUsers.length > 0 ? (
        <div className="space-y-3">
          {topUsers.map(([userId, count]) => {
            const percentage = ((count / maxCount) * 100).toFixed(1);
            return (
              <div key={userId}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-slate-600 dark:text-slate-300 font-mono" title={userId}>
                    {userId}
                  </span>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{count} events</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">No data available</p>
      )}
    </div>
  );
}

function AuditStatsCards() {
  const { stats, isLoading } = useGetAuditStats();

  const successfulActions = stats?.outcomeCounts?.success || 0;
  const failedActions = stats?.outcomeCounts?.failed || 0;
  const uniqueUsers = Object.keys(stats?.userCounts || {}).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <HiOutlineClipboardDocumentList className="text-indigo-500" size={24} />
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Audit Statistics</h3>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FiActivity className="text-indigo-600" size={20} />}
          bgColor="bg-indigo-100"
          title="Total Logs"
          value={stats?.totalLogs?.toLocaleString() || 0}
          subtitle="All audit events"
          isLoading={isLoading}
        />
        <StatCard
          icon={<FiUsers className="text-blue-600" size={20} />}
          bgColor="bg-blue-100"
          title="Unique Users"
          value={uniqueUsers?.toLocaleString() || 0}
          subtitle="Active users"
          isLoading={isLoading}
        />
        <StatCard
          icon={<FiArrowDownLeft className="text-emerald-600" size={20} />}
          bgColor="bg-emerald-100"
          title="Successful Actions"
          value={successfulActions.toLocaleString()}
          subtitle="Completed staff mutations"
          isLoading={isLoading}
        />
        <StatCard
          icon={<FiArrowUpRight className="text-orange-600" size={20} />}
          bgColor="bg-orange-100"
          title="Failed Actions"
          value={failedActions.toLocaleString()}
          subtitle="Rejected or failed mutations"
          isLoading={isLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ActionBreakdown actionCounts={stats?.actionCounts} isLoading={isLoading} />
        <TopUsers userCounts={stats?.userCounts} isLoading={isLoading} />
      </div>
    </div>
  );
}

export default AuditStatsCards;
