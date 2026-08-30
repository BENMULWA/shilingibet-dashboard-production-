import { useMutation, useQueryClient } from "@tanstack/react-query";
import { pauseDeposit } from "../services/UsersActions";
import toast from "react-hot-toast";

export function usePauseDeposit() {
  const queryClient = useQueryClient();

  const { mutate: pauseDepositFn, isPending: isLoading } = useMutation({
    mutationFn: pauseDeposit,
    onSuccess: () => {
      toast.success("Deposit status updated successfully");
      queryClient.invalidateQueries(["users"]); // This will refresh the users list
    },
    onError: (err) => {
      console.error("Pause deposit error:", err);
      toast.error(err.message || "Failed to update deposit status");
    },
  });

  return { pauseDepositFn, isLoading };
}
