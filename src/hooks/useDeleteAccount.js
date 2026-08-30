import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteAccount } from "../services/UsersActions";
import toast from "react-hot-toast";

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  const { mutate: deleteAccountFn, isPending: isLoading } = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      toast.success("Account deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => {
      toast.error(err.message || "Account could not be deleted");
    },
  });
  return { deleteAccountFn, isLoading };
}
