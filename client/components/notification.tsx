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

// Types for notifications
type Notification = {
  id: number;
  message: string;
  read: boolean;
  time: string;
};

// Mock notifications - in a real app, these would come from an API
const mockNotifications = [
  { id: 1, message: "New assignment in React course", read: false, time: "10 min ago" },
  { id: 2, message: "Your project was graded", read: false, time: "2 hours ago" },
  { id: 3, message: "New course recommendation", read: true, time: "Yesterday" },
];

export function NotificationMenu() {
  const [notifications, setNotifications] = React.useState<Notification[]>(mockNotifications);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
    toast.success("All notifications marked as read");
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
              <DropdownMenuItem key={notification.id} className="cursor-pointer p-0">
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
