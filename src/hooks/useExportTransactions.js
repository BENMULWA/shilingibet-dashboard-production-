import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { exportTransactions } from "../services/transactionsService";

export function useExportTransactions() {
  return useMutation({
    mutationFn: ({ start, end }) => exportTransactions(start, end),
    onSuccess: (data) => {
      toast.success(data?.message);
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to export users");
    },
  });
}
