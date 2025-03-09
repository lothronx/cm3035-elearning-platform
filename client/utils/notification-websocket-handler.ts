/**
 * Handles WebSocket connection and communication for notifications
 */

// Type for the parsed WebSocket message data
export type NotificationSocketMessage = {
  type: string;
  notification_id: number;
  message: string;
};

// Type for the callback that processes incoming notification messages
export type NotificationMessageHandler = (message: NotificationSocketMessage) => void;

/**
 * Sets up event listeners for the notification WebSocket
 * @param socket WebSocket connection to use
 * @param onMessage Callback to handle incoming notification messages
 */
export const setupNotificationSocket = (
  socket: WebSocket | null,
  onMessage: NotificationMessageHandler
): (() => void) => {
  if (!socket) {
    return () => {};
  }

  // Handler function for WebSocket messages
  const handleMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "notification") {
        onMessage(data);
      }
    } catch (error) {
      console.error("Error processing websocket message:", error);
    }
  };

  // Add event listener
  socket.addEventListener("message", handleMessage);

  // Return cleanup function
  return () => {
    socket.removeEventListener("message", handleMessage);
  };
};
