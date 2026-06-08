import useSWR from "swr";

export type LiveNotification = {
  id: number;
  user_id: string | null;
  title: string;
  description: string | null;
  read: number;
  created_at: string;
};

export type LiveNotificationsResponse = {
  success: boolean;
  unreadNotifications: number;
  pendingComments: number;
  notifications: LiveNotification[];
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useLiveNotifications() {
  const { data, error, isLoading, mutate } = useSWR<LiveNotificationsResponse>(
    "/api/notifications/live",
    fetcher,
    {
      refreshInterval: 10000, // Poll every 10 seconds
      revalidateOnFocus: true, // Revalidate when user re-focuses tab
    }
  );

  const markAllAsRead = async () => {
    try {
      // Optimistic local state update
      if (data) {
        mutate(
          {
            ...data,
            unreadNotifications: 0,
            notifications: data.notifications.map((n) => ({ ...n, read: 1 })),
          },
          { revalidate: false }
        );
      }

      const res = await fetch("/api/notifications/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to mark notifications as read");
      }

      // Revalidate to ensure DB state matches
      mutate();
    } catch (err) {
      console.error("[useLiveNotifications] failed to mark notifications as read:", err);
      // Revert optimistic update
      mutate();
    }
  };

  return {
    unreadNotifications: data?.unreadNotifications ?? 0,
    pendingComments: data?.pendingComments ?? 0,
    notifications: data?.notifications ?? [],
    isLoading,
    error,
    markAllAsRead,
    mutate,
  };
}
