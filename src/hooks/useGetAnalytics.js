import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  analyticsServices,
  getMonthlyAnalytics,
  getRecentActivity,
} from "../services/analyticServices";

// How often the "today" view refreshes itself.
export const LIVE_REFRESH_MS = 15000;

export function useGetAnalytics(startDate, endDate, { live = false, enabled = true } = {}) {
  const from = startDate ? new Date(startDate).getTime() : null;
  const to = endDate ? new Date(endDate).getTime() : null;

  const {
    data: analytics,
    isPending: isLoading,
    isFetching,
    error,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryFn: () => analyticsServices({ startDate: from, endDate: to }),
    enabled: enabled && from !== null && to !== null,
    queryKey: ["analyticsServices", from, to],
    refetchInterval: live ? LIVE_REFRESH_MS : false,
    refetchIntervalInBackground: false,
    placeholderData: keepPreviousData,
  });

  return { analytics, isLoading, isFetching, error, refetch, dataUpdatedAt };
}

export function useGetMonthlyAnalytics() {
  const {
    data: monthlyAnalytics,
    isPending: isLoading,
    error,
    refetch,
  } = useQuery({
    queryFn: () => getMonthlyAnalytics(),
    queryKey: ["monthlyAnalytics"],
    staleTime: 5 * 60 * 1000,
  });
  return { monthlyAnalytics, isLoading, error, refetch };
}

export function useRecentActivity({ limit = 30, enabled = true } = {}) {
  const { data = [], isPending: isLoading, error, dataUpdatedAt } = useQuery({
    queryFn: () => getRecentActivity({ limit }),
    queryKey: ["recentActivity", limit],
    enabled,
    refetchInterval: 10000,
    refetchIntervalInBackground: false,
  });
  return { activity: data, isLoading, error, dataUpdatedAt };
}
