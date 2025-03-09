"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth, checkAuthStatus } from "@/lib/auth";

interface User {
  id: number;
  username: string;
  role: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  socket: WebSocket | null;
  isConnected: boolean;
  refreshUserData: () => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  loading: true,
  socket: null,
  isConnected: false,
  refreshUserData: async () => {},
  logout: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [authCounter, setAuthCounter] = useState(0); // Used to trigger auth checks

  // Function to establish WebSocket connection
  const connectWebSocket = useCallback((token: string) => {
    if (socket?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    const apiHost = apiUrl.replace(/^https?:\/\//, "");
    const protocol = apiUrl.startsWith("https") ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${apiHost}/ws/notifications/?token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
      setSocket(null);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    setSocket(ws);
    return ws;
  }, []); // Don't include socket in dependencies to avoid re-creation on each socket change

  // Refresh user data from the server
  const refreshUserData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const isAuthenticated = await checkAuthStatus();
      if (!isAuthenticated) {
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        if (window.location.pathname !== "/") {
          router.push("/");
        }
        setLoading(false);
        return;
      }

      const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/`);
      const data = await response.json();

      // Update both state and localStorage
      setUser(data);
      localStorage.setItem("user", JSON.stringify(data));

      // Don't connect WebSocket here to avoid circular dependencies
      // WebSocket connection is handled in a separate effect
    } catch (error) {
      console.error("Error refreshing user data:", error);
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      if (window.location.pathname !== "/") {
        router.push("/");
      }
    } finally {
      setLoading(false);
    }
  }, [router]); // Only depend on router to avoid circular dependencies

  // Handle logout
  const logout = useCallback(() => {
    // Close socket if open
    if (socket) {
      socket.close();
      setSocket(null);
    }

    // Clear local storage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    // Update state
    setUser(null);
    setIsConnected(false);

    // Increment auth counter to trigger a re-check
    setAuthCounter((prev) => prev + 1);

    // Redirect to home
    if (window.location.pathname !== "/") {
      router.push("/");
    }
  }, [socket, router]);

  // Listen for storage events (for multi-tab support)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "accessToken" || event.key === "user") {
        refreshUserData();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [refreshUserData]);

  // Initial auth check + auth check triggered by authCounter changes
  useEffect(() => {
    let isMounted = true; // To prevent state updates after unmount

    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const storedUser = localStorage.getItem("user");

        if (token && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (isMounted) {
            setUser(parsedUser);
            // WebSocket connection is handled in a separate effect
          }
        } else {
          const isAuthenticated = await checkAuthStatus();
          if (!isAuthenticated) {
            if (isMounted) {
              setUser(null);
              if (window.location.pathname !== "/") {
                router.push("/");
              }
              setLoading(false);
            }
            return;
          }

          // Manually fetch user data instead of using refreshUserData
          // to avoid potential circular dependencies
          try {
            const response = await fetchWithAuth(
              `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/`
            );
            const data = await response.json();

            if (isMounted) {
              setUser(data);
              localStorage.setItem("user", JSON.stringify(data));
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
            if (isMounted) {
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        if (isMounted) {
          setUser(null);
          if (window.location.pathname !== "/") {
            router.push("/");
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    // Cleanup function
    return () => {
      isMounted = false; // Prevent state updates after unmount
      if (socket) {
        socket.close();
        setSocket(null);
      }
    };
  }, [authCounter, router]); // Only depend on authCounter and router

  // Handle WebSocket connection when user changes
  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (user && token && !socket) {
      connectWebSocket(token);
    } else if (!user && socket) {
      socket.close();
      setSocket(null);
    }

    // Return cleanup function
    return () => {
      // No cleanup needed here as we handle socket cleanup in the auth effect
    };
  }, [user, socket, connectWebSocket]);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        loading,
        socket,
        isConnected,
        refreshUserData,
        logout,
      }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
