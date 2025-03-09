"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect } from "react";
import { useUser } from "@/contexts/user-context";
import { NotificationItem } from "./notification-item";
import { Notification } from "@/types/notification";
import { 
  fetchNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from "@/utils/notification-api";
import { 
  setupNotificationSocket, 
  NotificationSocketMessage 
} from "@/utils/notification-websocket-handler";

/**
 * NotificationMenu component handles notification display and interactions
 */
export function NotificationMenu() {
  // State management for notifications
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const { notificationSocket, isNotificationConnected } = useUser();

  // Load notifications when component mounts or connection status changes
  useEffect(() => {
    if (isNotificationConnected) {
      loadNotifications();
    }
  }, [isNotificationConnected]);

  // Function to load notifications from API
  const loadNotifications = async () => {
    try {
      const notificationData = await fetchNotifications();
      setNotifications(notificationData);
    } catch (error) {
      toast.error("Failed to load notifications");
      console.error("Error loading notifications:", error);
    }
  };

  // Handle incoming WebSocket messages
  useEffect(() => {
    const handleNotificationMessage = (data: NotificationSocketMessage) => {
      // Add new notification to the list
      const newNotification = {
        id: data.notification_id,
        message: data.message,
        read: false,
        time: "Just now",
      };

      setNotifications((prev) => [newNotification, ...prev]);
      toast.info("New notification received");
    };

    // Setup socket and get cleanup function
    const cleanup = setupNotificationSocket(notificationSocket, handleNotificationMessage);
    
    // Return cleanup function
    return cleanup;
  }, [notificationSocket]);

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      // Update UI immediately for better UX
      setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));

      // Call API to mark notifications as read
      const success = await markAllNotificationsAsRead();

      if (success) {
        toast.success("All notifications marked as read");
      } else {
        // Revert UI change if API call fails
        await loadNotifications();
        toast.error("Failed to mark notifications as read");
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      toast.error("Failed to mark notifications as read");
      await loadNotifications(); // Refresh notifications on error
    }
  };

  // Mark a single notification as read
  const handleMarkAsRead = async (notification: Notification) => {
    try {
      // Update UI immediately for better UX
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );

      // Call API to mark notification as read
      const success = await markNotificationAsRead(notification.id);

      if (!success) {
        // Revert UI change if API call fails
        await loadNotifications();
        toast.error("Failed to mark notification as read");
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read");
      await loadNotifications(); // Refresh notifications on error
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
            onClick={handleMarkAllAsRead}
            className="h-auto text-xs text-primary">
            Mark all as read
          </Button>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
              />
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
