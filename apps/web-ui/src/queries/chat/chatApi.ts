import TokenService from "../token/tokenService";

const CHAT_SERVICE_URL = "http://localhost:5007/api/chat";

const getHeaders = () => {
  const token = TokenService.getToken();
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

export const chatApi = {
  // 1. Register client E2EE Public Keys
  registerKeys: async (identityPublicKey: string) => {
    const res = await fetch(`${CHAT_SERVICE_URL}/keys`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ identityPublicKey }),
    });
    return res.json();
  },

  // 2. Fetch target user's public key bundle
  getUserKeys: async (targetUserId: string) => {
    const res = await fetch(`${CHAT_SERVICE_URL}/keys/${targetUserId}`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  // 3. Get all chat rooms for authenticated user
  getRooms: async () => {
    const res = await fetch(`${CHAT_SERVICE_URL}/rooms`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  // 4. Create or retrieve Parent-Teacher conversation room
  getOrCreateRoom: async (partnerUserId: string, studentId?: string) => {
    const res = await fetch(`${CHAT_SERVICE_URL}/rooms`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ partnerUserId, studentId }),
    });
    return res.json();
  },

  // 5. Fetch encrypted message history
  getRoomMessages: async (roomId: string, page = 1, limit = 50) => {
    const res = await fetch(
      `${CHAT_SERVICE_URL}/rooms/${roomId}/messages?page=${page}&limit=${limit}`,
      { headers: getHeaders() }
    );
    return res.json();
  },

  // 6. Mark messages in room as read
  markAsRead: async (roomId: string) => {
    const res = await fetch(`${CHAT_SERVICE_URL}/rooms/${roomId}/read`, {
      method: "PUT",
      headers: getHeaders(),
    });
    return res.json();
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
    const res = await fetch(`${CHAT_SERVICE_URL}/keys/status/${targetUserId}`, {
      headers: getHeaders(),
    });
    return res.json();
  },
};
