import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Segmented, Table } from "antd";
import { endOfDay, endOfMonth, format, startOfDay, startOfMonth, subDays, subMonths } from "date-fns";
import { FiDownload, FiFileText, FiRefreshCw } from "react-icons/fi";
import toast from "react-hot-toast";
import { StatTile } from "../components/dashboard/KpiCard";
import { exportFinanceReport, getFinanceReport } from "../services/financeService";
import { downloadFinancePdf } from "../utils/financePdf";
import { readStoredUser } from "../utils/authSession";

const kes = (amount) =>
  `KES ${(Number(amount) || 0).toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const count = (value) => (Number(value) || 0).toLocaleString("en-KE");

const PRESETS = [
  { value: "today", label: "Today", range: (now) => [startOfDay(now), endOfDay(now)] },
  { value: "yesterday", label: "Yesterday", range: (now) => [startOfDay(subDays(now, 1)), endOfDay(subDays(now, 1))] },
  { value: "7d", label: "Last 7 days", range: (now) => [startOfDay(subDays(now, 6)), endOfDay(now)] },
  { value: "month", label: "This month", range: (now) => [startOfMonth(now), endOfDay(now)] },
  {
    value: "last_month",
    label: "Last month",
    range: (now) => [startOfMonth(subMonths(now, 1)), endOfMonth(subMonths(now, 1))],
  },
  { value: "custom", label: "Custom" },
];

const PANEL = "rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800";
const GRID =
  "grid grid-cols-2 lg:grid-cols-4 [&>*]:border-slate-100 dark:[&>*]:border-slate-700/60 [&>*]:border-b lg:[&>*:nth-child(4n+1)]:border-l-0 lg:[&>*]:border-l";

function Section({ title, description, children }) {
  return (
    <section className={PANEL}>
      <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-700/60 sm:px-6">
        <h2 className="text-[15px] font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
        {description && <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      {children}
    </section>
  );
}

const money = (key) => ({ dataIndex: key, align: "right", render: (v) => <span className="tabular">{kes(v)}</span> });

const optMoney = (key) => ({
  dataIndex: key,
  align: "right",
  render: (v) => (v == null ? <span className="text-slate-400">—</span> : <span className="tabular">{kes(v)}</span>),
});

const DAILY_COLUMNS = [
  { title: "Date", dataIndex: "date", fixed: "left", render: (d) => format(new Date(`${d}T12:00:00`), "EEE d MMM") },
  { title: "Deposits", ...money("deposits") },
  { title: "Paid out", ...money("withdrawalsPaidOut") },
  { title: "Tax (KRA)", ...money("withdrawalTax") },
  { title: "Fees", ...money("withdrawalFees") },
  { title: "Virtual GGR", ...money("virtualGgr") },
  { title: "Sportsbook GGR", ...money("sportsbookGgr") },
  { title: "Bonus cost", ...money("bonusCost") },
  {
    title: "Net revenue",
    dataIndex: "netRevenue",
    align: "right",
    render: (v) => (
      <span className={`tabular font-semibold ${v < 0 ? "text-red-600" : "text-emerald-700 dark:text-emerald-400"}`}>{kes(v)}</span>
    ),
  },
];

// Finance view for end-of-day reporting: what the platform earned, what it owes KRA,
// how much cash moved, and what it holds for players right now.
export default function Finance() {
  const [preset, setPreset] = useState("today");
  const [custom, setCustom] = useState({ from: format(subDays(new Date(), 6), "yyyy-MM-dd"), to: format(new Date(), "yyyy-MM-dd") });

  const [start, end] = useMemo(() => {
    if (preset === "custom") {
      return [startOfDay(new Date(`${custom.from}T00:00:00`)), endOfDay(new Date(`${custom.to}T00:00:00`))];
    }
    return PRESETS.find((p) => p.value === preset).range(new Date());
  }, [preset, custom]);

  const validRange = start <= end;
  const query = useQuery({
    queryKey: ["finance-report", start.getTime(), end.getTime()],
    queryFn: () => getFinanceReport(start, end),
    enabled: validRange,
  });
  const t = query.data?.totals || {};
  const snap = query.data?.snapshot || {};
  const days = query.data?.days || [];
  const recon = query.data?.reconciliation || {};
  const loading = query.isPending && validRange;
  const [exporting, setExporting] = useState(false);

  const baseName = `finance-${format(start, "yyyy-MM-dd")}${format(start, "yyyy-MM-dd") !== format(end, "yyyy-MM-dd") ? `-to-${format(end, "yyyy-MM-dd")}` : ""}`;
  const downloadPdf = () => {
    if (!query.data) return;
    try {
      const user = readStoredUser();
      downloadFinancePdf(query.data, { start, end, filename: `${baseName}.pdf`, preparedBy: user?.name || user?.phone });
    } catch (error) {
      toast.error(error.message || "PDF export failed");
    }
  };

  const download = async () => {
    setExporting(true);
    try {
      await exportFinanceReport(start, end, `${baseName}.csv`);
    } catch (error) {
      toast.error(error.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className={`${PANEL} flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between`}>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Finance report</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {format(start, "EEE d MMM yyyy")} – {format(end, "EEE d MMM yyyy")} · Nairobi time
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="overflow-x-auto">
            <Segmented value={preset} onChange={setPreset} options={PRESETS.map(({ value, label }) => ({ value, label }))} />
          </div>
          {preset === "custom" && (
            <div className="flex items-center gap-2 text-sm">
              <input type="date" aria-label="From" value={custom.from} max={custom.to} onChange={(e) => setCustom({ ...custom, from: e.target.value })}
                className="h-9 rounded-lg border border-slate-200 px-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
              <span className="text-slate-400">to</span>
              <input type="date" aria-label="To" value={custom.to} min={custom.from} onChange={(e) => setCustom({ ...custom, to: e.target.value })}
                className="h-9 rounded-lg border border-slate-200 px-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
            </div>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => query.refetch()} aria-label="Refresh"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">
              <FiRefreshCw size={14} className={query.isFetching ? "animate-spin" : ""} />
            </button>
            <button type="button" onClick={download} disabled={exporting || !validRange}
              className="flex h-9 items-center gap-2 rounded-lg bg-brand px-3 text-sm font-bold text-black hover:bg-brand-hover disabled:opacity-50">
              <FiDownload size={14} /> {exporting ? "Exporting…" : "CSV"}
            </button>
            <button type="button" onClick={downloadPdf} disabled={!query.data || !validRange}
              className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">
              <FiFileText size={14} /> PDF
            </button>
          </div>
        </div>
      </div>

      {!validRange && <Alert type="warning" showIcon message="The start date must be on or before the end date." />}
      {query.isError && (
        <Alert type="error" showIcon message="Could not load the finance report" description={query.error?.message} />
      )}

      <Section title="Platform revenue" description="What the business earned. Withdrawal tax is not included: it is collected for KRA.">
        <div className={GRID}>
          <StatTile title="Net revenue" hint="Gaming revenue (GGR) minus bonuses, plus withdrawal fees." value={kes(t.netRevenue)} loading={loading} />
          <StatTile title="Gross gaming revenue" hint="Stakes minus winnings and refunds, across virtual games and the sportsbook. Negative means players won more than they staked." value={kes(t.ggr)} meta={`Virtual ${kes(t.virtualGgr)} · Sportsbook ${kes(t.sportsbookGgr)}`} loading={loading} />
          <StatTile title="Withdrawal fees" hint="Flat fee charged on withdrawals at or above the fee threshold. Platform revenue." value={kes(t.withdrawalFees)} meta={`${count(t.withdrawalsCount)} withdrawals`} loading={loading} />
          <StatTile title="Bonus cost" hint="Welcome bonuses, referral rewards and cashback credited to players." value={kes(t.bonusCost)} meta={`Welcome ${kes(t.welcomeBonuses)} · Referral ${kes(t.referralBonuses)} · Cashback ${kes(t.cashback)}`} loading={loading} />
        </div>
      </Section>

      <Section title="Owed to KRA" description="Withholding tax deducted from completed withdrawals. Remit this; it is not revenue.">
        <div className={GRID}>
          <StatTile title="Withholding tax collected" hint="Tax deducted from player withdrawals in this period." value={kes(t.withdrawalTax)} loading={loading} />
          <StatTile title="Withdrawals taxed" hint="Amount debited from player wallets for completed cash withdrawals." value={kes(t.withdrawalsDebited)} loading={loading} />
        </div>
      </Section>

      <Section title="Cash movement" description="Main-wallet money in and out through M-Pesa and Comet.">
        <div className={GRID}>
          <StatTile title="Deposits" hint="Completed cash deposits." value={kes(t.deposits)} meta={`${count(t.depositsCount)} deposits`} loading={loading} />
          <StatTile title="Debited for withdrawals" hint="Taken from player wallets: what players asked to withdraw." value={kes(t.withdrawalsDebited)} loading={loading} />
          <StatTile title="Actually paid out" hint="Sent to players after tax and fees. This is what left the payout account." value={kes(t.withdrawalsPaidOut)} loading={loading} />
          <StatTile title="Net cash flow" hint="Deposits minus money paid out. Negative means more left than came in." value={kes(t.netCashFlow)} loading={loading} />
        </div>
      </Section>

      <Section title="Paybill reconciliation (Mamlaka)" description="Real balances at the payment provider against what our books say should have moved. Anything left in Unexplained must match a top-up, sweep or provider charge on the Mamlaka statement.">
        <div className={GRID}>
          <StatTile title="Pay-in account (live)" hint="Money collected through the paybill, held at Mamlaka right now." value={recon.live?.payinKes == null ? "—" : kes(recon.live.payinKes)} meta={recon.live?.error ? "Could not read the provider" : undefined} loading={loading} />
          <StatTile title="Payout account (live)" hint="Money at Mamlaka available to send to players right now." value={recon.live?.payoutKes == null ? "—" : kes(recon.live.payoutKes)} loading={loading} />
          <StatTile title="M-Pesa in / out (period)" hint="Our books: completed M-Pesa deposits and M-Pesa amounts paid out after tax and fees." value={`${kes(t.mpesaDeposits)} / ${kes(t.mpesaPaidOut)}`} meta={`Comet paid out ${kes(t.cometPaidOut)}`} loading={loading} />
          <StatTile title="Withdrawals pending now" hint="Not yet completed in our books. The money may already have left the payout account, so it can explain a gap." value={kes(recon.pendingWithdrawals?.amount)} meta={`${count(recon.pendingWithdrawals?.count)} withdrawals`} loading={loading} />
        </div>
        <Table
          rowKey={(r) => `${r.date}-${r.account}`}
          size="small"
          loading={loading}
          pagination={false}
          scroll={{ x: 900 }}
          dataSource={(recon.days || []).slice().reverse().flatMap((d) => [
            { date: d.date, account: "Pay-in", live: d.closingIsLive, ...d.payin },
            { date: d.date, account: "Payout", live: d.closingIsLive, ...d.payout },
          ])}
          columns={[
            { title: "Date", dataIndex: "date", render: (v, r) => `${format(new Date(`${v}T12:00:00`), "EEE d MMM")}${r.live ? " (live)" : ""}` },
            { title: "Account", dataIndex: "account" },
            { title: "Opening", ...optMoney("opening") },
            { title: "Expected change", ...optMoney("expectedChange") },
            { title: "Actual change", ...optMoney("actualChange") },
            { title: "Closing", ...optMoney("closing") },
            {
              title: "Unexplained",
              dataIndex: "unexplained",
              align: "right",
              render: (v) => (v == null ? <span className="text-slate-400">no reading</span> : (
                <span className={`tabular font-semibold ${Math.abs(v) < 0.01 ? "text-emerald-700 dark:text-emerald-400" : "text-amber-600"}`}>{kes(v)}</span>
              )),
            },
          ]}
        />
      </Section>

      <Section title="Balances right now" description={snap.asOf ? `As of ${format(new Date(snap.asOf), "d MMM yyyy, HH:mm")}. Not limited to the selected period.` : "Current balances."}>
        <div className={GRID}>
          <StatTile title="Owed to players (cash)" hint="Total of all player main-wallet balances: our liability." value={kes(snap.playerCash)} loading={loading} />
          <StatTile title="Player bonus balances" hint="Bonus money held in player wallets." value={kes(snap.playerBonus)} loading={loading} />
          <StatTile title="Player airtime balances" hint="Airtime-wallet balances." value={kes(snap.playerAirtime)} loading={loading} />
          <StatTile title="Payout float" hint="Money allocated for paying withdrawals." value={kes(snap.payoutFloat)} meta={snap.payoutFloatReserved ? `${kes(snap.payoutFloatReserved)} held for payouts in progress` : undefined} loading={loading} />
        </div>
      </Section>

      <Section title="Day by day" description="One row per Nairobi calendar day. Export CSV for every column.">
        <Table
          rowKey="date"
          size="small"
          loading={loading}
          columns={DAILY_COLUMNS}
          dataSource={[...days].reverse()}
          pagination={days.length > 31 ? { pageSize: 31 } : false}
          scroll={{ x: 960 }}
          summary={() =>
            days.length > 1 ? (
              <Table.Summary.Row className="font-semibold">
                <Table.Summary.Cell index={0}>Total</Table.Summary.Cell>
                {DAILY_COLUMNS.slice(1).map((col, i) => (
                  <Table.Summary.Cell key={col.dataIndex} index={i + 1} align="right">
                    <span className="tabular">{kes(t[col.dataIndex])}</span>
                  </Table.Summary.Cell>
                ))}
              </Table.Summary.Row>
            ) : null
          }
        />
      </Section>
    </div>
  );
}
