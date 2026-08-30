function StatsCard({
  icon,
  title,
  number,
  bgColor,
  change,
  isLoss = false,
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wide truncate">
            {title}
          </p>
          <h3
            className={`text-base font-medium truncate ${
              isLoss ? "text-red-600" : "text-slate-800"
            }`}
          >
            {number}
          </h3>
          <p className="text-xs text-slate-400 truncate">
            {change}
          </p>
        </div>
        <div className={`${bgColor} p-3 rounded-lg flex-shrink-0`}>
          <div className="w-5 h-5 flex items-center justify-center">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatsCard;
