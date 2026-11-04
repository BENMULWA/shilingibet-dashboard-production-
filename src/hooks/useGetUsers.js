import { useEffect } from "react";
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
  });

  // useQuery no longer accepts onError in React Query v5, so surface errors here.
  useEffect(() => {
    if (error) toast.error(error.message ?? "Something went wrong fetching players", { id: "users-error" });
  }, [error]);

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
