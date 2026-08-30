import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { TbArrowUp, TbArrowDown } from "react-icons/tb";

const formatCompact = (value) => {
  if (!value) return "KES 0";
  if (value >= 1000000) return `KES ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `KES ${(value / 1000).toFixed(1)}K`;
  return `KES ${value}`;
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0];
    return (
      <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-sm">
        <span className="text-slate-300">{name}: </span>
        <span className="font-semibold">{formatCompact(value)}</span>
      </div>
    );
  }
  return null;
};

export default function CustomerActivityChart({ deposits = 0, withdrawals = 0 }) {
  const total = deposits + withdrawals;
  const depositPercent = total > 0 ? ((deposits / total) * 100).toFixed(0) : 0;
  const withdrawalPercent = total > 0 ? ((withdrawals / total) * 100).toFixed(0) : 0;

  const data = [
    { name: "Deposits", value: deposits, color: "#f9ce36" },
    { name: "Withdrawals", value: withdrawals, color: "#EF4444" },
  ];

  return (
    <div className="flex items-center gap-4 h-full">
      {/* Chart */}
      <div className="w-[140px] h-[140px] flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={60}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-3 flex-1 min-w-0">
        <div className="bg-[#f9ce36]/10 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-[#f9ce36]/30 rounded-full flex items-center justify-center flex-shrink-0">
              <TbArrowUp className="text-amber-600" size={14} />
            </div>
            <span className="text-xs text-slate-500">Deposits</span>
          </div>
          <p className="text-sm font-semibold text-slate-800">{formatCompact(deposits)}</p>
          <p className="text-xs text-amber-600 font-medium">{depositPercent}%</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <TbArrowDown className="text-red-600" size={14} />
            </div>
            <span className="text-xs text-slate-500">Withdrawals</span>
          </div>
          <p className="text-sm font-semibold text-slate-800">{formatCompact(withdrawals)}</p>
          <p className="text-xs text-red-600 font-medium">{withdrawalPercent}%</p>
        </div>
      </div>
    </div>
  );
}
