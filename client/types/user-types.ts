/**
 * User-related type definitions
 * Contains interfaces for user data and context types
 */

/**
 * User interface representing the authenticated user
 */
export interface User {
  id: number;
  username: string;
  role: string;
}

/**
 * Base authentication context type with user-related state and functions
 */
export interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  refreshUserData: () => Promise<void>;
  logout: () => void;
}

/**
 * WebSocket context type for chat and notification connections
 */
export interface WebSocketContextType {
  chatSocket: WebSocket | null;
  notificationSocket: WebSocket | null;
  isChatConnected: boolean;
  isNotificationConnected: boolean;
}

/**
 * Combined user context type that includes both authentication and WebSocket functionality
 */
export interface UserContextType extends AuthContextType, WebSocketContextType {}
