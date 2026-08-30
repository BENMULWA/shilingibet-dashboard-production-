import { useState } from "react";
import { Dropdown, Button, Space } from "antd";
import { DownOutlined } from "@ant-design/icons";
import {
  FiAlertTriangle,
  FiUsers,
  FiActivity,
  FiShield,
  FiTrendingUp,
} from "react-icons/fi";
import {
  HiOutlineShieldExclamation,
  HiOutlineExclamationCircle,
} from "react-icons/hi2";
import { useGetFraudStats } from "../hooks/useGetFraudAlerts";
import Shimmer from "./Shimmer";

function StatCard({ icon, bgColor, title, value, subtitle, isLoading }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-sm text-slate-500">{title}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900">
        {isLoading ? <Shimmer /> : value}
      </div>
      {subtitle && (
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

function TypeBreakdown({ byType, isLoading }) {
  const typeConfig = {
    bot_pattern: { color: "bg-purple-500", label: "Bot Pattern" },
    ip_mismatch: { color: "bg-blue-500", label: "IP Mismatch" },
    abnormal_winrate: { color: "bg-orange-500", label: "Abnormal Winrate" },
    high_velocity: { color: "bg-red-500", label: "High Velocity" },
    suspicious_activity: { color: "bg-pink-500", label: "Suspicious Activity" },
  };

  const total = Object.values(byType || {}).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200">
      <h4 className="text-sm font-semibold text-slate-700 mb-4">Alert Types</h4>
      {isLoading ? (
        <div className="space-y-3">
          <Shimmer />
          <Shimmer />
          <Shimmer />
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(byType || {}).map(([type, count]) => {
            const config = typeConfig[type] || { color: "bg-slate-500", label: type };
            const percentage = ((count / total) * 100).toFixed(1);
            return (
              <div key={type}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-slate-600">{config.label}</span>
                  <span className="text-sm font-medium text-slate-900">{count}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`${config.color} h-2 rounded-full transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RiskLevelBreakdown({ byRiskLevel, isLoading }) {
  const riskConfig = {
    low: { color: "bg-green-500", label: "Low Risk" },
    medium: { color: "bg-orange-500", label: "Medium Risk" },
    high: { color: "bg-red-500", label: "High Risk" },
    critical: { color: "bg-red-700", label: "Critical" },
  };

  const total = Object.values(byRiskLevel || {}).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200">
      <h4 className="text-sm font-semibold text-slate-700 mb-4">Risk Levels</h4>
      {isLoading ? (
        <div className="space-y-3">
          <Shimmer />
          <Shimmer />
          <Shimmer />
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(byRiskLevel || {}).map(([level, count]) => {
            const config = riskConfig[level] || { color: "bg-slate-500", label: level };
            const percentage = ((count / total) * 100).toFixed(1);
            return (
              <div key={level}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-slate-600">{config.label}</span>
                  <span className="text-sm font-medium text-slate-900">{count}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`${config.color} h-2 rounded-full transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DailyTrend({ byDay, isLoading }) {
  const maxCount = Math.max(...(byDay?.map((d) => d.count) || [1]));

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200">
      <h4 className="text-sm font-semibold text-slate-700 mb-4">Daily Trend</h4>
      {isLoading ? (
        <div className="space-y-2">
          <Shimmer />
          <Shimmer />
        </div>
      ) : byDay?.length > 0 ? (
        <div className="space-y-2">
          {byDay.slice(0, 7).map((day) => {
            const percentage = ((day.count / maxCount) * 100).toFixed(1);
            const date = new Date(day._id).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
            return (
              <div key={day._id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-slate-600">{date}</span>
                  <div className="text-right">
                    <span className="text-sm font-medium text-slate-900">{day.count}</span>
                    <span className="text-xs text-slate-500 ml-2">
                      (avg: {day.avgScore?.toFixed(1) || 0})
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-500">No data available</p>
      )}
    </div>
  );
}

function FraudStatsCards() {
  const [days, setDays] = useState(7);
  const { stats, isLoading } = useGetFraudStats(days);

  const daysOptions = [
    { key: "7", label: "Last 7 days" },
    { key: "14", label: "Last 14 days" },
    { key: "30", label: "Last 30 days" },
  ];

  return (
    <div className="space-y-4">
      {/* Header with filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HiOutlineShieldExclamation className="text-red-500" size={24} />
          <h3 className="text-lg font-semibold text-slate-800">Fraud Statistics</h3>
        </div>
        <Dropdown
          menu={{
            items: daysOptions,
            onClick: (e) => setDays(parseInt(e.key)),
            selectable: true,
            selectedKeys: [days.toString()],
          }}
          trigger={["click"]}
        >
          <Button className="h-9 px-3 rounded-lg border-slate-200">
            <Space>
              Last {days} days
              <DownOutlined className="text-slate-400" />
            </Space>
          </Button>
        </Dropdown>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FiAlertTriangle className="text-red-600" size={20} />}
          bgColor="bg-red-100"
          title="Total Alerts"
          value={stats?.total?.toLocaleString() || 0}
          subtitle="All fraud alerts"
          isLoading={isLoading}
        />
        <StatCard
          icon={<FiUsers className="text-blue-600" size={20} />}
          bgColor="bg-blue-100"
          title="Unique Users"
          value={stats?.uniqueUsers?.toLocaleString() || 0}
          subtitle="Flagged users"
          isLoading={isLoading}
        />
        <StatCard
          icon={<HiOutlineExclamationCircle className="text-orange-600" size={20} />}
          bgColor="bg-orange-100"
          title="Open Alerts"
          value={stats?.byStatus?.open?.toLocaleString() || 0}
          subtitle="Pending review"
          isLoading={isLoading}
        />
        <StatCard
          icon={<FiShield className="text-emerald-600" size={20} />}
          bgColor="bg-emerald-100"
          title="Resolved"
          value={(stats?.byStatus?.resolved_legitimate || 0) + (stats?.byStatus?.resolved_fraud || 0)}
          subtitle="Processed alerts"
          isLoading={isLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TypeBreakdown byType={stats?.byType} isLoading={isLoading} />
        <RiskLevelBreakdown byRiskLevel={stats?.byRiskLevel} isLoading={isLoading} />
        <DailyTrend byDay={stats?.byDay} isLoading={isLoading} />
      </div>
    </div>
  );
}

export default FraudStatsCards;
