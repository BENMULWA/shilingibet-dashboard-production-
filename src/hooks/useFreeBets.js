import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  createFreeBetCampaign,
  getFreeBetCampaigns,
  getVirtualGames,
  updateFreeBetCampaignStatus,
  getFreeBetUsers,
  awardFreeBets,
  getFreeBetAwards,
  revokeFreeBet,
} from "../services/FreeBetService";

export function useFreeBetCampaigns(filters) {
  return useQuery({
    queryKey: ["free-bet-campaigns", filters],
    queryFn: () => getFreeBetCampaigns(filters),
  });
}

export function useFreeBetAwards(filters) {
  return useQuery({
    queryKey: ["free-bet-awards", filters],
    queryFn: () => getFreeBetAwards(filters),
  });
}

export function useRevokeFreeBet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeFreeBet,
    onSuccess: () => {
      toast.success("Free bet revoked successfully");
      queryClient.invalidateQueries({ queryKey: ["free-bet-awards"] });
      queryClient.invalidateQueries({ queryKey: ["free-bet-audit"] });
    },
    onError: (error) => toast.error(error?.message || "Unable to revoke free bet"),
  });
}

export function useFreeBetUsers(filters, enabled = true) {
  return useQuery({
    queryKey: ["free-bet-users", filters],
    queryFn: () => getFreeBetUsers(filters),
    enabled,
  });
}

export function useAwardFreeBets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: awardFreeBets,
    onSuccess: () => {
      toast.success("Free bets awarded successfully");
      queryClient.invalidateQueries({ queryKey: ["free-bet-awards"] });
      queryClient.invalidateQueries({ queryKey: ["free-bet-audit"] });
    },
    onError: (error) => toast.error(error?.message || "Unable to award free bets"),
  });
}

export function useVirtualGames() {
  return useQuery({
    queryKey: ["virtual-games", "free-bet-campaign-form"],
    queryFn: getVirtualGames,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateFreeBetCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFreeBetCampaign,
    onSuccess: () => {
      toast.success("Free-bet campaign created");
      queryClient.invalidateQueries({ queryKey: ["free-bet-campaigns"] });
    },
    onError: (error) => toast.error(error?.message || "Unable to create campaign"),
  });
}

export function useUpdateFreeBetCampaignStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateFreeBetCampaignStatus,
    onSuccess: () => {
      toast.success("Campaign status updated");
      queryClient.invalidateQueries({ queryKey: ["free-bet-campaigns"] });
    },
    onError: (error) => toast.error(error?.message || "Unable to update campaign"),
  });
}
