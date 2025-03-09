"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { fetchWithAuth } from "@/lib/auth";
import { useUser } from "@/contexts/user-context";

// Types for notifications
type Notification = {
  id: number;
  message: string;
  read: boolean;
  time: string;
};

// Initial notifications - will be replaced with real data from API
const initialNotifications: Notification[] = [];

/**
 * NotificationMenu component handles notification display and interactions
 * @param {Object} props - Component props
 * @param {Function} props.onNotificationClick - Callback when notification is clicked
 */
export function NotificationMenu() {
  // State management for notifications and connection status
  const [notifications, setNotifications] = React.useState<Notification[]>(initialNotifications);
  const { notificationSocket, isNotificationConnected } = useUser();

  // Function to fetch existing notifications from the API
  const fetchNotifications = async () => {
    try {
      const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/`);
      if (response.ok) {
        const data = await response.json();
        // Transform API data to our notification format
        const formattedNotifications = data.map(
          (item: { id: number; message: string; is_read: boolean; created_at: string }) => ({
            id: item.id,
            message: item.message,
            read: item.is_read,
            time: formatDistanceToNow(new Date(item.created_at), { addSuffix: true }),
          })
        );
        setNotifications(formattedNotifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Fetch notifications when component mounts or when connection status changes
  useEffect(() => {
    if (isNotificationConnected) {
      fetchNotifications();
    }
  }, [isNotificationConnected]);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!notificationSocket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "notification") {
          // Add new notification to the list
          const newNotification = {
            id: data.notification_id,
            message: data.message,
            read: false,
            time: "Just now",
          };

          setNotifications((prev) => [newNotification, ...prev]);

          // Show toast for new notification
          toast.info("New notification received");
        }
      } catch (error) {
        console.error("Error processing websocket message:", error);
      }
    };

    notificationSocket.addEventListener("message", handleMessage);

    return () => {
      notificationSocket.removeEventListener("message", handleMessage);
    };
  }, [notificationSocket]);

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // Update UI immediately for better UX
      setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));

      // Call API to mark notifications as read
      const response = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/mark_all_read/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        toast.success("All notifications marked as read");
      } else {
        // Revert UI change if API call fails
        await fetchNotifications();
        toast.error("Failed to mark notifications as read");
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      toast.error("Failed to mark notifications as read");
    }
  };

  const handleMarkAsRead = async (notification: Notification) => {
    try {
      // Update UI immediately for better UX
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );

      // Call API to mark notification as read
      const response = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notification.id}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        // Revert UI change if API call fails
        await fetchNotifications();
        toast.error("Failed to mark notification as read");
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative aspect-square h-9 rounded-full text-primary-foreground hover:bg-primary-foreground hover:text-primary dark:text-slate-300 dark:hover:bg-primary">
          <Bell className="h-4 w-4" />
          {notifications.some((n) => !n.read) && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between border-b p-3">
          <h3 className="font-medium">Notifications</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="h-auto text-xs text-primary">
            Mark all as read
          </Button>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="cursor-pointer p-0"
                onClick={() => handleMarkAsRead(notification)}>
                <div className="flex w-full flex-col border-b p-3 last:border-0">
                  <div className="flex items-start gap-2">
                    {!notification.read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                    <div className="flex-1">
                      <p
                        className={`text-sm ${
                          notification.read ? "text-slate-500 dark:text-slate-400" : "font-medium"
                        }`}>
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                        {notification.time}
                      </p>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
              No notifications
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
