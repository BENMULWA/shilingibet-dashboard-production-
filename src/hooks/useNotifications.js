import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/notificationService";

export function useNotifications(enabled = true) {
  const queryClient = useQueryClient();

  const { data, isPending: isLoading } = useQuery({
    queryFn: () => listNotifications({ limit: 15 }),
    queryKey: ["notifications"],
    enabled,
    refetchInterval: enabled ? 30000 : false,
    refetchIntervalInBackground: false,
  });

  const { mutate: markRead } = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const { mutate: markAllRead } = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return {
    notifications: data?.data?.items || [],
    unreadCount: data?.data?.unreadCount || 0,
    isLoading,
    markRead,
    markAllRead,
  };
}
