import { useMutation } from "@tanstack/react-query";
import { getUserByPhone } from "../services/userServices";
import toast from "react-hot-toast";

export function useGetUserByPhone() {
  const {
    mutate: searchUser,
    isPending: isSearching,
    error: searchError,
    data: searchData,
    reset: resetSearch,
  } = useMutation({
    mutationFn: ({ phone }) => getUserByPhone(phone),
    onError: (error) => {
      toast.error(error?.message ?? "Search failed");
    },
  });

  return {
    searchUser,
    isSearching,
    searchError,
    searchResults: searchData?.user || null,
    resetSearch,
  };
}
