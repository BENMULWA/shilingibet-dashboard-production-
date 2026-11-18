import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSecondaryWallet,
  transferSecondaryWallet,
} from "../services/paymentService";
import toast from "react-hot-toast";

// The payout float moves every time a player withdraws (the amount is
// reserved the moment they ask), so it refreshes on its own wherever it shows.
export const FLOAT_REFRESH_MS = 15000;

export function useTransferSecondaryWallet() {
  const queryClient = useQueryClient();
  const {
    mutate: transferSecondaryWalletFn,
    isPending: isLoading,
    error,
  } = useMutation({
    // Receives { amount, idempotencyKey }
    mutationFn: transferSecondaryWallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secondaryWallet"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["treasury-movements"] });
      toast.success("Withdrawal treasury funded");
    },
    onError: (err) => {
      toast.error(err?.message || "Something went wrong, Try again");
    },
  });
  return { transferSecondaryWalletFn, isLoading, error };
}

export function useGetSecondaryWallet(enabled = true) {
  const {
    data: secondaryWalletBalance,
    isPending,
    isFetching,
    error,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryFn: getSecondaryWallet,
    queryKey: ["secondaryWallet"],
    enabled,
    refetchInterval: FLOAT_REFRESH_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  // React Query v5 no longer calls an onError passed to useQuery, so a failed
  // load used to show the float as KES 0 with no hint that anything was wrong.
  const lastToast = useRef("");
  useEffect(() => {
    const message = error?.message;
    if (!message || message === lastToast.current) return;
    lastToast.current = message;
    toast.error(`Payout float: ${message}`, { id: "payout-float-error" });
  }, [error]);

  return {
    secondaryWalletBalance,
    // A disabled query stays "pending" forever; only report loading while it can load.
    isLoading: enabled && isPending,
    isFetching,
    error,
    refetch,
    dataUpdatedAt,
  };
}
