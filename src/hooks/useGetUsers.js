import { useQuery } from "@tanstack/react-query";
import { userServices } from "../services/userServices";
import toast from "react-hot-toast";

export function useGetUsers(page = 1, limit = 10) {
  const {
    data: apiResponse,
    isPending: isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryFn: () => userServices(page, limit),
    queryKey: ["users", page, limit],
    onError: (err) => {
      toast.error(err?.message ?? "Something went wrong fetching your history");
    },
  });

  return {
    users: apiResponse?.users || [],
    isFetching,
    pagination: {
      currentPage: apiResponse?.page || page,
      pageSize: apiResponse?.limit || limit,
      total: apiResponse?.total || 0,
      totalPages: apiResponse?.totalPages || 0,
      resultLength: apiResponse?.resultLength || 0,
    },
    isLoading,
    error,
    refetch,
  };
}
