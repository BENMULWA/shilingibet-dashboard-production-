import { useQuery } from "@tanstack/react-query";
import { Table, Tag } from "antd";
import { format } from "date-fns";
import { fetchAPI } from "../utils/fetchRequest";

const token = () => JSON.parse(sessionStorage.getItem("user") || "null")?.token;
const kes = (v) => (v == null ? "—" : (Number(v) || 0).toLocaleString("en-KE", { maximumFractionDigits: 2 }));
const TYPE_COLOR = { allocation: "green", reset: "red", correction: "orange" };

// Every funding change to the payout float (allocations, resets, corrections), from the
// immutable audit log. "Mamlaka payout" is the real provider balance when it happened,
// so each allocation can be matched to a top-up on the Mamlaka statement.
export default function TreasuryHistory({ float }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["treasury-movements"],
    queryFn: async () => (await fetchAPI("admin/treasury/withdrawals/movements", "GET", null, token())).data,
  });
  const live = data?.mamlakaPayoutKes;
  const overAllocated = live != null && Number(float || 0) > Number(live);

  return (
    <div className="mt-6">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-sm font-semibold text-gray-600 dark:text-slate-200">Funding history</h4>
        {live != null && (
          <span className={`text-xs ${overAllocated ? "font-semibold text-amber-600" : "text-gray-500"}`}>
            Real Mamlaka payout account now: KES {kes(live)}
            {overAllocated ? " · the float is higher than the money actually there" : ""}
          </span>
        )}
      </div>
      {isError && <p className="text-sm text-red-600">{error?.message || "Could not load the funding history"}</p>}
      <Table
        rowKey="id"
        size="small"
        loading={isLoading}
        dataSource={data?.movements || []}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        scroll={{ x: 820 }}
        columns={[
          { title: "When", dataIndex: "at", render: (v) => format(new Date(v), "d MMM yyyy, HH:mm") },
          { title: "Action", dataIndex: "type", render: (v, r) => <Tag color={r.outcome === "failed" ? "default" : TYPE_COLOR[v]}>{r.outcome === "failed" ? `${v} (failed)` : v}</Tag> },
          { title: "Amount (KES)", dataIndex: "amount", align: "right", render: (v) => <span className={`tabular ${v < 0 ? "text-red-600" : ""}`}>{v > 0 ? "+" : ""}{kes(v)}</span> },
          { title: "Float after", dataIndex: "floatAfter", align: "right", render: (v) => <span className="tabular">{kes(v)}</span> },
          { title: "Mamlaka payout then", dataIndex: "mamlakaPayoutKes", align: "right", render: (v) => <span className="tabular">{kes(v)}</span> },
          { title: "By", dataIndex: "by" },
          { title: "Note / reason", dataIndex: "note", ellipsis: true },
        ]}
      />
    </div>
  );
}
