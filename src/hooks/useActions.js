import { useMutation } from "@tanstack/react-query";
import { handleAction } from "../services/resuableFn";
import { getUserByPhone } from "../services/userServices";

export function useActions() {
  const {
    mutate: handlingActionApi,
    isPending: isLoading,
    error,
  } = useMutation({
    mutationFn: (index) => handleAction(index),
  });

  return { handlingActionApi, isLoading, error };
}
