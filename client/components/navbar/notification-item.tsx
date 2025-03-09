"use client";

import * as React from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Notification } from "@/types/notification";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (notification: Notification) => void;
}

/**
 * Component for rendering a single notification item
 */
export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  return (
    <DropdownMenuItem
      key={notification.id}
      className="cursor-pointer p-0"
      onClick={() => onMarkAsRead(notification)}>
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
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{notification.time}</p>
          </div>
        </div>
      </div>
    </DropdownMenuItem>
  );
}
