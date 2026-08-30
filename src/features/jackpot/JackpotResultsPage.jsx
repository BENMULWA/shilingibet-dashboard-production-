import { Link } from "react-router-dom";
import Loader from "../../components/Loader";
import JackpotPageShell from "./JackpotPageShell";
import { useJackpotRecentResults } from "./useJackpot";
import { formatJackpotDate } from "./jackpotUtils";
import { useFormatCurrency } from "../../hooks/useFormatCurrency";

function JackpotResultsPage() {
  const { formatCurrency } = useFormatCurrency();
  const { results, isPending } = useJackpotRecentResults(10);

  return (
    <JackpotPageShell
      title="Results"
      subtitle="Review the latest settled jackpot draws and jump into any draw for the full breakdown."
    >
      {isPending ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8">
          <Loader />
        </div>
      ) : results.length ? (
        <div className="grid gap-4">
          {results.map((result) => (
            <Link
              key={result.id || result.drawNumber}
              to={`/jackpot/results/${result.id || result.drawNumber}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-transform hover:-translate-y-0.5 hover:border-amber-300"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm text-slate-500">Draw #{result.drawNumber}</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">
                    {result.drawDay}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Settled {formatJackpotDate(result.settlementTime)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <InfoPill label="Total bets" value={String(result.totalBets ?? 0)} />
                  <InfoPill label="Paid out" value={formatCurrency(result.totalPaidOut ?? 0)} />
                  <InfoPill label="Prize tiers" value={String((result.prizeTiers || []).length)} />
                  <InfoPill label="Draw ID" value={String(result.id || "--")} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="font-semibold text-slate-900">No recent results yet</p>
          <p className="mt-2 text-sm text-slate-500">
            Once draws are settled, they will appear here.
          </p>
        </div>
      )}
    </JackpotPageShell>
  );
}

function InfoPill({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default JackpotResultsPage;

