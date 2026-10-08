import { useState } from "react";
import { Link } from "react-router-dom";
import { Modal, Select, message } from "antd";
import {
  useTransferSecondaryWallet,
  useGetSecondaryWallet,
} from "../hooks/useTransfer";
import {
  useCreateEvent,
  useCancelEvent,
  useCreateVirtualShortcode,
  useCreditUserWallet,
  useSettleEvent,
} from "../hooks/useAdminTools";
import { normalizeStaffRole, readStoredUser } from "../utils/authSession";

const DEFAULT_SELECTIONS = JSON.stringify(
  [
    { key: "home", label: "Home Team wins", odds: 1.78 },
    { key: "draw", label: "Draw", odds: 3.2 },
    { key: "away", label: "Away Team wins", odds: 4.1 },
  ],
  null,
  2
);

const INITIAL_EVENT_FORM = {
  sport: "football",
  league: "",
  homeTeam: "",
  awayTeam: "",
  startTime: "",
  selections: DEFAULT_SELECTIONS,
};

const SHORTCODE_ADAPTER_EXAMPLES = {
  ussd: JSON.stringify({
    msisdn: "254711111111",
    sessionId: "session-1",
    text: "",
    level: 1,
    code: "*123#",
    input: "",
  }, null, 2),
  sms: JSON.stringify({
    shortcode: "12345",
    message: "balance",
    inboxrouteid: "route-1",
  }, null, 2),
};

const inputClassName =
  "p-2 w-full text-gray-700 border border-gray-400 rounded";

