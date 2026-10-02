import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { useGetMonthlyAnalytics } from "../hooks/useGetAnalytics";
import { TbTrendingUp, TbTrendingDown } from "react-icons/tb";

const formatCompact = (value) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl border border-slate-700">
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">{label}</p>
        {payload.map((item, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-slate-300">{item.name}:</span>
            <span className="font-semibold">KES {formatCompact(item.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function RevenueChart() {
  const { monthlyAnalytics, isLoading } = useGetMonthlyAnalytics();

  const chartData = Array.isArray(monthlyAnalytics)
    ? monthlyAnalytics.map((item) => {
        const date = new Date(item.year, item.month - 1);
        return {
          date: format(date, "MMM"),
          revenue: item.revenue,
          betAmount: item.betAmount,
          winAmount: item.winAmount,
        };
      })
    : [];

  let growthRate = 0;
  if (chartData.length >= 2) {
    const current = chartData[chartData.length - 1].revenue;
    const previous = chartData[chartData.length - 2].revenue;
    if (previous > 0) {
      growthRate = ((current - previous) / previous) * 100;
    }
  }

  const isPositive = growthRate >= 0;

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="w-8 h-8 bg-slate-200 rounded-full" />
          <div className="w-24 h-3 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs text-slate-600 dark:text-slate-300">Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-600 dark:text-slate-300">Bet Amount</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#f9ce36]" />
            <span className="text-xs text-slate-600 dark:text-slate-300">Win Amount</span>
          </div>
        </div>
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            isPositive
              ? "bg-[#f9ce36]/20 text-amber-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {isPositive ? <TbTrendingUp size={14} /> : <TbTrendingDown size={14} />}
          {isPositive ? "+" : ""}
          {growthRate.toFixed(1)}%
        </div>
      </div>

      {/* Chart */}
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorBet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorWin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f9ce36" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f9ce36" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#94A3B8" }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#94A3B8" }}
              tickFormatter={formatCompact}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#colorRevenue)"
              name="Revenue"
            />
            <Area
              type="monotone"
              dataKey="betAmount"
              stroke="#10B981"
              strokeWidth={2}
              fill="url(#colorBet)"
              name="Bet Amount"
            />
            <Area
              type="monotone"
              dataKey="winAmount"
              stroke="#f9ce36"
              strokeWidth={2}
              fill="url(#colorWin)"
              name="Win Amount"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
