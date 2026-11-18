import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input, Modal } from "antd";
import toast from "react-hot-toast";
import { HiOutlineScale } from "react-icons/hi2";
import { fetchAPI } from "../utils/fetchRequest";
import { isSuperAdmin } from "../utils/authSession";

const token = () => JSON.parse(sessionStorage.getItem("user") || "null")?.token;
const kes = (v) => `KES ${(Number(v) || 0).toLocaleString("en-KE", { maximumFractionDigits: 2 })}`;

const PART_LABELS = {
  deposits: "Deposits",
  withdrawals: "Withdrawals",
  virtualGames: "Virtual games (net)",
  sportsbook: "Sportsbook (net)",
  cashback: "Cashback",
  referral: "Referral bonus",
  welcomeBonus: "Welcome bonus",
  staffAdjustments: "Staff adjustments & reviews",
};

// Shows whether a player's balance is explained by their history (deposits, play,
// bonuses, recorded credits). Super admins can approve an unexplained amount after
// checking it, which re-enables withdrawals. Every approval is audited and SMSed.
export default function BalanceCheck({ userId, onApproved }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const superAdmin = isSuperAdmin();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["balance-integrity", userId],
    queryFn: async () => (await fetchAPI(`admin/users/${userId}/balance-integrity`, "GET", null, token())).data,
    enabled: Boolean(userId),
  });

  const approve = async () => {
    setSaving(true);
    try {
      await fetchAPI(`admin/users/${userId}/balance-review`, "POST", { reason: reason.trim() }, token());
      toast.success("Balance approved. Withdrawals re-enabled.");
      setOpen(false);
      setReason("");
      await queryClient.invalidateQueries({ queryKey: ["balance-integrity", userId] });
      onApproved?.();
    } catch (e) {
      toast.error(e.message || "Approval failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <HiOutlineScale className="text-slate-600 dark:text-slate-300" size={18} />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-800 dark:text-slate-100">Balance check</h3>
      </div>

      {isLoading && <div className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />}
      {isError && <p className="text-sm text-red-600">{error?.message || "Could not run the balance check"}</p>}

      {data && (
        <div className={`rounded-xl border p-4 ${data.anomalous ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30" : "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"}`}>
          <p className={`text-sm font-semibold ${data.anomalous ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>
            {data.anomalous ? `Unexplained: ${kes(data.excess)}` : "Balance explained by history"}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
            <span>Actual balance</span><span className="tabular text-right">{kes(data.actual)}</span>
            <span>Explained by history</span><span className="tabular text-right">{kes(data.expected)}</span>
            {Object.entries(data.parts || {}).filter(([, v]) => v).map(([k, v]) => (
              <span key={k} className="contents">
                <span className="pl-3 text-slate-500">{PART_LABELS[k] || k}</span>
                <span className="tabular text-right text-slate-500">{kes(v)}</span>
              </span>
            ))}
          </div>
          {data.anomalous && (
            <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">
              Withdrawals stay blocked until this is resolved: zero the balance (Danger Zone) or, if you have confirmed the money is legitimate, approve it.
            </p>
          )}
          {data.anomalous && superAdmin && (
            <button type="button" onClick={() => setOpen(true)}
              className="mt-3 w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900">
              Review & approve balance
            </button>
          )}
        </div>
      )}

      <Modal
        title="Approve this balance?"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={approve}
        okText={`Approve ${data ? kes(data.excess) : ""}`}
        okButtonProps={{ danger: true, disabled: reason.trim().length < 10, loading: saving }}
      >
        <p className="mb-2 text-sm">
          You are confirming that <b>{data && kes(data.excess)}</b> on this account is legitimate even though no deposit, win or recorded credit explains it.
          Withdrawals will be re-enabled. This is permanent, recorded in the audit log and sent by SMS to the alert numbers.
        </p>
        <Input.TextArea rows={3} maxLength={500} placeholder="Why is this money legitimate? e.g. old staff test credits from before credits were recorded"
          value={reason} onChange={(e) => setReason(e.target.value)} />
        <p className="mt-1 text-xs text-slate-500">At least 10 characters.</p>
      </Modal>
    </div>
  );
}
