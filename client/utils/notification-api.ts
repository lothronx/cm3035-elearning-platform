import { fetchWithAuth } from "@/lib/auth";
import { Notification, ApiNotification } from "@/types/notification";
import { formatDistanceToNow } from "date-fns";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Fetches all notifications for the current user
 * @returns Promise with formatted notifications
 */
export const fetchNotifications = async (): Promise<Notification[]> => {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/notifications/`);
    if (!response.ok) {
      throw new Error(`Error fetching notifications: ${response.statusText}`);
    }
    
    const data: ApiNotification[] = await response.json();
    
    // Transform API data to our notification format
    return data.map((item) => ({
      id: item.id,
      message: item.message,
      read: item.is_read,
      time: formatDistanceToNow(new Date(item.created_at), { addSuffix: true }),
    }));
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
};

/**
 * Marks a specific notification as read
 * @param notificationId ID of the notification to mark as read
 */
export const markNotificationAsRead = async (notificationId: number): Promise<boolean> => {
  try {
    const response = await fetchWithAuth(
      `${API_URL}/api/notifications/${notificationId}/`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    
    return response.ok;
  } catch (error) {
    console.error(`Error marking notification ${notificationId} as read:`, error);
    throw error;
  }
};

/**
 * Marks all notifications as read for the current user
 */
export const markAllNotificationsAsRead = async (): Promise<boolean> => {
  try {
    const response = await fetchWithAuth(
      `${API_URL}/api/notifications/mark_all_read/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    
    return response.ok;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
};
