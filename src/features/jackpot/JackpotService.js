import { fetchAPI } from "../../utils/fetchRequest";
import { getJackpotToken } from "./jackpotUtils";

function requireToken() {
  const token = getJackpotToken();
  if (!token) {
    throw new Error("You need to be logged in to use Jackpot");
  }
  return token;
}

export async function getActiveJackpotDraw() {
  const token = requireToken();
  return fetchAPI("jackpot/active", "GET", null, token);
}

export async function placeJackpotBet(payload) {
  const token = requireToken();
  return fetchAPI("jackpot/bet", "POST", payload, token);
}

export async function getJackpotRecentResults(limit = 10) {
  const token = requireToken();
  return fetchAPI(`jackpot/results?limit=${limit}`, "GET", null, token);
}

export async function getJackpotDrawResult(drawId) {
  const token = requireToken();
  return fetchAPI(`jackpot/results/${drawId}`, "GET", null, token);
}

export async function getJackpotWinners(drawId) {
  const token = requireToken();
  return fetchAPI(`jackpot/winners/${drawId}`, "GET", null, token);
}

export async function getJackpotMyBets(page = 1, limit = 20) {
  const token = requireToken();
  return fetchAPI(`jackpot/my-bets?page=${page}&limit=${limit}`, "GET", null, token);
}

export async function getJackpotMyBetDetail(betId) {
  const token = requireToken();
  return fetchAPI(`jackpot/my-bets/bet/${betId}`, "GET", null, token);
}

export async function getJackpotMyBetByDraw(drawId) {
  const token = requireToken();
  return fetchAPI(`jackpot/my-bets/${drawId}`, "GET", null, token);
}

