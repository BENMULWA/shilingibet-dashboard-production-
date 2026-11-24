import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Checkbox, Input, Modal, Table, Tag } from "antd";
import { format, formatDistanceToNowStrict } from "date-fns";
import { FiPauseCircle, FiPlayCircle, FiRefreshCw, FiShield } from "react-icons/fi";
import toast from "react-hot-toast";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { StatTile } from "../components/dashboard/KpiCard";
import { acknowledgeGatewayAlerts, checkGatewayNow, getGatewayWatch, setGatewayHold } from "../services/gatewayWatchService";
import { isSuperAdmin } from "../utils/authSession";

const kes = (amount) =>
  amount == null ? "-" : `KES ${Number(amount).toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const when = (date) => (date ? format(new Date(date), "d MMM, HH:mm:ss") : "-");
const PANEL = "rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800";

function Section({ title, description, actions, children }) {
  return (
    <section className={PANEL}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4 dark:border-slate-700/60 sm:px-6">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
          {description && <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

const errorText = (error) => error?.response?.data?.message || error?.message || "Request failed";

export default function GatewayMonitor() {
  const queryClient = useQueryClient();
  const superAdmin = isSuperAdmin();
  const [ackOpen, setAckOpen] = useState(false);
  const [ackReason, setAckReason] = useState("");
  const [resume, setResume] = useState(false);
  const [holdOpen, setHoldOpen] = useState(false);
  const [holdReason, setHoldReason] = useState("");

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["gateway-watch"],
    queryFn: () => getGatewayWatch(24),
    refetchInterval: 30 * 1000,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["gateway-watch"] });

  const checkNow = useMutation({
    mutationFn: checkGatewayNow,
    onSuccess: (r) => {
      if (r.skipped) toast("A check just ran; try again in a few seconds.");
      else if (r.error) toast.error(`Could not read Mamlaka: ${r.error}`);
      else if (r.alerted) toast.error("Unexplained outflow detected: alert sent.");
      else if (r.confirming) toast("Possible unexplained outflow; confirming on the next reading.");
      else toast.success("Checked: balances match our records.");
      refresh();
    },
    onError: (e) => toast.error(errorText(e)),
  });

  const acknowledge = useMutation({
    mutationFn: () => acknowledgeGatewayAlerts({ reason: ackReason.trim(), resumeWithdrawals: resume }),
    onSuccess: (r) => {
      toast.success(`Reviewed ${r.acknowledgedAlerts} alert(s)${r.withdrawalsResumed ? "; withdrawals resumed" : ""}.`);
      setAckOpen(false);
      setAckReason("");
      setResume(false);
      refresh();
    },
    onError: (e) => toast.error(errorText(e)),
  });

  const hold = useMutation({
    mutationFn: (active) => setGatewayHold({ active, reason: holdReason.trim() }),
    onSuccess: (r) => {
      toast.success(r.hold.active ? "M-Pesa withdrawals paused." : "M-Pesa withdrawals resumed.");
      setHoldOpen(false);
      setHoldReason("");
      refresh();
    },
    onError: (e) => toast.error(errorText(e)),
  });

  const latest = data?.latest;
  const incident = data?.incident || {};
  const holdState = data?.hold || {};
  const openAlerts = (data?.alerts || []).filter((a) => !a.acknowledgedAt);
  const total = latest ? (latest.payinKes || 0) + (latest.payoutKes || 0) : null;
  const series = (data?.series || []).map((r) => ({
    t: format(new Date(r.takenAt), "HH:mm"),
    payin: r.payinKes,
    payout: r.payoutKes,
    total: (r.payinKes || 0) + (r.payoutKes || 0),
  }));
  const s = data?.settings;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white">
            <FiShield /> Gateway monitor
          </h1>
          <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-400">
            Reads the Mamlaka pay-in and payout balances every minute and checks every change against Bingwake's own
            deposits and payouts. Money that leaves without a Bingwake record triggers an SMS alert
            {s?.autoHold ? " and pauses M-Pesa withdrawals" : ""}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button icon={<FiRefreshCw />} loading={isFetching} onClick={() => refetch()}>
            Refresh
          </Button>
          {superAdmin && (
            <Button type="primary" loading={checkNow.isPending} onClick={() => checkNow.mutate()}>
              Check now
            </Button>
          )}
        </div>
      </div>

      {error && <Alert type="error" showIcon message="Could not load the gateway monitor" description={errorText(error)} />}
      {data && !data.enabled && (
        <Alert
          type="warning"
          showIcon
          message="The watchdog is not running on this server"
          description="It runs in production by default. Set GATEWAY_WATCH_ENABLED=true to turn it on elsewhere."
        />
      )}

      {incident.open ? (
        <Alert
          type="error"
          showIcon
          message={`Unexplained outflow: ${kes(incident.totalLost)} left the Mamlaka account that Bingwake did not send`}
          description={`Open since ${when(incident.openedAt)}. Last alert ${when(incident.lastAlertAt)}. Check with Mamlaka, then review it below.`}
          action={
            superAdmin && (
              <Button danger onClick={() => setAckOpen(true)}>
                Review
              </Button>
            )
          }
        />
      ) : (
        data?.enabled && (
          <Alert type="success" showIcon message="All clear: every balance change in the last checks matches Bingwake's records." />
        )
      )}

      {holdState.active ? (
        <Alert
          type="warning"
          showIcon
          icon={<FiPauseCircle />}
          message="M-Pesa withdrawals are paused"
          description={`Since ${when(holdState.since)}${holdState.reason ? `: ${holdState.reason}` : ""}. Players see "Withdrawals are temporarily unavailable".`}
          action={
            superAdmin && (
              <Button icon={<FiPlayCircle />} onClick={() => setHoldOpen(true)}>
                Resume
              </Button>
            )
          }
        />
      ) : (
        superAdmin && (
          <div className="flex justify-end">
            <Button danger icon={<FiPauseCircle />} onClick={() => setHoldOpen(true)}>
              Pause M-Pesa withdrawals
            </Button>
          </div>
        )
      )}

      <section className={PANEL}>
        <div className="grid grid-cols-2 lg:grid-cols-4 [&>*]:border-slate-100 dark:[&>*]:border-slate-700/60 [&>*]:border-b lg:[&>*]:border-l lg:[&>*:first-child]:border-l-0">
          <StatTile title="Pay-in (collections)" value={kes(latest?.payinKes)} loading={isLoading} />
          <StatTile title="Payout (disbursements)" value={kes(latest?.payoutKes)} loading={isLoading} />
          <StatTile title="Total at Mamlaka" value={kes(total)} loading={isLoading} />
          <StatTile
            title="Last check"
            value={data?.lastCheckAt ? `${formatDistanceToNowStrict(new Date(data.lastCheckAt))} ago` : "-"}
            meta={s ? `Alerts at ${kes(s.thresholdKes)} / ${s.windowMinutes} min or ${kes(s.hourThresholdKes)} / hour` : null}
            loading={isLoading}
          />
        </div>
      </section>

      <Section title="Balances, last 24 hours" description="A drop in the total that Bingwake didn't cause is what the watchdog alerts on.">
        <div className="h-72 px-2 py-4 sm:px-4">
          {series.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 5, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="t" tick={{ fontSize: 11 }} minTickGap={32} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => Number(v).toLocaleString("en-KE")} width={70} />
                <Tooltip formatter={(v) => kes(v)} />
                <Legend />
                <Line type="stepAfter" dataKey="total" name="Total" stroke="#0f172a" dot={false} strokeWidth={2} />
                <Line type="stepAfter" dataKey="payin" name="Pay-in" stroke="#3B82F6" dot={false} />
                <Line type="stepAfter" dataKey="payout" name="Payout" stroke="#10B981" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="px-4 py-10 text-center text-sm text-slate-500">No readings yet. The first appears a minute after the server starts.</p>
          )}
        </div>
      </Section>

      <Section
        title="Alerts"
        description="Money that left without a Bingwake record, Mamlaka notices for transactions Bingwake never created, and callbacks refused because they came from an address Mamlaka doesn't use."
        actions={
          superAdmin &&
          openAlerts.length > 0 && (
            <Button danger onClick={() => setAckOpen(true)}>
              Review {openAlerts.length} open alert(s)
            </Button>
          )
        }
      >
        <Table
          rowKey="_id"
          size="small"
          loading={isLoading}
          dataSource={data?.alerts || []}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
          columns={[
            { title: "Raised", dataIndex: "createdAt", render: when },
            {
              title: "Type",
              dataIndex: "kind",
              render: (k) =>
                k === "unknown_callback" ? (
                  <Tag color="orange">Unknown Mamlaka transaction</Tag>
                ) : k === "rejected_callback" ? (
                  <Tag color="gold">Callback from unknown IP</Tag>
                ) : (
                  <Tag color="red">Unexplained outflow</Tag>
                ),
            },
            { title: "Amount", dataIndex: "amount", align: "right", render: kes },
            {
              title: "Details",
              render: (_, a) =>
                a.kind === "unknown_callback"
                  ? `${a.details?.report || ""} ${a.details?.status || ""} ref ${a.details?.externalId || "-"}`
                  : a.kind === "rejected_callback"
                  ? `Refused: from ${a.details?.ip || "-"} to ${a.details?.path || "-"}`
                  : `${when(a.fromAt)} to ${when(a.toAt)}: total ${kes((a.balancesBefore?.payinKes || 0) + (a.balancesBefore?.payoutKes || 0))} to ${kes((a.balancesAfter?.payinKes || 0) + (a.balancesAfter?.payoutKes || 0))}${a.holdApplied ? " · withdrawals paused" : ""}`,
            },
            {
              title: "Review",
              render: (_, a) =>
                a.kind === "rejected_callback" ? <span className="text-slate-500">Refused automatically</span> : (a.acknowledgedAt ? <span title={a.acknowledgeReason}>Reviewed {when(a.acknowledgedAt)}: {a.acknowledgeReason}</span> : <Tag color="red">Open</Tag>),
            },
          ]}
        />
      </Section>

      <Section
        title="Unexplained movements, last 24 hours"
        description="Each row compares one reading with the one before. Negative = money out that Bingwake didn't send; positive = money in Bingwake didn't record (e.g. a top-up)."
      >
        <Table
          rowKey={(r) => r.takenAt}
          size="small"
          loading={isLoading}
          dataSource={data?.movements || []}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 700 }}
          columns={[
            { title: "Between", render: (_, r) => `${when(r.previousAt)} and ${when(r.takenAt)}` },
            { title: "Actual change", dataIndex: "actualChange", align: "right", render: kes },
            { title: "Our records", dataIndex: "expectedChange", align: "right", render: kes },
            {
              title: "Unexplained",
              dataIndex: "unexplained",
              align: "right",
              render: (v) => <span className={v < 0 ? "font-semibold text-red-600" : "text-emerald-600"}>{kes(v)}</span>,
            },
            { title: "Pay-in after", dataIndex: "payinKes", align: "right", render: kes },
            { title: "Payout after", dataIndex: "payoutKes", align: "right", render: kes },
          ]}
        />
      </Section>

      <Modal
        title="Review gateway alerts"
        open={ackOpen}
        onCancel={() => setAckOpen(false)}
        onOk={() => acknowledge.mutate()}
        okText="Mark reviewed"
        okButtonProps={{ disabled: ackReason.trim().length < 10, loading: acknowledge.isPending }}
      >
        <p className="mb-2 text-sm text-slate-600 dark:text-slate-300">
          Explain what caused the movement (for example a settlement you confirmed with Mamlaka). This is recorded in the audit log.
        </p>
        <Input.TextArea rows={4} value={ackReason} onChange={(e) => setAckReason(e.target.value)} placeholder="At least 10 characters" maxLength={500} showCount />
        {holdState.active && (
          <Checkbox className="mt-3" checked={resume} onChange={(e) => setResume(e.target.checked)}>
            Also resume M-Pesa withdrawals
          </Checkbox>
        )}
      </Modal>

      <Modal
        title={holdState.active ? "Resume M-Pesa withdrawals" : "Pause M-Pesa withdrawals"}
        open={holdOpen}
        onCancel={() => setHoldOpen(false)}
        onOk={() => hold.mutate(!holdState.active)}
        okText={holdState.active ? "Resume" : "Pause"}
        okButtonProps={{ danger: !holdState.active, disabled: holdReason.trim().length < 5, loading: hold.isPending }}
      >
        <p className="mb-2 text-sm text-slate-600 dark:text-slate-300">
          {holdState.active
            ? "Players will be able to withdraw by M-Pesa again."
            : "Players will see \"Withdrawals are temporarily unavailable\" until you resume."}{" "}
          The reason is recorded in the audit log.
        </p>
        <Input.TextArea rows={3} value={holdReason} onChange={(e) => setHoldReason(e.target.value)} placeholder="Reason (at least 5 characters)" maxLength={300} showCount />
      </Modal>
    </div>
  );
}
