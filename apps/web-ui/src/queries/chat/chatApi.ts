import useApi from "../useApi";
import TokenService from "../token/tokenService";

const normalizeHttpUrl = (url: string): string => {
  let trimmed = url.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    trimmed = `https://${trimmed}`;
  }
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
};

const CHAT_SERVICE_URL = `${normalizeHttpUrl(import.meta.env.VITE_CHAT_API_URL || "http://localhost:5007")}/api/chat`;

export const chatApi = {
  // 1. Register client E2EE Public Keys
  registerKeys: async (identityPublicKey: string) => {
    return useApi<any>("POST", "/api/chat/keys", { identityPublicKey });
  },

  // 2. Fetch target user's public key bundle
  getUserKeys: async (targetUserId: string) => {
    return useApi<any>("GET", `/api/chat/keys/${targetUserId}`);
  },

  // 3. Get all chat rooms for authenticated user
  getRooms: async () => {
    return useApi<any>("GET", "/api/chat/rooms");
  },

  // 4. Create or retrieve Parent-Teacher conversation room
  getOrCreateRoom: async (partnerUserId: string, studentId?: string) => {
    return useApi<any>("POST", "/api/chat/rooms", { partnerUserId, studentId });
  },

  // 5. Fetch encrypted message history
  getRoomMessages: async (roomId: string, page = 1, limit = 50) => {
    return useApi<any>(
      "GET",
      `/api/chat/rooms/${roomId}/messages`,
      undefined,
      { page, limit }
    );
  },

  // 6. Mark messages in room as read
  markAsRead: async (roomId: string) => {
    return useApi<any>("PUT", `/api/chat/rooms/${roomId}/read`);
  },

  // 7. Upload encrypted file attachment
  uploadAttachment: async (roomId: string, fileBlob: Blob, filename: string, iv: string) => {
    const token = TokenService.getToken();
    const formData = new FormData();
    formData.append("file", fileBlob, filename);
    formData.append("roomId", roomId);
    formData.append("iv", iv);

    const res = await fetch(`${CHAT_SERVICE_URL}/attachments/upload`, {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: formData,
    });
    return res.json();
  },

  // 8. Check online status of a target user (real-time presence)
  getOnlineStatus: async (targetUserId: string) => {
    return useApi<any>("GET", `/api/chat/keys/status/${targetUserId}`);
  },
};
