import { useQuery } from "@tanstack/react-query";
import {
  getAuditLogs,
  getAuditLogsByDate,
  getAuditDates,
  getAuditStats,
  getAuditLogsByUser,
} from "../services/AuditService";
import toast from "react-hot-toast";

export function useGetAuditLogs(page = 1, limit = 10) {
  const {
    data: apiResponse,
    isPending: isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryFn: () => getAuditLogs(page, limit),
    queryKey: ["auditLogs", page, limit],
    onError: (err) => {
      toast.error(err?.message ?? "Something went wrong fetching audit logs");
    },
  });

  return {
    logs: apiResponse?.data?.logs || [],
    pagination: {
      currentPage: apiResponse?.data?.page || page,
      pageSize: apiResponse?.data?.limit || limit,
      total: apiResponse?.data?.total || 0,
      totalPages: apiResponse?.data?.totalPages || 0,
    },
    isLoading,
    isFetching,
    error,
    refetch,
  };
}

export function useGetAuditLogsByDate(date, page = 1, limit = 20) {
  const {
    data: apiResponse,
    isPending: isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryFn: () => getAuditLogsByDate(date),
    queryKey: ["auditLogsByDate", date],
    enabled: !!date,
    onError: (err) => {
      toast.error(err?.message ?? "Something went wrong fetching audit logs for date");
    },
  });

  // Client-side pagination since API returns all logs for the date
  const allLogs = apiResponse?.data?.logs || [];
  const total = allLogs.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedLogs = allLogs.slice(startIndex, endIndex);

  return {
    logs: paginatedLogs,
    allLogs: allLogs,
    date: apiResponse?.data?.date || date,
    count: apiResponse?.data?.count || 0,
    pagination: {
      currentPage: page,
      pageSize: limit,
      total: total,
      totalPages: totalPages,
    },
    isLoading,
    isFetching,
    error,
    refetch,
  };
}

export function useGetAuditDates() {
  const {
    data: apiResponse,
    isPending: isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryFn: () => getAuditDates(),
    queryKey: ["auditDates"],
    onError: (err) => {
      toast.error(err?.message ?? "Something went wrong fetching audit dates");
    },
  });

  return {
    dates: apiResponse?.data?.dates || [],
    count: apiResponse?.data?.count || 0,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}

export function useGetAuditStats() {
  const {
    data: apiResponse,
    isPending: isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryFn: () => getAuditStats(),
    queryKey: ["auditStats"],
    onError: (err) => {
      toast.error(err?.message ?? "Something went wrong fetching audit statistics");
    },
  });

  return {
    stats: apiResponse?.data || null,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}

export function useGetAuditLogsByUser(userId, page = 1, limit = 10) {
  const {
    data: apiResponse,
    isPending: isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryFn: () => getAuditLogsByUser(userId, page, limit),
    queryKey: ["auditLogsByUser", userId, page, limit],
    enabled: !!userId,
    onError: (err) => {
      toast.error(err?.message ?? "Something went wrong fetching user audit logs");
    },
  });

  return {
    logs: apiResponse?.data?.logs || [],
    pagination: {
      currentPage: apiResponse?.data?.page || page,
      pageSize: apiResponse?.data?.limit || limit,
      total: apiResponse?.data?.total || 0,
      totalPages: apiResponse?.data?.totalPages || 0,
    },
    isLoading,
    isFetching,
    error,
    refetch,
  };
}
