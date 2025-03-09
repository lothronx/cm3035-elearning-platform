/**
 * Utility functions for managing WebSocket connections
 */

/**
 * Create a WebSocket connection to a specified endpoint
 * @param endpoint The endpoint path after the base URL and /ws/
 * @param token Authentication token
 * @param onOpen Callback for when the connection opens
 * @param onClose Callback for when the connection closes
 * @param onError Callback for when an error occurs
 * @param onMessage Callback for when a message is received
 * @returns A WebSocket instance
 */
export function createWebSocketConnection(
  endpoint: string,
  token: string,
  onOpen?: () => void,
  onClose?: () => void,
  onError?: (error: Event) => void,
  onMessage?: (event: MessageEvent) => void
): WebSocket {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const apiHost = apiUrl.replace(/^https?:\/\//, "");
  const protocol = apiUrl.startsWith("https") ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${apiHost}/ws/${endpoint}/?token=${encodeURIComponent(token)}`;

  const ws = new WebSocket(wsUrl);

  if (onOpen) {
    ws.onopen = onOpen;
  }

  if (onClose) {
    ws.onclose = onClose;
  }

  if (onError) {
    ws.onerror = onError;
  }

  if (onMessage) {
    ws.onmessage = onMessage;
  }

  return ws;
}

/**
 * Create a chat WebSocket connection
 */
export function createChatWebSocketConnection(
  token: string,
  onOpen?: () => void,
  onClose?: () => void,
  onError?: (error: Event) => void,
  onMessage?: (event: MessageEvent) => void
): WebSocket {
  return createWebSocketConnection("chat", token, onOpen, onClose, onError, onMessage);
}

/**
 * Create a notification WebSocket connection
 */
export function createNotificationWebSocketConnection(
  token: string,
  onOpen?: () => void,
  onClose?: () => void,
  onError?: (error: Event) => void,
  onMessage?: (event: MessageEvent) => void
): WebSocket {
  return createWebSocketConnection("notifications", token, onOpen, onClose, onError, onMessage);
}
