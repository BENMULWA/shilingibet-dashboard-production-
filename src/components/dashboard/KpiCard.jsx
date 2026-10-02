import { Tooltip } from "antd";
import { FiInfo, FiTrendingDown, FiTrendingUp } from "react-icons/fi";

const TONES = {
  gold: "bg-amber-100 text-amber-700 dark:bg-brand/15 dark:text-brand",
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  red: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
  blue: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
};

function Trend({ change, positiveIsGood = true, label }) {
  if (change === undefined) return null;
  if (change === null) {
    return <span className="text-[11px] text-slate-400 dark:text-slate-500">New vs {label}</span>;
  }
  const rounded = Math.round(change * 10) / 10;
  if (rounded === 0) {
    return <span className="text-[11px] text-slate-400 dark:text-slate-500">No change vs {label}</span>;
  }
  const up = rounded > 0;
  const good = up === positiveIsGood;
  const Icon = up ? FiTrendingUp : FiTrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
        good ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
      }`}
    >
      <Icon size={12} aria-hidden="true" />
      {up ? "+" : ""}
      {rounded}% <span className="font-normal text-slate-400 dark:text-slate-500">vs {label}</span>
    </span>
  );
}

/**
 * One headline number with a plain-language explanation, so any staff member
 * can read the dashboard without knowing betting jargon.
 */
export default function KpiCard({
  title,
  value,
  icon: Icon,
  tone = "slate",
  hint,
  meta,
  change,
  changeLabel = "previous period",
  positiveIsGood = true,
  loading = false,
  emphasis = false,
  valueClassName = "",
}) {
  return (
    <div
      className={`group relative flex flex-col justify-between gap-3 rounded-2xl border p-4 transition-colors sm:p-5 ${
        emphasis
          ? "border-brand/40 bg-gradient-to-br from-amber-50 to-white dark:from-brand/10 dark:to-slate-800"
          : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="truncate text-[12px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {title}
          </p>
          {hint && (
            <Tooltip title={hint} placement="top">
              <button
                type="button"
                aria-label={`What is ${title}?`}
                className="shrink-0 text-slate-300 transition hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-300"
              >
                <FiInfo size={13} />
              </button>
            </Tooltip>
          )}
        </div>
        {Icon && (
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${TONES[tone]}`}>
            <Icon size={17} aria-hidden="true" />
          </span>
        )}
      </div>

      <div>
        {loading ? (
          <div className="h-7 w-32 animate-pulse rounded-md bg-slate-200 dark:bg-slate-700" />
        ) : (
          <p
            className={`tabular truncate font-bold tracking-tight text-slate-900 dark:text-white ${
              emphasis ? "text-2xl sm:text-[28px]" : "text-xl sm:text-2xl"
            } ${valueClassName}`}
          >
            {value}
          </p>
        )}
        <div className="mt-1.5 flex min-h-[18px] flex-wrap items-center gap-x-3 gap-y-1">
          {meta && <span className="text-xs text-slate-500 dark:text-slate-400">{meta}</span>}
          {!loading && <Trend change={change} positiveIsGood={positiveIsGood} label={changeLabel} />}
        </div>
      </div>
    </div>
  );
}
