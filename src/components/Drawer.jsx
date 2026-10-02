import { useState, useEffect } from "react";
import {
  FiX,
  FiUser,
  FiPhone,
  FiCalendar,
  FiDollarSign,
  FiAlertTriangle,
  FiTrash2,
  FiCopy,
  FiCheck,
  FiLoader,
  FiSlash,
} from "react-icons/fi";
import {
  HiOutlineBanknotes,
  HiOutlineArrowDownTray,
  HiOutlineArrowUpTray,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import useAccountActions from "../hooks/useAccountActions";
import DeleteModal from "./DeleteAccountModal";
import { useFormatCurrency } from "../hooks/useFormatCurrency";
import toast from "react-hot-toast";
import { Modal } from "antd";

// Custom Toggle Switch Component
function Toggle({ checked, onChange, loading, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={loading || disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
        transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
        ${checked ? "bg-amber-500" : "bg-slate-200"}
        ${loading || disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <span
        className={`
          pointer-events-none inline-flex h-5 w-5 transform rounded-full bg-white dark:bg-slate-800 shadow-lg ring-0
          transition duration-200 ease-in-out items-center justify-center
          ${checked ? "translate-x-5" : "translate-x-0"}
        `}
      >
        {loading && <FiLoader className="w-3 h-3 text-slate-400 dark:text-slate-500 animate-spin" />}
      </span>
    </button>
  );
}

function MyDrawer({ open, onClose, user, readOnly = false }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { formatCurrency } = useFormatCurrency();

  const confirmZeroBalance = () => {
    if (!user?._id) return;
    Modal.confirm({
      title: "Clear all wallet funds?",
      content: "This sets both the user's total balance and restricted bonus balance to zero.",
      okText: "Clear balances",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => zeroBalanceFn(user._id),
    });
  };

  // Local state for switch values - allows immediate UI updates
  const [withdrawalPaused, setWithdrawalPaused] = useState(false);
  const [depositPaused, setDepositPaused] = useState(false);
  const [accountActive, setAccountActive] = useState(true);
  const [lastUserId, setLastUserId] = useState(null);

  const {
    pauseAccountFn,
    activateAccountFn,
    pauseWithdrawalFn,
    activateWithdrawalFn,
    pauseDepositFn,
    activateDepositFn,
    zeroBalanceFn,
    isPausingAccount,
    isActivatingAccount,
    isPausingWithdrawal,
    isActivatingWithdrawal,
    isPausingDeposit,
    isActivatingDeposit,
    isZeroingBalance,
  } = useAccountActions();

  // Only sync from server when the drawer opens for a different user
  useEffect(() => {
    if (user && user._id !== lastUserId) {
      setWithdrawalPaused(user.withdrawalPaused === true);
      setDepositPaused(user.depositPaused === true);
      setAccountActive(user.accountStatus === "active");
      setLastUserId(user._id);
    }
  }, [user, lastUserId]);

  const handleCopyPhone = async () => {
    if (user?.phone) {
      try {
        await navigator.clipboard.writeText(user.phone);
        setCopied(true);
        toast.success("Phone number copied!");
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error("Failed to copy");
      }
    }
  };

  const showModal = () => setIsModalOpen(true);
  const handleCancel = () => setIsModalOpen(false);
  const handleOk = () => {
    setIsModalOpen(false);
    onClose();
  };

  const handlePauseWithdrawal = (checked) => {
    if (!user?._id) return;
    setWithdrawalPaused(checked);
    if (checked) {
      pauseWithdrawalFn(user._id, {
        onError: () => setWithdrawalPaused(false),
      });
    } else {
      activateWithdrawalFn(user._id, {
        onError: () => setWithdrawalPaused(true),
      });
    }
  };

  const handlePauseDeposit = (checked) => {
    if (!user?._id) return;
    setDepositPaused(checked);
    if (checked) {
      pauseDepositFn(user._id, {
        onError: () => setDepositPaused(false),
      });
    } else {
      activateDepositFn(user._id, {
        onError: () => setDepositPaused(true),
      });
    }
  };

  const handlePauseAccount = (checked) => {
    if (!user?._id) return;
    setAccountActive(checked);
    if (!checked) {
      pauseAccountFn(user._id, {
        onError: () => setAccountActive(true),
      });
    } else {
      activateAccountFn(user._id, {
        onError: () => setAccountActive(false),
      });
    }
  };

  const formatDate = (dateString) =>
    dateString
      ? new Date(dateString).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "N/A";

  const getStatusBadge = (status) => {
    const config = {
      active: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Active" },
      blocked: { bg: "bg-red-50", text: "text-red-700", label: "Blocked" },
      banned: { bg: "bg-red-50", text: "text-red-700", label: "Banned" },
    };
    const { bg, text, label } = config[status] || { bg: "bg-slate-100 dark:bg-slate-700", text: "text-slate-600 dark:text-slate-300", label: status || "N/A" };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
        {label}
      </span>
    );
  };

  const getPhoneVerificationBadge = (verified) => (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
        verified
          ? "bg-blue-50 text-blue-700"
          : "bg-amber-50 text-amber-700"
      }`}
    >
      {verified ? <FiCheck size={12} /> : <FiAlertTriangle size={12} />}
      {verified ? "Phone Verified" : "Phone Unverified"}
    </span>
  );

  const welcomeBonus = user?.welcomeBonusDetails;
  const welcomeBonusStatus = welcomeBonus?.status || "not_awarded";
  const welcomeBonusStatusLabels = {
    credited: "Credited",
    held: "Held for review",
    rejected: "Rejected",
    not_eligible: "Not eligible yet",
    not_awarded: "Not awarded",
  };
  const welcomeBonusReasonLabels = {
    phone_not_verified: "The user has not verified their phone number.",
    device_id_missing: "The registration did not include a stable device ID.",
    device_already_used: "This device was already used by another account.",
    ip_used_by_many_accounts: "Too many accounts were registered from the same IP address.",
    no_award_record: "The user is verified, but no welcome-bonus award record exists.",
  };
  const welcomeBonusStatusStyles = {
    credited: "bg-emerald-50 text-emerald-700 border-emerald-200",
    held: "bg-amber-50 text-amber-700 border-amber-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
    not_eligible: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    not_awarded: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[420px] max-w-full bg-white dark:bg-slate-800 shadow-2xl transform transition-transform duration-300 ease-out z-50 flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#f9ce36]/20 flex items-center justify-center">
              <FiUser className="text-amber-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {readOnly ? "User Details" : "User Management"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {readOnly ? "View user account information" : "Manage user account settings"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* User Profile Card */}
          <div className="p-6">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-[#f9ce36] flex items-center justify-center shadow-sm">
                  <span className="text-slate-900 dark:text-slate-100 font-bold text-lg">
                    {user?.phone?.slice(-2) || "??"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FiPhone className="text-slate-400 dark:text-slate-500" size={14} />
                    <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {user?.phone || "No phone"}
                    </span>
                    <button
                      onClick={handleCopyPhone}
                      className="p-1.5 rounded-md hover:bg-slate-200 transition-colors"
                      title="Copy phone number"
                    >
                      {copied ? (
                        <FiCheck className="text-emerald-500" size={14} />
                      ) : (
                        <FiCopy className="text-slate-400 dark:text-slate-500" size={14} />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(user?.accountStatus)}
                    {getPhoneVerificationBadge(user?.phoneVerified === true)}
                  </div>
                </div>
              </div>

              {/* User Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-1">
                    <FiDollarSign className="text-emerald-500" size={14} />
                    <span className="text-xs text-slate-500 dark:text-slate-400">Total Balance</span>
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {formatCurrency(user?.wallet?.totalBalance ?? 0)}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-1">
                    <FiDollarSign className="text-amber-500" size={14} />
                    <span className="text-xs text-slate-500 dark:text-slate-400">Bonus Balance</span>
                  </div>
                  <p className="font-semibold text-amber-700">
                    {formatCurrency(user?.wallet?.bonusBalance ?? 0)}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-1">
                    <FiDollarSign className="text-emerald-500" size={14} />
                    <span className="text-xs text-slate-500 dark:text-slate-400">Withdrawable</span>
                  </div>
                  <p className="font-semibold text-emerald-700">
                    {formatCurrency(user?.wallet?.withdrawableBalance ?? 0)}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-1">
                    <FiCalendar className="text-blue-500" size={14} />
                    <span className="text-xs text-slate-500 dark:text-slate-400">Joined</span>
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                    {formatDate(user?.createdAt)}
                  </p>
                </div>
              </div>

              <div className="mt-3 bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Welcome Bonus</span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full border text-xs font-medium ${
                    welcomeBonusStatusStyles[welcomeBonusStatus] || welcomeBonusStatusStyles.not_awarded
                  }`}>
                    {welcomeBonusStatusLabels[welcomeBonusStatus] || welcomeBonusStatus}
                  </span>
                </div>
                {welcomeBonusStatus === "credited" ? (
                  <p className="text-xs text-emerald-700">
                    {formatCurrency(welcomeBonus?.amount ?? 0)} credited
                    {welcomeBonus?.creditedAt ? ` on ${formatDate(welcomeBonus.creditedAt)}` : ""}.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {(welcomeBonus?.reasons || ["no_award_record"]).map((reason) => (
                      <p key={reason} className="text-xs text-slate-600 dark:text-slate-300">
                        {welcomeBonusReasonLabels[reason] || reason.replaceAll("_", " ")}
                      </p>
                    ))}
                    {welcomeBonus?.reviewNotes && (
                      <p className="text-xs text-slate-600 dark:text-slate-300">Review note: {welcomeBonus.reviewNotes}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {!readOnly && <>
          {/* Divider */}
          <div className="h-px bg-slate-200 mx-6" />

          {/* Account Controls Section */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <HiOutlineShieldCheck className="text-slate-600 dark:text-slate-300" size={18} />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                Account Controls
              </h3>
            </div>

            <div className="space-y-1">
              {/* Pause Withdrawal */}
              <div className="flex justify-between items-center p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
                    <HiOutlineArrowUpTray className="text-orange-600" size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Pause Withdrawal</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {withdrawalPaused ? "Withdrawals blocked" : "Withdrawals enabled"}
                    </p>
                  </div>
                </div>
                <Toggle
                  checked={withdrawalPaused}
                  onChange={handlePauseWithdrawal}
                  loading={isPausingWithdrawal || isActivatingWithdrawal}
                />
              </div>

              {/* Pause Deposit */}
              <div className="flex justify-between items-center p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <HiOutlineArrowDownTray className="text-blue-600" size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Pause Deposit</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {depositPaused ? "Deposits blocked" : "Deposits enabled"}
                    </p>
                  </div>
                </div>
                <Toggle
                  checked={depositPaused}
                  onChange={handlePauseDeposit}
                  loading={isPausingDeposit || isActivatingDeposit}
                />
              </div>

              {/* Pause/Activate Account */}
              <div className="flex justify-between items-center p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <HiOutlineBanknotes className="text-emerald-600" size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Account Status</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {accountActive ? "Account is active" : "Account is paused"}
                    </p>
                  </div>
                </div>
                <Toggle
                  checked={accountActive}
                  onChange={handlePauseAccount}
                  loading={isPausingAccount || isActivatingAccount}
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-200 mx-6" />

          {/* Danger Zone */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FiAlertTriangle className="text-red-500" size={16} />
              <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wide">
                Danger Zone
              </h3>
            </div>

            <div className="bg-red-50 rounded-xl p-4 border border-red-100 space-y-3">
              {/* Zero Balance */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
                    <FiSlash className="text-red-600" size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-800">Zero Balance</p>
                    <p className="text-xs text-red-600">Clear total and bonus balances</p>
                  </div>
                </div>
                <button
                  onClick={confirmZeroBalance}
                  disabled={isZeroingBalance}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-white dark:bg-slate-800 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {isZeroingBalance ? <FiLoader className="animate-spin" size={14} /> : null}
                  Zero
                </button>
              </div>

              <div className="h-px bg-red-100" />

              {/* Delete Account */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
                    <FiTrash2 className="text-red-600" size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-800">Delete Account</p>
                    <p className="text-xs text-red-600">This action cannot be undone</p>
                  </div>
                </div>
                <button
                  onClick={showModal}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-white dark:bg-slate-800 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
          </>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-[#f9ce36] text-slate-900 dark:text-slate-100 font-medium rounded-lg hover:bg-[#e6bd2e] transition-colors"
          >
            Done
          </button>
        </div>

        {!readOnly && (
          <DeleteModal
            open={isModalOpen}
            onCancel={handleCancel}
            onOk={handleOk}
            userID={user?._id}
          />
        )}
      </div>
    </>
  );
}

export default MyDrawer;
