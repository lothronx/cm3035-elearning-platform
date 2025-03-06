"use client";

import type React from "react";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Search, Settings, Menu } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Mock notifications - in a real app, these would come from an API
const mockNotifications = [
  { id: 1, message: "New assignment in React course", read: false, time: "10 min ago" },
  { id: 2, message: "Your project was graded", read: false, time: "2 hours ago" },
  { id: 3, message: "New course recommendation", read: true, time: "Yesterday" },
];

export function DashboardNavbar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState(mockNotifications);
  const [isScrolled, setIsScrolled] = useState(false);

  // Add scroll effect to navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast.info(`Searching for: ${searchQuery}`);
      // router.push(`/courses/search?q=${encodeURIComponent(searchQuery)}`)
    }
  };

  const handleLogout = () => {
    toast.success("Logged out successfully");
    // router.push("/")
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
    toast.success("All notifications marked as read");
  };

  return (
    <header
      className={`fixed top-0 z-10 w-full border-b bg-primary backdrop-blur-md transition-all duration-300 dark:bg-slate-950/80 ${
        isScrolled ? "shadow-sm" : ""
      }`}>
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-2xl font-bold text-primary-foreground">
            E-Learning
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <Button
              variant="ghost"
              asChild
              className="text-primary-foreground hover:text-primary dark:text-slate-300">
              <Link href="/courses">Browse Courses</Link>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative hidden md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Search courses..."
              className="w-full max-w-[200px] bg-background border-slate-200 pl-8 text-sm transition-all focus:max-w-xs dark:border-slate-700 lg:max-w-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {/* Notifications */}
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
                                notification.read
                                  ? "text-slate-500 dark:text-slate-400"
                                  : "font-medium"
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

          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="aspect-square h-9 rounded-full text-primary-foreground hover:bg-primary-foreground hover:text-primary dark:text-slate-300 dark:hover:bg-primary">
            <Link href="/settings">
              <Settings className="h-4 w-4" />
              <span className="sr-only">Settings</span>
            </Link>
          </Button>

          {/* Logout */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="aspect-square h-9 rounded-full text-primary-foreground hover:bg-primary-foreground hover:text-primary dark:text-slate-300 dark:hover:bg-primary">
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Log out</span>
          </Button>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-1 aspect-square h-9 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] sm:w-[300px]">
              <div className="flex h-full flex-col">
                <div className="border-b pb-4 pt-2">
                  <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      type="search"
                      placeholder="Search courses..."
                      className="w-full border-slate-200 pl-8 text-sm dark:border-slate-700"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </form>
                </div>
                <nav className="flex-1 space-y-1 py-4">
                  <Link
                    href="/courses"
                    className="flex items-center rounded-md px-3 py-2 text-sm hover:bg-primary-foreground dark:hover:bg-primary">
                    Browse Courses
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center rounded-md px-3 py-2 text-sm hover:bg-primary-foreground dark:hover:bg-primary">
                    Settings
                  </Link>
                </nav>
                <div className="border-t pt-4">
                  <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
