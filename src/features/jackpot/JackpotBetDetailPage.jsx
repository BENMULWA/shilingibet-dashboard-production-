import { Link, useParams } from "react-router-dom";
import Loader from "../../components/Loader";
import MoveBack from "../../components/MoveBack";
import JackpotPageShell from "./JackpotPageShell";
import { formatJackpotDate, formatJackpotScore, normalizeJackpotPick } from "./jackpotUtils";
import { useJackpotMyBetDetail } from "./useJackpot";
import { useFormatCurrency } from "../../hooks/useFormatCurrency";

function JackpotBetDetailPage() {
  const { betId } = useParams();
  const { formatCurrency } = useFormatCurrency();
  const { bet, isPending } = useJackpotMyBetDetail(betId);

  return (
    <JackpotPageShell
      title={`Bet detail ${bet?.id ? `#${bet.id}` : ""}`}
      subtitle="Open the full match-by-match jackpot breakdown."
      action={<MoveBack />}
    >
      {isPending ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8">
          <Loader />
        </div>
      ) : bet ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
          <section className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Draw Number" value={`#${bet.drawNumber}`} />
              <StatCard label="Created At" value={formatJackpotDate(bet.createdAt)} />
              <StatCard label="Score" value={formatJackpotScore(bet.score, bet.totalMatches || 7)} />
              <StatCard label="Prize" value={formatCurrency(bet.prize ?? 0)} />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">Match Breakdown</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {bet.payoutStatus || "--"}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {(bet.matches || []).length ? bet.matches.map((match, index) => (
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
                          Pick: {normalizeJackpotPick(match.userPick) || "--"}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          Result: {normalizeJackpotPick(match.result) || "--"}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            match.isCorrect === false
                              ? "bg-rose-100 text-rose-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {match.isCorrect === false
                            ? "Incorrect"
                            : match.isCorrect === true
                              ? "Correct"
                              : "Pending"}
                        </span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <EmptyMessage title="No match breakdown available" description="The bet detail response did not include match entries." />
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Bet Summary</h2>
              <div className="mt-4 space-y-3">
                <SummaryRow label="Bet ID" value={String(bet.id)} />
                <SummaryRow label="Draw" value={String(bet.drawNumber)} />
                <SummaryRow label="Score" value={formatJackpotScore(bet.score, bet.totalMatches || 7)} />
                <SummaryRow label="Prize" value={formatCurrency(bet.prize ?? 0)} />
                <SummaryRow label="Payout Status" value={bet.payoutStatus || "--"} />
              </div>
              <Link
                to="/jackpot/my-bets"
                className="mt-5 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Back to history
              </Link>
            </div>
          </aside>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="font-semibold text-slate-900">Bet not found</p>
          <p className="mt-2 text-sm text-slate-500">
            We could not load this jackpot bet.
          </p>
          <Link
            to="/jackpot/my-bets"
            className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Back to history
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

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900 text-right break-words">{value}</span>
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

export default JackpotBetDetailPage;

