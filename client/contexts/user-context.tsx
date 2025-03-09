"use client";

/**
 * Main User Context Provider
 *
 * This file combines the Authentication and WebSocket contexts
 * to provide a unified interface for components that need both.
 * It serves as a backward-compatible layer that maintains the same API,
 * while delegating responsibilities to specialized context providers.
 */
import { createContext, useContext, ReactNode } from "react";
import { AuthProvider, useAuth } from "./auth-context";
import { WebSocketProvider, useWebSockets } from "./websocket-context";
import { UserContextType } from "@/types/user-types";

/**
 * Default context value for UserContext
 */
const defaultUserContext: UserContextType = {
  user: null,
  setUser: () => {},
  loading: true,
  chatSocket: null,
  notificationSocket: null,
  isChatConnected: false,
  isNotificationConnected: false,
  refreshUserData: async () => {},
  logout: () => {},
};

/**
 * Combined context that provides both auth and websocket functionality
 */
const UserContext = createContext<UserContextType>(defaultUserContext);

/**
 * Main provider component that composes Auth and WebSocket providers
 * This maintains the original UserProvider API while delegating to specialized contexts
 */
export function UserProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider
      onLogout={() => {
        // Logout is handled in the WebSocketProvider
        // by monitoring user changes - no action needed here
      }}>
      <AuthConsumer>
        {(authProps) => (
          <WebSocketProvider user={authProps.user}>
            <WebSocketConsumer>
              {(websocketProps) => (
                <UserContext.Provider
                  value={{
                    ...authProps,
                    ...websocketProps,
                  }}>
                  {children}
                </UserContext.Provider>
              )}
            </WebSocketConsumer>
          </WebSocketProvider>
        )}
      </AuthConsumer>
    </AuthProvider>
  );
}

/**
 * Helper component to consume AuthContext
 */
function AuthConsumer({
  children,
}: {
  children: (props: ReturnType<typeof useAuth>) => React.ReactNode;
}) {
  const authProps = useAuth();
  return <>{children(authProps)}</>;
}

/**
 * Helper component to consume WebSocketContext
 */
function WebSocketConsumer({
  children,
}: {
  children: (props: ReturnType<typeof useWebSockets>) => React.ReactNode;
}) {
  const websocketProps = useWebSockets();
  return <>{children(websocketProps)}</>;
}

/**
 * Hook to access the combined user context
 * @returns The user context with both auth and websocket functionality
 */
export const useUser = () => useContext(UserContext);
