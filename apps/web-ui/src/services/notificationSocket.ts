import TokenService from "../queries/token/tokenService";

export type EventCallback = (data: any) => void;

const normalizeWsUrl = (url: string): string => {
  let trimmed = url.trim();
  if (trimmed.startsWith("https://")) {
    trimmed = trimmed.replace("https://", "wss://");
  } else if (trimmed.startsWith("http://")) {
    trimmed = trimmed.replace("http://", "ws://");
  } else if (!trimmed.startsWith("ws://") && !trimmed.startsWith("wss://")) {
    trimmed = `wss://${trimmed}`;
  }
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
};

class NotificationSocketService {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private reconnectTimer: any = null;
  private isConnecting = false;
  private pingInterval: any = null;

  public connect(): void {
    if (
      this.isConnecting ||
      (this.socket &&
        (this.socket.readyState === WebSocket.OPEN ||
          this.socket.readyState === WebSocket.CONNECTING))
    ) {
      return;
    }

    const token = TokenService.getToken();
    if (!token) return;

    this.isConnecting = true;
    const rawWsUrl =
      import.meta.env.VITE_NOTIF_WS_URL ||
      import.meta.env.VITE_NOTIF_API_URL ||
      "ws://localhost:5008";
    const baseWsUrl = normalizeWsUrl(rawWsUrl);
    const wsUrl = `${baseWsUrl}?token=${encodeURIComponent(token)}`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log("⚡ [Notification WS] Connected to Real-time Notification Gateway");
        this.isConnecting = false;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }

        // Start heartbeat ping
        this.startHeartbeat();
      };

      this.socket.onmessage = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data);
          const { type, payload } = message;

          if (type && this.listeners.has(type)) {
            this.listeners.get(type)?.forEach((callback) => callback(payload));
          }

          if (this.listeners.has("*")) {
            this.listeners.get("*")?.forEach((callback) => callback(message));
          }
        } catch (err) {
          console.error("❌ [Notification WS] Parse error:", err);
        }
      };

      this.socket.onclose = (event: CloseEvent) => {
        this.socket = null;
        this.isConnecting = false;
        this.stopHeartbeat();

        if (event.code === 4001) {
          console.warn(
            "🔒 [Notification WS] Unauthorized session (invalid token). Will not auto-reconnect until re-authenticated."
          );
        } else {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = (err) => {
        console.error("❌ [Notification WS] Socket error:", err);
        this.socket?.close();
      };
    } catch (e) {
      console.error("❌ [Notification WS] Connection error:", e);
      this.scheduleReconnect();
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: "ping" }));
      }
    }, 25000);
  }

  private stopHeartbeat(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect(): void {
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        const token = TokenService.getToken();
        if (token) {
          this.connect();
        }
      }, 4000);
    }
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  public on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return un-subscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  public isConnected(): boolean {
    return !!this.socket && this.socket.readyState === WebSocket.OPEN;
  }
}

export const notificationSocket = new NotificationSocketService();
