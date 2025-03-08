"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth, checkAuthStatus } from "@/lib/auth";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  socket: WebSocket | null;
  isConnected: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  loading: true,
  socket: null,
  isConnected: false,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Function to establish WebSocket connection
  const connectWebSocket = (token: string) => {
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
  };

  // Check for stored user data and token on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const storedUser = localStorage.getItem("user");

        if (token && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          connectWebSocket(token);
        } else {
          const isAuthenticated = await checkAuthStatus();
          if (!isAuthenticated) {
            if (window.location.pathname !== "/") {
              router.push("/");
            }
            return;
          }

          const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/`);
          const data = await response.json();
          setUser(data);
          connectWebSocket(localStorage.getItem("accessToken") as string);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        if (window.location.pathname !== "/") {
          router.push("/");
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Cleanup WebSocket on unmount
    return () => {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    };
  }, []);

  // Handle WebSocket connection when user changes
  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (user && token && !socket) {
      connectWebSocket(token);
    } else if (!user && socket) {
      socket.close();
      setSocket(null);
    }
  }, [user, socket]);

  return (
    <UserContext.Provider value={{ user, setUser, loading, socket, isConnected }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
