import { useEffect, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import {
  FiArrowDownLeft,
  FiArrowUpRight,
  FiAward,
  FiRotateCcw,
  FiShield,
  FiTarget,
  FiUserPlus,
} from "react-icons/fi";

import { useRecentActivity } from "../../hooks/useGetAnalytics";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "money", label: "Money", kinds: ["deposit", "withdrawal"] },
  { key: "bets", label: "Bets", kinds: ["bet", "settlement", "rollback"] },
  { key: "players", label: "Sign-ups", kinds: ["signup"] },
  { key: "staff", label: "Staff", kinds: ["staff"] },
];

const kes = (amount) =>
  `KES ${Number(amount || 0).toLocaleString("en-KE", { maximumFractionDigits: 2 })}`;

const maskPhone = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length < 9) return phone || "Unknown";
  const local = digits.startsWith("254") ? `0${digits.slice(3)}` : digits;
  return `${local.slice(0, 4)} ••• ${local.slice(-3)}`;
};

const humanAction = (action = "") =>
  action
    .replace(/^(post|patch|put|delete)_api_v1_admin_/, "")
    .replace(/_id\b/g, "")
    .replace(/_/g, " ")
    .trim() || "admin action";

// Turns one feed row into an icon, sentence and colour staff can scan quickly.
function describe(item) {
  const who = maskPhone(item.phone);
  switch (item.kind) {
    case "deposit":
      return {
        icon: FiArrowDownLeft,
        tone: item.status === "completed" ? "green" : item.status === "pending" ? "amber" : "red",
        title: `${who} deposited ${kes(item.amount)}`,
        sub: item.status === "completed" ? `M-Pesa ${item.detail || ""}`.trim() : `Deposit ${item.status.replace(/_/g, " ")}`,
      };
    case "withdrawal":
      return {
        icon: FiArrowUpRight,
        tone: item.status === "completed" ? "blue" : item.status === "failed" || item.status === "expired" ? "red" : "amber",
        title: `${who} withdrew ${kes(item.amount)}`,
        sub:
          item.status === "completed"
            ? `Paid · ${item.detail || "M-Pesa"}`
            : `Withdrawal ${item.status.replace(/_/g, " ")}${item.detail ? ` · ${item.detail}` : ""}`,
      };
    case "signup":
      return {
        icon: FiUserPlus,
        tone: "violet",
        title: `New player ${who}`,
        sub: item.status === "referred" ? "Joined with a referral link" : "Signed up directly",
      };
    case "bet":
      return { icon: FiTarget, tone: "slate", title: `${who} staked ${kes(item.amount)}`, sub: item.detail || "Virtual game" };
    case "settlement":
      return item.status === "won"
        ? { icon: FiAward, tone: "gold", title: `${who} won ${kes(item.amount)}`, sub: item.detail || "Virtual game" }
        : { icon: FiTarget, tone: "slate", title: `${who} lost a bet`, sub: item.detail || "Virtual game" };
    case "rollback":
      return { icon: FiRotateCcw, tone: "amber", title: `Bet voided for ${who}`, sub: `${kes(item.amount)} refunded` };
    case "staff":
      return {
        icon: FiShield,
        tone: item.status === "success" ? "slate" : "red",
        title: `Staff ${who}: ${humanAction(item.detail)}`,
        sub: `${(item.role || "staff").replace("_", " ")}${item.status === "failed" ? " · failed" : ""}`,
      };
    default:
      return { icon: FiTarget, tone: "slate", title: item.kind, sub: "" };
  }
}

const TONE_CLASSES = {
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  blue: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  red: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  gold: "bg-amber-100 text-amber-700 dark:bg-brand/20 dark:text-brand",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
};

function useTick(ms) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}

export default function ActivityFeed({ limit = 40, maxHeight = 560 }) {
  const [filter, setFilter] = useState("all");
  const { activity, isLoading, error } = useRecentActivity({ limit });
  useTick(30000);

  const kinds = FILTERS.find((f) => f.key === filter)?.kinds;
  const rows = kinds ? activity.filter((item) => kinds.includes(item.kind)) : activity;

  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-700 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Live activity</h2>
        </div>
        <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1" role="tablist" aria-label="Filter activity">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                filter === f.key
                  ? "bg-brand text-black"
                  : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      <ol style={{ maxHeight }} className="flex-1 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-700/60" aria-live="polite">
        {isLoading &&
          Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-2.5 w-1/3 animate-pulse rounded bg-slate-100 dark:bg-slate-700/60" />
              </div>
            </li>
          ))}

        {!isLoading && error && (
          <li className="px-5 py-8 text-center text-sm text-red-500">Couldn't load activity. Retrying…</li>
        )}

        {!isLoading && !error && rows.length === 0 && (
          <li className="px-5 py-10 text-center text-sm text-slate-400">Nothing yet in this category.</li>
        )}

        {rows.map((item) => {
          const view = describe(item);
          const Icon = view.icon;
          return (
            <li key={item.id} className="flex items-start gap-3 px-4 py-3 sm:px-5">
              <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TONE_CLASSES[view.tone]}`}>
                <Icon size={15} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-slate-800 dark:text-slate-100">{view.title}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{view.sub}</p>
              </div>
              <time
                dateTime={item.at}
                title={new Date(item.at).toLocaleString("en-KE")}
                className="tabular shrink-0 text-[11px] text-slate-400 dark:text-slate-500"
              >
                {formatDistanceToNowStrict(new Date(item.at), { addSuffix: true })}
              </time>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
