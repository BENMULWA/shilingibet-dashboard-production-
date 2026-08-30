import moment from "moment";

export const jackpotQueryKeys = {
  activeDraw: ["jackpot-active-draw"],
  recentResults: (limit = 10) => ["jackpot-recent-results", limit],
  drawResults: (drawId) => ["jackpot-draw-results", drawId],
  winners: (drawId) => ["jackpot-winners", drawId],
  myBets: (page = 1, limit = 20) => ["jackpot-my-bets", page, limit],
  myBetDetail: (betId) => ["jackpot-my-bet-detail", betId],
  myBetByDraw: (drawId) => ["jackpot-my-bet-by-draw", drawId],
};

export const JACKPOT_PICK_OPTIONS = [
  { value: "H", label: "Home" },
  { value: "D", label: "Draw" },
  { value: "A", label: "Away" },
];

export function formatJackpotDate(value, pattern = "MMM DD, YYYY - hh:mm A") {
  if (!value) return "--";
  const parsed = moment(value);
  return parsed.isValid() ? parsed.format(pattern) : "--";
}

export function getJackpotToken() {
  try {
    const user = JSON.parse(sessionStorage.getItem("user"));
    return user?.token ?? null;
  } catch {
    return null;
  }
}

export function getJackpotUser() {
  try {
    return JSON.parse(sessionStorage.getItem("user"));
  } catch {
    return null;
  }
}

export function getJackpotData(response) {
  return (
    response?.data ??
    response?.result ??
    response?.results ??
    response?.draw ??
    response?.bet ??
    response?.jackpot ??
    response?.payload ??
    response
  );
}

export function getJackpotArray(response) {
  const data = getJackpotData(response);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.docs)) return data.docs;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.bets)) return data.bets;
  if (Array.isArray(data?.winners)) return data.winners;
  if (Array.isArray(data?.entries)) return data.entries;
  return [];
}

export function normalizeJackpotPick(value) {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase();
  return JACKPOT_PICK_OPTIONS.some((pick) => pick.value === normalized)
    ? normalized
    : "";
}

export function isValidJackpotPick(value) {
  return JACKPOT_PICK_OPTIONS.some((pick) => pick.value === value);
}

export function normalizeJackpotMatch(match, index = 0) {
  if (!match) return null;
  const matchNumber =
    match.matchNumber ??
    match.matchNo ??
    match.match_number ??
    match.number ??
    match.index ??
    index + 1;

  return {
    id: match.id ?? match._id ?? `${matchNumber}-${index}`,
    matchNumber,
    homeTeam:
      match.homeTeam ?? match.home_team ?? match.home ?? match.team1 ?? "--",
    awayTeam:
      match.awayTeam ?? match.away_team ?? match.away ?? match.team2 ?? "--",
    kickoffTime:
      match.kickoffTime ??
      match.kickoff_time ??
      match.startTime ??
      match.start_time ??
      match.time ??
      null,
    result: normalizeJackpotPick(match.result ?? match.outcome ?? match.score),
    userPick: normalizeJackpotPick(
      match.userPick ?? match.pick ?? match.selection
    ),
    isCorrect:
      typeof match.isCorrect === "boolean"
        ? match.isCorrect
        : match.correct == null
          ? null
          : Boolean(match.correct),
  };
}

export function normalizeJackpotMatches(matches) {
  if (!Array.isArray(matches)) return [];
  return matches.map(normalizeJackpotMatch).filter(Boolean);
}

export function normalizePrizeTiers(prizeTiers) {
  if (!prizeTiers) return [];

  if (Array.isArray(prizeTiers)) {
    return prizeTiers
      .map((tier, index) => {
        if (!tier) return null;
        if (typeof tier === "string") {
          return {
            label: `Tier ${index + 1}`,
            value: tier,
          };
        }

        return {
          label:
            tier.label ??
            tier.name ??
            tier.position ??
            tier.rank ??
            `Tier ${index + 1}`,
          value:
            tier.value ??
            tier.prize ??
            tier.amount ??
            tier.payout ??
            tier.total ??
            "--",
          winners: tier.winners ?? tier.count ?? tier.size ?? null,
        };
      })
      .filter(Boolean);
  }

  if (typeof prizeTiers === "object") {
    return Object.entries(prizeTiers).map(([label, value]) => {
      if (value && typeof value === "object") {
        return {
          label,
          value: value.value ?? value.prize ?? value.amount ?? "--",
          winners: value.winners ?? value.count ?? value.size ?? null,
        };
      }

      return {
        label,
        value,
      };
    });
  }

  return [];
}

export function normalizeJackpotDraw(draw) {
  if (!draw) return null;
  if (Array.isArray(draw)) return normalizeJackpotDraw(draw[0]);

  const matches = normalizeJackpotMatches(
    draw.matches ?? draw.games ?? draw.fixtures ?? draw.matchResults ?? []
  );
  const prizeTiers = normalizePrizeTiers(
    draw.prizeTiers ?? draw.prizes ?? draw.tiers ?? draw.prize_tiers
  );

  return {
    id: draw.id ?? draw._id ?? draw.drawId ?? draw.draw_id ?? null,
    drawNumber:
      draw.drawNumber ?? draw.draw_no ?? draw.drawNo ?? draw.number ?? "--",
    drawDay: draw.drawDay ?? draw.day ?? draw.draw_day ?? "--",
    closeTime:
      draw.closeTime ?? draw.close_time ?? draw.closesAt ?? draw.endsAt ?? null,
    settlementTime:
      draw.settlementTime ??
      draw.settledAt ??
      draw.settled_at ??
      draw.resultTime ??
      null,
    betAmount:
      draw.betAmount ?? draw.amount ?? draw.stake ?? draw.entryFee ?? null,
    totalBets: draw.totalBets ?? draw.total_bets ?? draw.betsCount ?? 0,
    totalPaidOut:
      draw.totalPaidOut ?? draw.total_payout ?? draw.paidOut ?? 0,
    status: draw.status ?? draw.state ?? "open",
    prizeTiers,
    matches,
    winners: Array.isArray(draw.winners) ? draw.winners : [],
  };
}

export function normalizeJackpotBet(bet) {
  if (!bet) return null;
  if (Array.isArray(bet)) return normalizeJackpotBet(bet[0]);

  const matches = normalizeJackpotMatches(
    bet.matches ?? bet.matchDetails ?? bet.picks ?? bet.selections ?? bet.entries ?? []
  );

  return {
    id: bet.id ?? bet._id ?? bet.betId ?? bet.bet_id ?? null,
    drawId: bet.drawId ?? bet.draw_id ?? bet.draw?.id ?? null,
    drawNumber:
      bet.drawNumber ?? bet.draw_no ?? bet.drawNo ?? bet.draw?.drawNumber ?? "--",
    score: bet.score ?? bet.correct ?? bet.correctCount ?? 0,
    prize: bet.prize ?? bet.reward ?? bet.winAmount ?? bet.payout ?? 0,
    payoutStatus:
      bet.payoutStatus ??
      bet.status ??
      bet.paymentStatus ??
      (bet.prize || bet.payout ? "paid" : "pending"),
    createdAt: bet.createdAt ?? bet.created_at ?? bet.timestamp ?? null,
    totalMatches: bet.totalMatches ?? bet.matchCount ?? matches.length,
    matches,
  };
}

export function normalizeJackpotBetList(response) {
  return getJackpotArray(response).map(normalizeJackpotBet).filter(Boolean);
}

export function formatJackpotScore(score, totalMatches = 7) {
  if (score == null) return `0/${totalMatches}`;
  return `${score}/${totalMatches}`;
}
