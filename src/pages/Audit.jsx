import { useState } from "react";
import AuditLogsTable from "../components/AuditLogsTable";
import AuditStatsCards from "../components/AuditStatsCards";
import StaffSignInsTable from "../components/StaffSignInsTable";

const TABS = [
  { key: "actions", label: "Staff actions", hint: "Who changed or viewed what" },
  { key: "signins", label: "Sign-ins & security", hint: "Logins, SMS codes, password resets" },
];

function Audit() {
  const [tab, setTab] = useState("actions");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Audit views">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key)}
            className={`rounded-xl border px-4 py-2.5 text-left transition-colors ${
              tab === item.key
                ? "border-brand bg-brand/15 text-slate-900 dark:text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            <span className="block text-sm font-semibold">{item.label}</span>
            <span className="block text-[11px] opacity-70">{item.hint}</span>
          </button>
        ))}
      </div>

      {tab === "actions" ? (
        <>
          <AuditStatsCards />
          <AuditLogsTable />
        </>
      ) : (
        <StaffSignInsTable />
      )}
    </div>
  );
}

export default Audit;
