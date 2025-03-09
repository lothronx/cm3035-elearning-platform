"use client";

import type React from "react";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/user-context";
import { SearchBar } from "@/components/navbar/search-bar";
import { NotificationMenu } from "@/components/navbar/notification";
import { ChatBox } from "@/components/navbar/chat-box";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, logout } = useUser();

  // Add scroll effect to navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      // Call the API to logout on the server side
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ refresh: localStorage.getItem("refreshToken") }),
      });

      // Use the logout function from user context to properly handle state cleanup
      logout();
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if the API call fails, we should still logout on the client side
      logout();
    }
  };

  return (
    <header
      className={`fixed top-0 z-10 w-full border-b bg-primary backdrop-blur-md transition-all duration-300  ${
        isScrolled ? "shadow-sm" : ""
      }`}>
      <div className="container mx-auto flex h-16 items-center justify-between w-full px-4">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold text-secondary">E-Learning</h1>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <Button
              variant="ghost"
              asChild
              className="text-primary-foreground hover:text-primary dark:text-slate-300 text-md">
              <Link href="/dashboard">Home</Link>
            </Button>
            <Button
              variant="ghost"
              asChild
              className="text-primary-foreground hover:text-primary dark:text-slate-300 text-md">
              <Link href="/courses">Explore</Link>
            </Button>
            {user?.role == "teacher" && (
              <Button
                variant="ghost"
                asChild
                className="text-primary-foreground hover:text-primary dark:text-slate-300 text-md">
                <Link href="/members">Members</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <SearchBar userRole={user?.role as string} />

          {/* Notifications */}
          <NotificationMenu />

          {/* Chat Box */}
          <ChatBox chatWidth={600} chatHeight={500} />

          {/* Logout */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="aspect-square h-9 rounded-full text-primary-foreground hover:bg-primary-foreground hover:text-primary dark:text-slate-300 dark:hover:bg-primary">
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Log out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
