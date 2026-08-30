import { Link } from "react-router-dom";
import Loader from "../../components/Loader";
import JackpotPageShell from "./JackpotPageShell";
import { useJackpotMyBets } from "./useJackpot";
import { formatJackpotDate, formatJackpotScore } from "./jackpotUtils";
import { useFormatCurrency } from "../../hooks/useFormatCurrency";

function JackpotHistoryPage() {
  const { formatCurrency } = useFormatCurrency();
  const { bets, isPending } = useJackpotMyBets(1, 20);

  return (
    <JackpotPageShell
      title="My Bets"
      subtitle="Track your jackpot entries, score, prize amounts, and payout status."
    >
      {isPending ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8">
          <Loader />
        </div>
      ) : bets.length ? (
        <div className="grid gap-4">
          {bets.map((bet) => (
            <Link
              key={bet.id}
              to={`/jackpot/my-bets/${bet.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50/40"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm text-slate-500">Draw #{bet.drawNumber}</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">
                    {formatJackpotDate(bet.createdAt)}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Score {formatJackpotScore(bet.score, bet.totalMatches || 7)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <InfoPill label="Prize" value={formatCurrency(bet.prize ?? 0)} />
                  <InfoPill label="Payout" value={bet.payoutStatus || "--"} />
                  <InfoPill label="Matches" value={String(bet.totalMatches ?? 7)} />
                  <InfoPill label="Bet ID" value={String(bet.id)} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="font-semibold text-slate-900">You have no jackpot bets yet</p>
          <p className="mt-2 text-sm text-slate-500">
            Place your first bet from the active jackpot draw.
          </p>
          <Link
            to="/jackpot"
            className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Open Jackpot
          </Link>
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

export default JackpotHistoryPage;

