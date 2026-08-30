import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiClock, FiDollarSign, FiUsers } from "react-icons/fi";
import { HiOutlineCheckCircle, HiOutlineLockClosed, HiOutlineTrophy } from "react-icons/hi2";
import Loader from "../../components/Loader";
import { useFormatCurrency } from "../../hooks/useFormatCurrency";
import {
  formatJackpotDate,
  formatJackpotScore,
  isValidJackpotPick,
  JACKPOT_PICK_OPTIONS,
} from "./jackpotUtils";
import {
  useJackpotActiveDraw,
  useJackpotMyBetByDraw,
  useJackpotRecentResults,
  usePlaceJackpotBet,
} from "./useJackpot";
import JackpotPageShell from "./JackpotPageShell";
import { getJackpotUser } from "./jackpotUtils";

function JackpotPage() {
  const navigate = useNavigate();
  const { formatCurrency } = useFormatCurrency();
  const { activeDraw, isPending: isLoadingDraw } = useJackpotActiveDraw();
  const { results: recentResults, isPending: isLoadingResults } = useJackpotRecentResults(5);
  const [picks, setPicks] = useState([]);
  const { bet: existingBet, isPending: isExistingBetLoading } = useJackpotMyBetByDraw(activeDraw?.id);
  const { placeJackpotBet, isPlacingBet } = usePlaceJackpotBet();

  useEffect(() => {
    if (activeDraw?.matches?.length) {
      setPicks(Array(activeDraw.matches.length).fill(""));
    } else {
      setPicks([]);
    }
  }, [activeDraw]);

  const user = getJackpotUser();
  const drawClosed = activeDraw?.status && String(activeDraw.status).toLowerCase() !== "open";
  const selectedCount = picks.filter(Boolean).length;
  const canSubmit =
    Boolean(user?.token) &&
    !drawClosed &&
    selectedCount === 7 &&
    !existingBet?.id &&
    !isExistingBetLoading;
  const submissionDisabledReason = useMemo(() => {
    if (!user?.token) return "Log in to place a bet.";
    if (!activeDraw) return "There is no active draw right now.";
    if (drawClosed) return "This draw is already closed.";
    if (isExistingBetLoading) return "Checking your existing bet...";
    if (existingBet?.id) return "You already have a bet on this draw.";
    if (selectedCount !== 7) return "Select all 7 matches before submitting.";
    return "";
  }, [activeDraw, drawClosed, existingBet?.id, isExistingBetLoading, selectedCount, user?.token]);

  const updatePick = (matchIndex, value) => {
    if (!isValidJackpotPick(value)) return;

    setPicks((current) => {
      const next = [...current];
      next[matchIndex] = value;
      return next;
    });
  };

  const handleSubmit = () => {
    if (!user?.token) {
      navigate("/login");
      return;
    }

    if (!activeDraw) return;
    if (drawClosed) return;
    if (selectedCount !== 7) return;
    if (!picks.every((pick) => isValidJackpotPick(pick))) return;

    placeJackpotBet(
      {
        drawId: activeDraw.id,
        picks,
      },
      {
        onSuccess: () => {
          setPicks([]);
        },
      }
    );
  };

  const pageSubtitle = activeDraw
    ? `Close the draw by selecting exactly 7 outcomes and placing your entry before ${formatJackpotDate(activeDraw.closeTime)}.`
    : "Check the latest settled draws and your recent jackpot activity from one place.";

  return (
    <JackpotPageShell
      title="Jackpot"
      subtitle={pageSubtitle}
      action={
        <Link
          to="/jackpot/results"
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
        >
          <HiOutlineTrophy size={16} />
          View Results
        </Link>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
        <section className="space-y-5">
          {isLoadingDraw ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <Loader />
            </div>
          ) : activeDraw ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Draw Number" value={`#${activeDraw.drawNumber}`} icon={<HiOutlineTrophy size={18} />} />
                <StatCard label="Draw Day" value={activeDraw.drawDay} icon={<FiClock size={18} />} />
                <StatCard label="Bet Amount" value={formatCurrency(activeDraw.betAmount ?? 0)} icon={<FiDollarSign size={18} />} />
                <StatCard label="Total Bets" value={String(activeDraw.totalBets ?? 0)} icon={<FiUsers size={18} />} />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Active Draw</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Close time: {formatJackpotDate(activeDraw.closeTime)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(activeDraw.prizeTiers || []).length ? activeDraw.prizeTiers.map((tier, index) => (
                      <span
                        key={`${tier.label}-${index}`}
                        className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900"
                      >
                        {tier.label}: {tier.value}
                      </span>
                    )) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        Prize tiers not available
                      </span>
                    )}
                  </div>
                </div>

                {existingBet?.id ? (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <div className="flex items-start gap-2">
                      <HiOutlineCheckCircle size={18} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">You already have a bet on this draw.</p>
                        <p className="mt-1">
                          Score: {formatJackpotScore(existingBet.score, existingBet.totalMatches || 7)} · Prize: {formatCurrency(existingBet.prize ?? 0)}
                        </p>
                        <Link
                          to={`/jackpot/my-bets/${existingBet.id}`}
                          className="mt-2 inline-flex font-medium text-emerald-700 underline"
                        >
                          View bet detail
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="mt-5 space-y-4">
                  {(activeDraw.matches || []).slice(0, 7).map((match, index) => (
                    <MatchPicker
                      key={match.id || `${index}`}
                      match={match}
                      index={index}
                      value={picks[index] || ""}
                      onChange={updatePick}
                    />
                  ))}
                </div>

                <div className="mt-5 flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-slate-600">
                    Selected {selectedCount}/7 picks
                    {submissionDisabledReason ? (
                      <span className="ml-2 text-rose-600">{submissionDisabledReason}</span>
                    ) : (
                      <span className="ml-2 text-emerald-600">Ready to submit.</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit || isPlacingBet}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f9ce36] px-5 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-[#e6bd2e] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPlacingBet ? <Loader /> : <HiOutlineLockClosed size={16} />}
                    {isPlacingBet ? "Placing bet..." : "Place Bet"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                <HiOutlineTrophy size={26} />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-900">No active draw right now</h2>
              <p className="mt-2 text-sm text-slate-500">
                We’ll show the next open jackpot draw here as soon as the API makes one available.
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <Link
                  to="/jackpot/results"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Browse Results
                </Link>
                <Link
                  to="/jackpot/my-bets"
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                >
                  My Bets
                </Link>
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Recent Results</h3>
                <p className="text-sm text-slate-500">Latest settled draws</p>
              </div>
              <Link to="/jackpot/results" className="text-sm font-medium text-amber-600">
                See all
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {isLoadingResults ? (
                <Loader />
              ) : recentResults.length ? (
                recentResults.map((result) => (
                  <Link
                    key={result.id || result.drawNumber}
                    to={`/jackpot/results/${result.id || result.drawNumber}`}
                    className="block rounded-xl border border-slate-200 p-4 transition-colors hover:border-amber-300 hover:bg-amber-50/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">Draw #{result.drawNumber}</p>
                        <p className="text-xs text-slate-500">{formatJackpotDate(result.settlementTime)}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {result.totalBets ?? 0} bets
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                      <span>Total paid: {formatCurrency(result.totalPaidOut ?? 0)}</span>
                      <span>•</span>
                      <span>{(result.prizeTiers || []).length} prize tiers</span>
                    </div>
                  </Link>
                ))
              ) : (
                <EmptyMessage title="No recent results yet" description="Settled jackpot draws will appear here." />
              )}
            </div>
          </div>
        </aside>
      </div>
    </JackpotPageShell>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
        </div>
        <span className="rounded-xl bg-amber-50 p-2 text-amber-700">{icon}</span>
      </div>
    </div>
  );
}

function MatchPicker({ match, index, value, onChange }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">
            Match {match.matchNumber || index + 1}
          </p>
          <p className="mt-1 text-sm text-slate-600 break-words">
            {match.homeTeam} vs {match.awayTeam}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Kickoff: {formatJackpotDate(match.kickoffTime)}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {JACKPOT_PICK_OPTIONS.map((pick) => (
            <button
              key={pick.value}
              type="button"
              onClick={() => onChange(index, pick.value)}
              className={`min-w-[64px] rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                value === pick.value
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {pick.value}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyMessage({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
      <p className="font-medium text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

export default JackpotPage;
