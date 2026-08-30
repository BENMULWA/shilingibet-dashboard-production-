import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { resetPassword } from "../services/AuthServices";

export function useResetPassword() {
  const {
    mutate: resetPasswordAPI,
    isPending,
    error,
  } = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      toast.success("Password reset was successful");
    },
    onError: (error) => {
      toast.error(error?.message || "Unable to reset password");
    },
  });

  return { resetPasswordAPI, isPending, error };
}