const Settings = () => {
  const isSuperAdmin = normalizeStaffRole(readStoredUser()) === "super_admin";

  const [secondaryWalletAmount, setSecondaryWalletAmount] = useState("");
  const [creditUserId, setCreditUserId] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [settleEventId, setSettleEventId] = useState("");
  const [settleResult, setSettleResult] = useState("home");
  const [cancelEventId, setCancelEventId] = useState("");
  const [eventForm, setEventForm] = useState(INITIAL_EVENT_FORM);
  const [gameUuid, setGameUuid] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [currency, setCurrency] = useState("KES");
  const [shortcodeAdapterPayload, setShortcodeAdapterPayload] = useState(
    SHORTCODE_ADAPTER_EXAMPLES.ussd,
  );
  const [shortcodeChannel, setShortcodeChannel] = useState("ussd");
  const [shortcodePlayerToken, setShortcodePlayerToken] = useState("");
  const [shortcodeBalance, setShortcodeBalance] = useState("");

  const {
    transferSecondaryWalletFn,
    isLoading: transferSecondaryWalletLoading,
  } = useTransferSecondaryWallet();
  const { secondaryWalletBalance } = useGetSecondaryWallet();
  const { creditUserWalletFn, isLoading: isCreditingWallet } =
    useCreditUserWallet();
  const { createEventFn, isLoading: isCreatingEvent } = useCreateEvent();
  const { settleEventFn, isLoading: isSettlingEvent } = useSettleEvent();
  const { cancelEventFn, isLoading: isCancellingEvent } = useCancelEvent();
  const {
    createVirtualShortcodeFn,
    isLoading: isCreatingVirtualShortcode,
  } = useCreateVirtualShortcode();

  function handleTransferSecondaryWallet() {
    const amount = Number(secondaryWalletAmount);
    if (!(amount > 0)) {
      message.error("Enter an amount greater than zero");
      return;
    }
    Modal.confirm({
      title: "Fund the withdrawal treasury?",
      content: `KES ${amount.toLocaleString()} will be moved into the payout float.`,
      okText: "Fund treasury",
      cancelText: "Go back",
      onOk: () =>
        transferSecondaryWalletFn(
          { amount: secondaryWalletAmount },
          {
            onSuccess: () => setSecondaryWalletAmount(""),
            onError: () => setSecondaryWalletAmount(""),
          }
        ),
    });
  }

  function handleCreditWallet() {
    const amount = Number(creditAmount);
    if (!creditUserId.trim() || !(amount > 0)) {
      message.error("Enter a player ID and an amount greater than zero");
      return;
    }
    Modal.confirm({
      title: "Credit this player's wallet?",
      content: `KES ${amount.toLocaleString()} will be added to player ${creditUserId.trim()}. This is recorded in the audit log.`,
      okText: "Credit wallet",
      okType: "danger",
      cancelText: "Go back",
      onOk: () =>
        creditUserWalletFn(
          { userId: creditUserId.trim(), amount: creditAmount },
          {
            onSuccess: () => {
              setCreditUserId("");
              setCreditAmount("");
            },
          }
        ),
    });
  }

  function handleCreateEvent() {
    let selections;

    try {
      selections = JSON.parse(eventForm.selections);
    } catch {
      message.error("Selections must be valid JSON");
      return;
    }

    createEventFn(
      {
        sport: eventForm.sport,
        league: eventForm.league,
        homeTeam: eventForm.homeTeam,
        awayTeam: eventForm.awayTeam,
        startTime: eventForm.startTime,
        selections,
      },
      {
        onSuccess: () => {
          setEventForm(INITIAL_EVENT_FORM);
        },
      }
    );
  }

  function handleSettleEvent() {
    const eventId = settleEventId.trim();
    if (!eventId || !settleResult) return;
    Modal.confirm({
      title: "Settle this event?",
      content: `Event ${eventId} will be settled as "${settleResult}" and winning bets paid out. This cannot be undone.`,
      okText: "Settle and pay out",
      okType: "danger",
      cancelText: "Go back",
      onOk: () =>
        settleEventFn(
          { eventId, result: settleResult },
          {
            onSuccess: () => {
              setSettleEventId("");
              setSettleResult("home");
            },
          }
        ),
    });
  }

  function handleCancelEvent() {
    const eventId = cancelEventId.trim();
    if (!eventId) return;
    Modal.confirm({
      title: "Cancel this event?",
      content: "All open bets will be voided and their cash and bonus stake portions will be restored.",
      okText: "Cancel event",
      okType: "danger",
      cancelText: "Keep event",
      onOk: () => {
        cancelEventFn(
          { eventId },
          { onSuccess: () => setCancelEventId("") }
        );
      },
    });
  }

  function handleCreateShortcode() {
    if (!gameUuid || !playerId) return;
    let adapterPayload;
    try {
      adapterPayload = JSON.parse(shortcodeAdapterPayload);
    } catch {
      message.error("Adapter payload must be valid JSON");
      return;
    }
    createVirtualShortcodeFn(
      {
        gameUuid,
        payload: {
          player_id: playerId,
          player_name: playerName,
          ...(shortcodePlayerToken ? { player_token: shortcodePlayerToken } : {}),
          ...(shortcodeBalance !== "" ? { balance: Number(shortcodeBalance) } : {}),
          currency,
          channel: shortcodeChannel,
          transport: shortcodeChannel === "ussd" ? "infinity-kartal" : "mobitech",
          adapter_payload: adapterPayload,
        },
      },
      {
        onSuccess: () => {
          setGameUuid("");
          setPlayerId("");
          setPlayerName("");
          setCurrency("KES");
          setShortcodeAdapterPayload(SHORTCODE_ADAPTER_EXAMPLES.ussd);
          setShortcodeChannel("ussd");
          setShortcodePlayerToken("");
          setShortcodeBalance("");
        },
      }
    );
  }

  return (
    <div className="lg:p-6 p-2 bg-gray-50 rounded-lg">
      <div className="flex flex-wrap gap-6 mt-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-md shadow w-full">
          <h3 className="text-xl text-gray-600 font-semibold">
            Withdrawal Treasury
            <span className="text-gray-400 text-sm font-normal">
              {" "}(internal withdrawal reserve)
            </span>
          </h3>
          <p className="text-sm text-gray-500 mt-2">
            Available: {secondaryWalletBalance?.currency || "KES"}{" "}
            {Number(secondaryWalletBalance?.balance || 0).toLocaleString()}
          </p>
          <div className="grid grid-cols-1 gap-4 mt-4">
            <div>
              <label className="block text-sm text-gray-500 font-medium mb-1">
                Amount
              </label>
              <div className="flex flex-col gap-4">
                <input
                  type="number"
                  value={secondaryWalletAmount}
                  onChange={(e) => setSecondaryWalletAmount(e.target.value)}
                  className={`${inputClassName} max-w-full md:max-w-[30rem]`}
                  placeholder="Amount to allocate"
                  disabled={!isSuperAdmin}
                />
                <button
                  onClick={handleTransferSecondaryWallet}
                  type="button"
                  className="p-2 text-black rounded !bg-[#f9ce36]"
                  disabled={!isSuperAdmin || transferSecondaryWalletLoading}
                >
                  {!isSuperAdmin
                    ? "Superadmin required"
                    : transferSecondaryWalletLoading
                      ? "Funding..."
                      : "Fund treasury"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isSuperAdmin && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-md shadow w-full mt-6">
          <h3 className="text-xl text-gray-600 font-semibold mb-1">Staff accounts</h3>
          <p className="text-sm text-gray-400">
            Add admins and support agents, change roles and reset passwords on the{" "}
            <Link to="/staff" className="font-medium text-amber-600 hover:underline">
              Staff page
            </Link>
            .
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-md shadow">
          <h3 className="text-xl text-gray-600 font-semibold mb-1">
            Manual Wallet Credit
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Add funds to a single player's wallet. Every credit is recorded in the audit log.
          </p>
          <div className="flex flex-col gap-4">
            <input
              type="text"
              value={creditUserId}
              onChange={(e) => setCreditUserId(e.target.value)}
              className={inputClassName}
              placeholder="User ID"
            />
            <input
              type="number"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              className={inputClassName}
              placeholder="Amount"
            />
            <button
              onClick={handleCreditWallet}
              disabled={isCreditingWallet || !creditUserId || !creditAmount}
              type="button"
              className="p-2 text-black rounded !bg-[#f9ce36] disabled:opacity-50"
            >
              {isCreditingWallet ? "Crediting..." : "Credit wallet"}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-md shadow">
          <h3 className="text-xl text-gray-600 font-semibold mb-1">
            Settle Event
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Settle a sportsbook event and trigger payout processing.
          </p>
          <div className="flex flex-col gap-4">
            <input
              type="text"
              value={settleEventId}
              onChange={(e) => setSettleEventId(e.target.value)}
              className={inputClassName}
              placeholder="Event ID"
            />
            <Select
              value={settleResult}
              onChange={setSettleResult}
              options={[
                { label: "Home", value: "home" },
                { label: "Draw", value: "draw" },
                { label: "Away", value: "away" },
              ]}
            />
            <button
              onClick={handleSettleEvent}
              disabled={isSettlingEvent || !settleEventId}
              type="button"
              className="p-2 text-black rounded !bg-[#f9ce36] disabled:opacity-50"
            >
              {isSettlingEvent ? "Settling..." : "Settle event"}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-md shadow">
          <h3 className="text-xl text-gray-600 font-semibold mb-1">
            Cancel Event
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Cancel an event, void its open bets, and restore cash and bonus stakes.
          </p>
          <div className="flex flex-col gap-4">
            <input
              type="text"
              value={cancelEventId}
              onChange={(e) => setCancelEventId(e.target.value)}
              className={inputClassName}
              placeholder="Event ID"
            />
            <button
              onClick={handleCancelEvent}
              disabled={isCancellingEvent || !cancelEventId.trim()}
              type="button"
              className="p-2 text-white rounded !bg-red-600 hover:!bg-red-700 disabled:opacity-50"
            >
              {isCancellingEvent ? "Cancelling..." : "Cancel event"}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-md shadow xl:col-span-2">
          <h3 className="text-xl text-gray-600 font-semibold mb-1">
            Create Sports Event
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Add a sportsbook event with its betting selections and odds.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={eventForm.sport}
              onChange={(e) =>
                setEventForm((current) => ({ ...current, sport: e.target.value }))
              }
              className={inputClassName}
              placeholder="Sport"
            />
            <input
              type="text"
              value={eventForm.league}
              onChange={(e) =>
                setEventForm((current) => ({ ...current, league: e.target.value }))
              }
              className={inputClassName}
              placeholder="League"
            />
            <input
              type="text"
              value={eventForm.homeTeam}
              onChange={(e) =>
                setEventForm((current) => ({
                  ...current,
                  homeTeam: e.target.value,
                }))
              }
              className={inputClassName}
              placeholder="Home team"
            />
            <input
              type="text"
              value={eventForm.awayTeam}
              onChange={(e) =>
                setEventForm((current) => ({
                  ...current,
                  awayTeam: e.target.value,
                }))
              }
              className={inputClassName}
              placeholder="Away team"
            />
            <input
              type="datetime-local"
              value={eventForm.startTime}
              onChange={(e) =>
                setEventForm((current) => ({
                  ...current,
                  startTime: e.target.value,
                }))
              }
              className={inputClassName}
            />
            <div className="text-sm text-gray-400 flex items-center">
              Paste the `selections` array as JSON.
            </div>
            <textarea
              value={eventForm.selections}
              onChange={(e) =>
                setEventForm((current) => ({
                  ...current,
                  selections: e.target.value,
                }))
              }
              className="p-2 text-gray-700 border border-gray-400 rounded md:col-span-2 min-h-40 font-mono text-sm"
              placeholder="Selections JSON"
            />
            <button
              onClick={handleCreateEvent}
              disabled={
                isCreatingEvent ||
                !eventForm.league ||
                !eventForm.homeTeam ||
                !eventForm.awayTeam ||
                !eventForm.startTime
              }
              type="button"
              className="p-2 text-black rounded !bg-[#f9ce36] disabled:opacity-50 md:col-span-2"
            >
              {isCreatingEvent ? "Creating..." : "Create event"}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-md shadow xl:col-span-2">
          <h3 className="text-xl text-gray-600 font-semibold mb-1">
            Virtual Shortcode Session
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Start a provider shortcode session from the dashboard.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={gameUuid}
              onChange={(e) => setGameUuid(e.target.value)}
              className={inputClassName}
              placeholder="Game UUID"
            />
            <input
              type="text"
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              className={inputClassName}
              placeholder="Player ID"
            />
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className={inputClassName}
              placeholder="Player name (optional)"
            />
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={inputClassName}
              placeholder="Currency"
            />
            <input
              type="text"
              value={shortcodePlayerToken}
              onChange={(e) => setShortcodePlayerToken(e.target.value)}
              className={inputClassName}
              placeholder="Player token (optional)"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={shortcodeBalance}
              onChange={(e) => setShortcodeBalance(e.target.value)}
              className={inputClassName}
              placeholder="Balance snapshot (optional)"
            />
            <Select
              value={shortcodeChannel}
              onChange={(channel) => {
                setShortcodeChannel(channel);
                setShortcodeAdapterPayload(SHORTCODE_ADAPTER_EXAMPLES[channel]);
              }}
              options={[
                { label: "USSD", value: "ussd" },
                { label: "SMS", value: "sms" },
              ]}
            />
            <textarea
              rows={9}
              value={shortcodeAdapterPayload}
              onChange={(e) => setShortcodeAdapterPayload(e.target.value)}
              className={`${inputClassName} font-mono text-sm md:col-span-2`}
              placeholder="Adapter payload JSON"
            />
            <button
              onClick={handleCreateShortcode}
              disabled={
                isCreatingVirtualShortcode ||
                !gameUuid ||
                !playerId ||
                !shortcodeAdapterPayload
              }
              type="button"
              className="p-2 text-black rounded !bg-[#f9ce36] disabled:opacity-50 md:col-span-2"
            >
              {isCreatingVirtualShortcode ? "Sending..." : "Create shortcode"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
