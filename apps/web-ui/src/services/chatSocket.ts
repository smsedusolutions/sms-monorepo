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

class ChatSocketService {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private reconnectTimer: any = null;
  private isConnecting = false;

  public connect(): void {
    if (this.isConnecting || (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING))) {
      return;
    }

    const token = TokenService.getToken();
    if (!token) return;

    this.isConnecting = true;
    const rawWsUrl = import.meta.env.VITE_CHAT_WS_URL || import.meta.env.VITE_CHAT_API_URL || "ws://localhost:5007";
    const baseWsUrl = normalizeWsUrl(rawWsUrl);
    const wsUrl = `${baseWsUrl}?token=${encodeURIComponent(token)}`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log("⚡ [WebSocket Client] Connected to sm-chat-service Gateway");
        this.isConnecting = false;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.socket.onmessage = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data);
          const { type, payload, messageId } = message;

          // Dispatch to type listeners
          if (type && this.listeners.has(type)) {
            this.listeners.get(type)?.forEach((callback) => callback({ payload, messageId }));
          }

          // Also dispatch to wildcard listeners
          if (this.listeners.has("*")) {
            this.listeners.get("*")?.forEach((callback) => callback(message));
          }
        } catch (err) {
          console.error("❌ [WebSocket Client] Parse error:", err);
        }
      };

      this.socket.onclose = () => {
        console.log("🔌 [WebSocket Client] Disconnected. Reconnecting in 3s...");
        this.socket = null;
        this.isConnecting = false;
        this.scheduleReconnect();
      };

      this.socket.onerror = (err) => {
        console.error("❌ [WebSocket Client] Socket error:", err);
        this.socket?.close();
      };
    } catch (e) {
      console.error("❌ [WebSocket Client] Connection error:", e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.connect();
      }, 3000);
    }
  }

  public disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
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

  public send(type: string, payload: any, messageId?: string): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn("⚠️ Cannot send WS message: Socket not open");
      return false;
    }

    const data = JSON.stringify({
      type,
      payload,
      messageId: messageId || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    });

    this.socket.send(data);
    return true;
  }

  public sendEncryptedMessage(payload: {
    roomId: string;
    recipientId: string;
    encryptedPayload: {
      ciphertext: string;
      iv: string;
      authTag?: string;
      algo?: string;
      keyVersion?: string;
    };
    ephemeralPublicKey?: string;
    messageType?: "text" | "attachment" | "system";
    attachmentId?: string;
  }): boolean {
    return this.send("send_message", payload);
  }

  public sendTypingStart(roomId: string, recipientId: string): void {
    this.send("typing_start", { roomId, recipientId });
  }

  public sendTypingStop(roomId: string, recipientId: string): void {
    this.send("typing_stop", { roomId, recipientId });
  }

  public sendMarkRead(roomId: string): void {
    this.send("mark_read", { roomId });
  }

  public sendGetOnlineStatus(targetUserId: string): void {
    this.send("get_online_status", { targetUserId });
  }
}

export const chatSocket = new ChatSocketService();
