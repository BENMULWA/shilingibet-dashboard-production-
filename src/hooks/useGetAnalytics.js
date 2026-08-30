import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  analyticsServices,
  getMonthlyAnalytics,
} from "../services/analyticServices";
import toast from "react-hot-toast";

export function useGetAnalytics(startDate, endDate) {
  const {
    data: analytics,
    isPending: isLoading,
    error,
    refetch,
  } = useQuery({
    queryFn: () => {
      const start = format(new Date(startDate), "yyyy-MM-dd");
      const end = format(new Date(endDate), "yyyy-MM-dd");

      return analyticsServices({ startDate: start, endDate: end });
    },
    enabled: !!startDate && !!endDate,
    queryKey: ["analyticsServices", startDate, endDate],
    onError: (err) => {
      toast.error(
        err?.message ?? "Something went wrong fetching your analytics"
      );
    },
  });

  return { analytics, isLoading, error, refetch };
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
    onError: (error) => {
      toast.error(
        error?.message ?? "Something went wrong fetching your monthly analytics"
      );
    },
  });
  return { monthlyAnalytics, isLoading, error, refetch };
}
