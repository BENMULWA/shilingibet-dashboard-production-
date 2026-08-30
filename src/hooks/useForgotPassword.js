import { useMutation } from "@tanstack/react-query";
import { forgotPassword } from "../services/AuthServices";
import toast from "react-hot-toast";

export function useForgotPassword() {
  const {
    mutate: forgotPasswordAPI,
    isPending,
    error,
  } = useMutation({
    mutationFn: (phone) => forgotPassword(phone),
    onSuccess: () => {
      toast.success("If the account exists, a reset code has been sent");
    },
    onError: (err) => {
      toast.error(err?.message || "Unable to request a reset code");
    },
  });

  return { forgotPasswordAPI, isPending, error };
}
