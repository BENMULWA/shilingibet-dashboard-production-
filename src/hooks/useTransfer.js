import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSecondaryWallet,
  transferSecondaryWallet,
} from "../services/paymentService";
import toast from "react-hot-toast";

export function useTransferSecondaryWallet() {
  const queryClient = useQueryClient();
  const {
    mutate: transferSecondaryWalletFn,
    isPending: isLoading,
    error,
  } = useMutation({
    mutationFn: (amount) => transferSecondaryWallet(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secondaryWallet"] });
      toast.success("Withdrawal treasury funded");
    },
    onError: (err) => {
      toast.error(err?.message || "Something went wrong, Try again");
    },
  });
  return { transferSecondaryWalletFn, isLoading, error };
}
export function useGetSecondaryWallet(enabled = true, { live = false } = {}) {
  const {
    data: secondaryWalletBalance,
    isPending: isLoading,
    error,
  } = useQuery({
    queryFn: getSecondaryWallet,
    queryKey: ["secondaryWallet"],
    enabled,
    refetchInterval: live ? 15000 : false,
    refetchIntervalInBackground: false,
    onError: (error) => {
      toast.error(
        error?.message ??
          "Something went wrong fetching secondary wallet balance"
      );
    },
  });
  return { secondaryWalletBalance, isLoading, error };
}
