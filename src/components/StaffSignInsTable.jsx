import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Select, Table, Tag, Tooltip } from "antd";
import { format } from "date-fns";

import { getAuthEvents } from "../services/AuditService";

// Plain-language labels so non-technical staff can read the security log.
const EVENT_LABELS = {
  staff_login_success: "Signed in",
  staff_login_code_sent: "Password OK, SMS code sent",
  staff_login_password_failed: "Wrong phone or password",
  staff_login_code_failed: "Wrong SMS code",
  staff_login_not_staff: "Non-staff account tried to sign in",
  staff_blocked_player_login: "Staff account used on player site",
  staff_access_denied: "Tried to open a page without permission",
  password_reset_requested: "Password reset requested",
  password_reset_failed: "Password reset failed",
  password_reset_success: "Password changed",
};

const OUTCOME_COLORS = { success: "green", failed: "red", denied: "orange" };

const browserOf = (agent = "") => {
  if (!agent) return "Unknown";
  const os = /Android/i.test(agent) ? "Android" : /iPhone|iPad/i.test(agent) ? "iOS" : /Windows/i.test(agent) ? "Windows" : /Mac OS/i.test(agent) ? "macOS" : /Linux/i.test(agent) ? "Linux" : "";
  const browser = /Edg\//.test(agent) ? "Edge" : /Chrome\//.test(agent) ? "Chrome" : /Firefox\//.test(agent) ? "Firefox" : /Safari\//.test(agent) ? "Safari" : "Browser";
  return os ? `${browser} on ${os}` : browser;
};

export default function StaffSignInsTable() {
  const [page, setPage] = useState(1);
  const [outcome, setOutcome] = useState();

  const { data, isPending, isFetching } = useQuery({
    queryKey: ["authEvents", page, outcome],
    queryFn: () => getAuthEvents({ page, limit: 20, outcome }),
    placeholderData: keepPreviousData,
    refetchInterval: 30000,
  });

  const result = data?.data || {};
  const events = result.events || [];

  const columns = [
    {
      title: "When",
      dataIndex: "timestamp",
      width: 170,
      render: (value) => (
        <span className="tabular whitespace-nowrap text-xs">{value ? format(new Date(value), "d MMM yyyy, HH:mm:ss") : "—"}</span>
      ),
    },
    {
      title: "What happened",
      dataIndex: "type",
      render: (type, row) => (
        <div>
          <p className="font-medium text-slate-800 dark:text-slate-100">{EVENT_LABELS[type] || type}</p>
          {row.detail && <p className="text-xs text-slate-500 dark:text-slate-400">{row.detail}</p>}
        </div>
      ),
    },
    {
      title: "Result",
      dataIndex: "outcome",
      width: 110,
      render: (value) => <Tag color={OUTCOME_COLORS[value] || "default"}>{value}</Tag>,
    },
    { title: "Staff phone", dataIndex: "maskedPhone", width: 130, render: (value) => <span className="tabular">{value || "—"}</span> },
    { title: "IP address", dataIndex: "ipAddress", width: 140, render: (value) => <span className="tabular text-xs">{value || "—"}</span> },
    {
      title: "Device",
      dataIndex: "userAgent",
      width: 170,
      render: (value) => (
        <Tooltip title={value}>
          <span className="text-xs">{browserOf(value)}</span>
        </Tooltip>
      ),
    },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-700">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Staff sign-ins & security</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Every staff sign-in attempt, SMS code check and password reset. Repeated failures can mean someone is guessing a password.
          </p>
        </div>
        <Select
          allowClear
          placeholder="All results"
          value={outcome}
          onChange={(value) => {
            setOutcome(value);
            setPage(1);
          }}
          style={{ width: 160 }}
          options={[
            { value: "success", label: "Successful" },
            { value: "failed", label: "Failed" },
            { value: "denied", label: "Denied" },
          ]}
        />
      </header>
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={events}
        loading={isPending || isFetching}
        scroll={{ x: "max-content" }}
        pagination={{
          current: page,
          pageSize: 20,
          total: result.total || 0,
          showSizeChanger: false,
          onChange: setPage,
        }}
      />
    </section>
  );
}
