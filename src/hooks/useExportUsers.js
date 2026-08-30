import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { exportUsers } from "../services/userServices";

export function useExportUsers() {
  const { mutate: exportMutation, isPending: isLoading } = useMutation({
    mutationFn: ({ start, end }) => exportUsers(start, end),
    onSuccess: (data) => {
      toast.success(data?.message);
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to export users");
    },
  });
  return { exportMutation, isLoading };
}
