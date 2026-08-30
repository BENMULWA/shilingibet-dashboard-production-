import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  createEvent,
  cancelEvent,
  createVirtualShortcode,
  creditUserWallet,
  settleEvent,
} from "../services/AdminServices";

function useToastMutation(mutationFn, successMessage) {
  const { mutate, isPending } = useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(successMessage);
    },
    onError: (error) => {
      toast.error(error?.message || "Something went wrong");
    },
  });

  return { mutate, isPending };
}

export function useCreditUserWallet() {
  const { mutate, isPending } = useToastMutation(
    creditUserWallet,
    "Wallet credited successfully"
  );

  return { creditUserWalletFn: mutate, isLoading: isPending };
}

export function useCreateEvent() {
  const { mutate, isPending } = useToastMutation(
    createEvent,
    "Event created successfully"
  );

  return { createEventFn: mutate, isLoading: isPending };
}

export function useSettleEvent() {
  const { mutate, isPending } = useToastMutation(
    settleEvent,
    "Event settled successfully"
  );

  return { settleEventFn: mutate, isLoading: isPending };
}

export function useCancelEvent() {
  const { mutate, isPending } = useToastMutation(
    cancelEvent,
    "Event cancelled and open bets refunded"
  );

  return { cancelEventFn: mutate, isLoading: isPending };
}

export function useCreateVirtualShortcode() {
  const { mutate, isPending } = useToastMutation(
    createVirtualShortcode,
    "Virtual shortcode created successfully"
  );

  return { createVirtualShortcodeFn: mutate, isLoading: isPending };
}
