import { Link, useParams } from "react-router-dom";
import Loader from "../../components/Loader";
import MoveBack from "../../components/MoveBack";
import JackpotPageShell from "./JackpotPageShell";
import {
  formatJackpotDate,
  formatJackpotScore,
  normalizeJackpotPick,
} from "./jackpotUtils";
import {
  useJackpotDrawDetail,
  useJackpotMyBetByDraw,
  useJackpotWinners,
} from "./useJackpot";
import { useFormatCurrency } from "../../hooks/useFormatCurrency";

function JackpotDrawDetailPage() {
  const { drawId } = useParams();
  const { formatCurrency } = useFormatCurrency();
  const { draw, isPending } = useJackpotDrawDetail(drawId);
  const { winners, isPending: winnersLoading } = useJackpotWinners(drawId);
  const { bet } = useJackpotMyBetByDraw(drawId);

  return (
    <JackpotPageShell
      title={`Draw detail ${draw?.drawNumber ? `#${draw.drawNumber}` : ""}`}
      subtitle="See the full result breakdown, prize tiers, and draw winners in one place."
      action={<MoveBack />}
    >
      {isPending ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8">
          <Loader />
        </div>
      ) : draw ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Draw Number" value={`#${draw.drawNumber}`} />
            <StatCard label="Draw Day" value={draw.drawDay} />
            <StatCard label="Settlement Time" value={formatJackpotDate(draw.settlementTime)} />
            <StatCard label="Total Paid Out" value={formatCurrency(draw.totalPaidOut ?? 0)} />
          </div>

          {bet?.id ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
              <p className="font-semibold">Your bet on this draw</p>
              <p className="mt-1 text-sm">
                Score {formatJackpotScore(bet.score, bet.totalMatches || 7)} · Prize {formatCurrency(bet.prize ?? 0)}
              </p>
              <Link
                to={`/jackpot/my-bets/${bet.id}`}
                className="mt-3 inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Open bet detail
              </Link>
            </div>
          ) : null}

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Match Results</h2>
              <div className="mt-4 space-y-3">
                {(draw.matches || []).length ? draw.matches.map((match, index) => (
                  <div key={match.id || index} className="rounded-xl border border-slate-200 p-4">
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

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          Result: {normalizeJackpotPick(match.result) || "--"}
                        </span>
                        {match.userPick ? (
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                            match.isCorrect === false
                              ? "bg-rose-100 text-rose-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}>
                            Your pick: {normalizeJackpotPick(match.userPick)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )) : (
                  <EmptyMessage title="No match results available" description="The API did not return match-level results for this draw." />
                )}
              </div>
            </section>

            <aside className="space-y-5">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Prize Tiers</h2>
                <div className="mt-4 space-y-3">
                  {(draw.prizeTiers || []).length ? draw.prizeTiers.map((tier, index) => (
                    <div key={`${tier.label}-${index}`} className="rounded-xl bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">{tier.label}</p>
                      <p className="mt-1 text-sm text-slate-600">{String(tier.value)}</p>
                    </div>
                  )) : (
                    <EmptyMessage title="No prize tiers returned" description="Prize breakdown was not included in the response." />
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-900">Winners</h2>
                  <span className="text-sm text-slate-500">{winners?.length ?? 0} entries</span>
                </div>
                <div className="mt-4 space-y-3">
                  {winnersLoading ? (
                    <Loader />
                  ) : winners.length ? (
                    winners.map((winner, index) => (
                      <div key={winner.id || index} className="rounded-xl border border-slate-200 p-4">
                        <p className="text-sm font-medium text-slate-900">
                          {winner.name || winner.phone || winner.user || `Winner ${index + 1}`}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Prize: {formatCurrency(winner.prize ?? winner.amount ?? 0)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <EmptyMessage title="No winners returned" description="If the draw has winners, they will appear here." />
                  )}
                </div>
              </section>
            </aside>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="font-semibold text-slate-900">Draw not found</p>
          <p className="mt-2 text-sm text-slate-500">
            We could not load this jackpot draw.
          </p>
          <Link
            to="/jackpot/results"
            className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Back to results
          </Link>
        </div>
      )}
    </JackpotPageShell>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-900 break-words">{value}</p>
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

export default JackpotDrawDetailPage;

