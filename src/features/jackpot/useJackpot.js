import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getActiveJackpotDraw,
  getJackpotDrawResult,
  getJackpotMyBetByDraw,
  getJackpotMyBetDetail,
  getJackpotMyBets,
  getJackpotRecentResults,
  getJackpotWinners,
  placeJackpotBet,
} from "./JackpotService";
import {
  jackpotQueryKeys,
  getJackpotData,
  getJackpotArray,
  normalizeJackpotDraw,
  normalizeJackpotBet,
  normalizeJackpotBetList,
} from "./jackpotUtils";

const JACKPOT_ENABLED = false;

export function useJackpotActiveDraw() {
  const query = useQuery({
    queryKey: jackpotQueryKeys.activeDraw,
    queryFn: getActiveJackpotDraw,
    enabled: JACKPOT_ENABLED,
  });

  return {
    ...query,
    activeDraw: normalizeJackpotDraw(getJackpotData(query.data)),
  };
}

export function useJackpotRecentResults(limit = 10) {
  const query = useQuery({
    queryKey: jackpotQueryKeys.recentResults(limit),
    queryFn: () => getJackpotRecentResults(limit),
    enabled: JACKPOT_ENABLED,
    keepPreviousData: true,
  });

  return {
    ...query,
    results: getJackpotArray(query.data).map(normalizeJackpotDraw),
  };
}

export function useJackpotDrawDetail(drawId) {
  const query = useQuery({
    queryKey: jackpotQueryKeys.drawResults(drawId),
    queryFn: () => getJackpotDrawResult(drawId),
    enabled: JACKPOT_ENABLED && Boolean(drawId),
  });

  return {
    ...query,
    draw: normalizeJackpotDraw(getJackpotData(query.data)),
  };
}

export function useJackpotWinners(drawId) {
  const query = useQuery({
    queryKey: jackpotQueryKeys.winners(drawId),
    queryFn: () => getJackpotWinners(drawId),
    enabled: JACKPOT_ENABLED && Boolean(drawId),
  });

  return {
    ...query,
    winners: getJackpotArray(query.data),
  };
}

export function useJackpotMyBets(page = 1, limit = 20) {
  const query = useQuery({
    queryKey: jackpotQueryKeys.myBets(page, limit),
    queryFn: () => getJackpotMyBets(page, limit),
    enabled: JACKPOT_ENABLED,
    keepPreviousData: true,
  });

  const data = getJackpotData(query.data);
  const bets = normalizeJackpotBetList(query.data);

  return {
    ...query,
    bets,
    pagination: {
      currentPage: data?.page ?? page,
      pageSize: data?.limit ?? limit,
      total: data?.total ?? bets.length,
      totalPages:
        data?.totalPages ?? Math.ceil((data?.total ?? bets.length) / limit),
    },
  };
}

export function useJackpotMyBetDetail(betId) {
  const query = useQuery({
    queryKey: jackpotQueryKeys.myBetDetail(betId),
    queryFn: () => getJackpotMyBetDetail(betId),
    enabled: JACKPOT_ENABLED && Boolean(betId),
  });

  return {
    ...query,
    bet: normalizeJackpotBet(getJackpotData(query.data)),
  };
}

export function useJackpotMyBetByDraw(drawId) {
  const query = useQuery({
    queryKey: jackpotQueryKeys.myBetByDraw(drawId),
    queryFn: () => getJackpotMyBetByDraw(drawId),
    enabled: JACKPOT_ENABLED && Boolean(drawId),
  });

  return {
    ...query,
    bet: normalizeJackpotBet(getJackpotData(query.data)),
  };
}

export function usePlaceJackpotBet() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: placeJackpotBet,
    onSuccess: async (data) => {
      toast.success(data?.message || "Jackpot bet placed successfully");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: jackpotQueryKeys.activeDraw }),
        queryClient.invalidateQueries({ queryKey: ["jackpot-recent-results"] }),
        queryClient.invalidateQueries({ queryKey: ["jackpot-my-bets"] }),
        queryClient.invalidateQueries({ queryKey: ["jackpot-my-bet-by-draw"] }),
        queryClient.invalidateQueries({ queryKey: ["secondaryWallet"] }),
      ]);
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to place jackpot bet");
    },
  });

  return {
    placeJackpotBet: mutation.mutate,
    placeJackpotBetAsync: mutation.mutateAsync,
    isPlacingBet: mutation.isPending,
  };
}
