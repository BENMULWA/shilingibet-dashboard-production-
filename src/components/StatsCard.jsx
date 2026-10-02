function StatsCard({
  icon,
  title,
  number,
  bgColor,
  change,
  isLoss = false,
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wide truncate">
            {title}
          </p>
          <h3
            className={`text-base font-medium truncate ${
              isLoss ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-slate-100"
            }`}
          >
            {number}
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
            {change}
          </p>
        </div>
        <div className={`${bgColor} dark:opacity-90 p-3 rounded-lg flex-shrink-0`}>
          <div className="w-5 h-5 flex items-center justify-center">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatsCard;
