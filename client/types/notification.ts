/**
 * Types for notifications in the application
 */

export type Notification = {
  id: number;
  message: string;
  read: boolean;
  time: string;
};

export type ApiNotification = {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
};
