import { useQuery } from "@tanstack/react-query";
import { cashbacksService } from "../services/CashbackService";

export function useCashbacks(page, limit, phone = "") {
  return useQuery({
    queryKey: ["cashbacks", page, limit, phone],
    queryFn: () => cashbacksService(page, limit, phone),
  });
}
