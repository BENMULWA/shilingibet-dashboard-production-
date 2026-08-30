import { NavLink } from "react-router-dom";
import { HiOutlineTrophy, HiOutlineChartBarSquare, HiOutlineClipboardDocumentList } from "react-icons/hi2";

const tabs = [
  { to: "/jackpot", label: "Play Jackpot", icon: HiOutlineTrophy, end: true },
  { to: "/jackpot/results", label: "Results", icon: HiOutlineChartBarSquare },
  { to: "/jackpot/my-bets", label: "My Bets", icon: HiOutlineClipboardDocumentList },
];

function JackpotPageShell({ title, subtitle, children, action }) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-slate-900 text-white p-5 lg:p-6 shadow-sm overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(249,206,54,0.18),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(56,189,248,0.14),_transparent_30%)]" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-amber-200">
              <HiOutlineTrophy size={14} />
              Jackpot
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-semibold">{title}</h1>
              {subtitle && (
                <p className="mt-2 max-w-2xl text-sm lg:text-base text-slate-300">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action ? <div className="relative">{action}</div> : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-[#f9ce36] bg-[#f9ce36] text-slate-900"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                }`
              }
            >
              <Icon size={16} />
              {tab.label}
            </NavLink>
          );
        })}
      </div>

      {children}
    </div>
  );
}

export default JackpotPageShell;

