import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { BetsService, getWinLossesByPhone } from "../services/BetsService";

export function useGetBets(page = 1, limit = 10) {
  const {
    data: apiResponse,
    isPending: isLoading,
    error,
    refetch,
  } = useQuery({
    queryFn: () => BetsService(page, limit),
    queryKey: ["bets", page, limit],
    keepPreviousData: true,
    onError: (err) => {
      console.error("Error fetching bets:", err);
      toast.error(err?.message ?? "Something went wrong fetching betting data");
    },
  });

  return {
    bets: apiResponse?.bets || [],
    pagination: {
      currentPage: apiResponse?.page || page,
      pageSize: apiResponse?.limit || limit,
      total: apiResponse?.total || 0,
      totalPages:
        apiResponse?.totalPages || Math.ceil((apiResponse?.total || 0) / limit),
      resultLength: apiResponse?.resultLength || 0,
    },
    isLoading,
    error,
    refetch,
  };
}
export function useGetBetsByPhone() {
  const {
    mutate: searchUserBets,
    isPending: isSearching,
    error: searchError,
    data: searchData,
    reset: resetSearch,
  } = useMutation({
    mutationFn: ({ phone, page, limit }) =>
      getWinLossesByPhone(phone, page, limit),
    keepPreviousData: true,
    onError: (err) => {
      console.error("Error fetching bets:", err);
      toast.error(err?.message ?? "Something went wrong fetching betting data");
    },
  });

  return {
    searchUserBets,
    isSearching,
    searchError,
    searchResults: searchData?.data?.data || [],
    searchPagination: searchData?.data?.pagination || {
      page: 1,
      limit: 10,
      total: 0,
    },
    resetSearch,
  };
}
