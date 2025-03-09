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
  chatSocket: WebSocket | null;
  notificationSocket: WebSocket | null;
  isChatConnected: boolean;
  isNotificationConnected: boolean;
  refreshUserData: () => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  loading: true,
  chatSocket: null,
  notificationSocket: null,
  isChatConnected: false,
  isNotificationConnected: false,
  refreshUserData: async () => {},
  logout: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatSocket, setChatSocket] = useState<WebSocket | null>(null);
  const [notificationSocket, setNotificationSocket] = useState<WebSocket | null>(null);
  const [isChatConnected, setIsChatConnected] = useState(false);
  const [isNotificationConnected, setIsNotificationConnected] = useState(false);
  const [authCounter, setAuthCounter] = useState(0); // Used to trigger auth checks

  // Function to establish chat WebSocket connection
  const connectChatWebSocket = useCallback(
    (token: string) => {
      if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
        return chatSocket; // Already connected
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const apiHost = apiUrl.replace(/^https?:\/\//, "");
      const protocol = apiUrl.startsWith("https") ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${apiHost}/ws/chat/?token=${encodeURIComponent(token)}`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("Chat WebSocket connected");
        setIsChatConnected(true);
      };

      ws.onclose = () => {
        console.log("Chat WebSocket disconnected");
        setIsChatConnected(false);
        setChatSocket(null);
      };

      ws.onerror = (error) => {
        console.error("Chat WebSocket error:", error);
        setIsChatConnected(false);
      };

      setChatSocket(ws);
      return ws;
    },
    [chatSocket]
  ); // Only include chatSocket in dependencies

  // Function to establish notification WebSocket connection
  const connectNotificationWebSocket = useCallback(
    (token: string) => {
      if (notificationSocket && notificationSocket.readyState === WebSocket.OPEN) {
        return notificationSocket; // Already connected
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const apiHost = apiUrl.replace(/^https?:\/\//, "");
      const protocol = apiUrl.startsWith("https") ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${apiHost}/ws/notifications/?token=${encodeURIComponent(token)}`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("Notification WebSocket connected");
        setIsNotificationConnected(true);
      };

      ws.onclose = () => {
        console.log("Notification WebSocket disconnected");
        setIsNotificationConnected(false);
        setNotificationSocket(null);
      };

      ws.onerror = (error) => {
        console.error("Notification WebSocket error:", error);
        setIsNotificationConnected(false);
      };

      setNotificationSocket(ws);
      return ws;
    },
    [notificationSocket]
  ); // Only include notificationSocket in dependencies

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
    // Close sockets if open
    if (chatSocket) {
      chatSocket.close();
      setChatSocket(null);
    }

    if (notificationSocket) {
      notificationSocket.close();
      setNotificationSocket(null);
    }

    // Clear local storage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    // Update state
    setUser(null);
    setIsChatConnected(false);
    setIsNotificationConnected(false);

    // Increment auth counter to trigger a re-check
    setAuthCounter((prev) => prev + 1);

    // Redirect to home
    if (window.location.pathname !== "/") {
      router.push("/");
    }
  }, [chatSocket, notificationSocket, router]);

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
      if (chatSocket) {
        chatSocket.close();
        setChatSocket(null);
      }
      if (notificationSocket) {
        notificationSocket.close();
        setNotificationSocket(null);
      }
    };
  }, [authCounter, router, chatSocket, notificationSocket]); // Include socket references for cleanup

  // Handle WebSocket connections when user changes
  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (user && token) {
      // Connect to chat socket if not already connected
      if (!chatSocket) {
        connectChatWebSocket(token);
      }

      // Connect to notification socket if not already connected
      if (!notificationSocket) {
        connectNotificationWebSocket(token);
      }
    } else if (!user) {
      // Close chat socket if open
      if (chatSocket) {
        chatSocket.close();
        setChatSocket(null);
      }

      // Close notification socket if open
      if (notificationSocket) {
        notificationSocket.close();
        setNotificationSocket(null);
      }

      // Socket references have been removed
    }

    // No return cleanup needed here as we handle socket cleanup in the auth effect
  }, [
    user,
    chatSocket,
    notificationSocket,
    connectChatWebSocket,
    connectNotificationWebSocket,
    isChatConnected,
    isNotificationConnected,
  ]);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        loading,
        chatSocket,
        notificationSocket,
        isChatConnected,
        isNotificationConnected,
        refreshUserData,
        logout,
      }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
