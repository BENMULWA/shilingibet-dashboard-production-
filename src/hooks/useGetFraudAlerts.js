import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFraudAlerts,
  getFraudStats,
  resolveFraudAlert,
  getUserFraudProfile,
} from "../services/FraudService";
import toast from "react-hot-toast";

const FRAUD_ENABLED = true;

export function useGetFraudAlerts(page = 1, limit = 20) {
  const {
    data: apiResponse,
    isPending: isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryFn: () => getFraudAlerts(page, limit),
    queryKey: ["fraudAlerts", page, limit],
    enabled: FRAUD_ENABLED,
    onError: (err) => {
      toast.error(err?.message ?? "Something went wrong fetching fraud alerts");
    },
  });

  return {
    alerts: apiResponse?.alerts || [],
    isFetching,
    pagination: {
      currentPage: apiResponse?.pagination?.page || page,
      pageSize: apiResponse?.pagination?.limit || limit,
      total: apiResponse?.pagination?.total || 0,
      totalPages: apiResponse?.pagination?.pages || 0,
    },
    isLoading,
    error,
    refetch,
  };
}

export function useGetFraudStats(days = 7) {
  const {
    data: apiResponse,
    isPending: isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryFn: () => getFraudStats(days),
    queryKey: ["fraudStats", days],
    enabled: FRAUD_ENABLED,
    onError: (err) => {
      toast.error(err?.message ?? "Something went wrong fetching fraud statistics");
    },
  });

  return {
    stats: apiResponse?.data || null,
    isFetching,
    isLoading,
    error,
    refetch,
  };
}

export function useResolveFraudAlert() {
  const queryClient = useQueryClient();

  const { mutate, isPending: isResolving } = useMutation({
    mutationFn: ({ alertId, status, resolutionNotes }) =>
      resolveFraudAlert(alertId, status, resolutionNotes),
    onSuccess: () => {
      toast.success("Fraud alert resolved successfully");
      queryClient.invalidateQueries({ queryKey: ["fraudAlerts"] });
      queryClient.invalidateQueries({ queryKey: ["fraudStats"] });
    },
    onError: (err) => {
      toast.error(err?.message ?? "Failed to resolve fraud alert");
    },
  });

  return {
    resolveAlert: mutate,
    isResolving,
  };
}

export function useGetUserFraudProfile(userId) {
  const {
    data: apiResponse,
    isPending: isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryFn: () => getUserFraudProfile(userId),
    queryKey: ["userFraudProfile", userId],
    enabled: FRAUD_ENABLED && !!userId,
    onError: (err) => {
      toast.error(err?.message ?? "Something went wrong fetching user risk profile");
    },
  });

  return {
    profile: apiResponse?.data || null,
    isFetching,
    isLoading,
    error,
    refetch,
  };
}
