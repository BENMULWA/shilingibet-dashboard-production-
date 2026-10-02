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

// Small arrow + percentage. Stays silent when there is nothing to compare, so
// empty periods don't fill the screen with "no change" noise.
export function Trend({ change, positiveIsGood = true, label }) {
  if (change === undefined || change === 0) return null;
  if (change === null) {
    return <span className="text-[11px] text-slate-400 dark:text-slate-500">New vs {label}</span>;
  }
  const up = change > 0;
  const good = up === positiveIsGood;
  const Icon = up ? FiTrendingUp : FiTrendingDown;
  const magnitude = Math.abs(change);
  const text = magnitude > 999 ? ">999" : (Math.round(magnitude * 10) / 10).toString();
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
        good ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
      }`}
    >
      <Icon size={12} aria-hidden="true" />
      {up ? "+" : "−"}
      {text}%
      <span className="hidden font-normal text-slate-400 dark:text-slate-500 sm:inline">vs {label}</span>
    </span>
  );
}

function Hint({ title, hint }) {
  if (!hint) return null;
  return (
    <Tooltip title={hint} placement="top">
      <button
        type="button"
        aria-label={`What is ${title}?`}
        className="shrink-0 text-slate-300 transition hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-300"
      >
        <FiInfo size={13} />
      </button>
    </Tooltip>
  );
}

/** Large headline number. Used sparingly, for the four results to check first. */
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
      className={`flex flex-col gap-3 rounded-2xl border p-4 sm:gap-4 sm:p-6 ${
        emphasis
          ? "border-brand/40 bg-gradient-to-br from-amber-50 to-white dark:from-brand/10 dark:to-slate-800"
          : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</p>
          <Hint title={title} hint={hint} />
        </div>
        {Icon && (
          <span className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:flex ${TONES[tone]}`}>
            <Icon size={17} aria-hidden="true" />
          </span>
        )}
      </div>

      {loading ? (
        <div className="h-9 w-36 animate-pulse rounded-md bg-slate-200 dark:bg-slate-700" />
      ) : (
        <p className={`tabular truncate text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-[28px] ${valueClassName}`}>
          {value}
        </p>
      )}

      <div className="flex min-h-[18px] flex-wrap items-center gap-x-3 gap-y-1">
        {meta && <span className="text-xs text-slate-500 dark:text-slate-400">{meta}</span>}
        {!loading && <Trend change={change} positiveIsGood={positiveIsGood} label={changeLabel} />}
      </div>
    </div>
  );
}

/** Quiet secondary figure: no icon box, no border-per-card. Sits inside a shared panel. */
export function StatTile({ title, value, meta, hint, change, changeLabel, positiveIsGood = true, loading = false }) {
  return (
    <div className="min-w-0 px-1 py-1">
      <div className="flex items-center gap-1.5">
        <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <Hint title={title} hint={hint} />
      </div>
      {loading ? (
        <div className="mt-2 h-7 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      ) : (
        <p className="tabular mt-1 truncate text-xl font-semibold text-slate-900 dark:text-white">{value}</p>
      )}
      <div className="mt-1 flex min-h-[16px] flex-wrap items-center gap-x-2">
        {meta && <span className="text-[11px] text-slate-500 dark:text-slate-400">{meta}</span>}
        {!loading && <Trend change={change} positiveIsGood={positiveIsGood} label={changeLabel} />}
      </div>
    </div>
  );
}
