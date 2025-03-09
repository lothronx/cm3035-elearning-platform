"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { WebSocketContextType, User } from "@/types/user-types";
import { 
  createChatWebSocketConnection, 
  createNotificationWebSocketConnection 
} from "@/utils/websocket-utils";

/**
 * Default context value for WebSocketContext
 */
const defaultWebSocketContext: WebSocketContextType = {
  chatSocket: null,
  notificationSocket: null,
  isChatConnected: false,
  isNotificationConnected: false,
};

/**
 * Context for WebSocket-related state and connections
 */
export const WebSocketContext = createContext<WebSocketContextType>(defaultWebSocketContext);

/**
 * Provider component for WebSocket context
 * Handles connection establishment and management for chat and notification sockets
 */
export function WebSocketProvider({ 
  children, 
  user 
}: { 
  children: ReactNode;
  user: User | null;
}) {
  const [chatSocket, setChatSocket] = useState<WebSocket | null>(null);
  const [notificationSocket, setNotificationSocket] = useState<WebSocket | null>(null);
  const [isChatConnected, setIsChatConnected] = useState(false);
  const [isNotificationConnected, setIsNotificationConnected] = useState(false);

  /**
   * Establishes a WebSocket connection for chat
   */
  const connectChatWebSocket = useCallback(
    (token: string) => {
      if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
        return chatSocket; // Already connected
      }

      const ws = createChatWebSocketConnection(
        token,
        () => {
          console.log("Chat WebSocket connected");
          setIsChatConnected(true);
        },
        () => {
          console.log("Chat WebSocket disconnected");
          setIsChatConnected(false);
          setChatSocket(null);
        },
        (error) => {
          console.error("Chat WebSocket error:", error);
          setIsChatConnected(false);
        }
      );

      setChatSocket(ws);
      return ws;
    },
    [chatSocket]
  );

  /**
   * Establishes a WebSocket connection for notifications
   */
  const connectNotificationWebSocket = useCallback(
    (token: string) => {
      if (notificationSocket && notificationSocket.readyState === WebSocket.OPEN) {
        return notificationSocket; // Already connected
      }

      const ws = createNotificationWebSocketConnection(
        token,
        () => {
          console.log("Notification WebSocket connected");
          setIsNotificationConnected(true);
        },
        () => {
          console.log("Notification WebSocket disconnected");
          setIsNotificationConnected(false);
          setNotificationSocket(null);
        },
        (error) => {
          console.error("Notification WebSocket error:", error);
          setIsNotificationConnected(false);
        }
      );

      setNotificationSocket(ws);
      return ws;
    },
    [notificationSocket]
  );

  /**
   * Manages WebSocket connections based on user authentication state
   */
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
    }

    // Cleanup function
    return () => {
      if (chatSocket) {
        chatSocket.close();
        setChatSocket(null);
      }
      if (notificationSocket) {
        notificationSocket.close();
        setNotificationSocket(null);
      }
    };
  }, [user, chatSocket, notificationSocket, connectChatWebSocket, connectNotificationWebSocket]);

  return (
    <WebSocketContext.Provider
      value={{
        chatSocket,
        notificationSocket,
        isChatConnected,
        isNotificationConnected,
      }}>
      {children}
    </WebSocketContext.Provider>
  );
}

/**
 * Hook to access the WebSocket context
 * @returns The WebSocket context
 */
export const useWebSockets = () => useContext(WebSocketContext);
