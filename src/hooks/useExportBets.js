import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { exportBets } from "../services/BetsService";

export function useExportBets() {
  return useMutation({
    mutationFn: ({ start, end }) => exportBets(start, end),
    onSuccess: (data) => {
      toast.success(data?.message);
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to export users");
    },
  });
}
