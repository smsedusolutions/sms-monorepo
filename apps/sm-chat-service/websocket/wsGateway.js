const { WebSocketServer, WebSocket } = require("ws");
const { verifyWsToken } = require("../middlewares/wsAuth");
const ChatRoom = require("../models/chatRoom.model");
const ChatMessage = require("../models/chatMessage.model");

// Active connected users map: userId -> { ws, lastSeen }
const clientsMap = new Map();

// Track lastSeen for recently disconnected users (TTL cache)
const lastSeenCache = new Map();

/**
 * Broadcast an event to a specific user if they are online
 */
const sendToUser = (userId, data) => {
  const entry = clientsMap.get(userId.toString());
  const ws = entry?.ws || entry; // support both old and new format
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
    return true;
  }
  return false;
};

/**
 * Get all partner userIds from rooms involving this userId
 */
const getRoomPartnerIds = async (userId) => {
  const rooms = await ChatRoom.find({
    $or: [{ parentUserId: userId }, { teacherUserId: userId }],
  }).select("parentUserId teacherUserId").lean();

  const partnerIds = new Set();
  rooms.forEach((r) => {
    if (r.parentUserId.toString() !== userId.toString()) partnerIds.add(r.parentUserId.toString());
    if (r.teacherUserId.toString() !== userId.toString()) partnerIds.add(r.teacherUserId.toString());
  });
  return [...partnerIds];
};

/**
 * Initialize WebSocket Gateway attached to the HTTP server
 * @param {import('http').Server} server 
 */
const initWebSocketGateway = (server) => {
  const wss = new WebSocketServer({ server });

  console.log("🚀 [sm-chat-service] WebSocket Gateway Initialized");

  wss.on("connection", async (ws, req) => {
    const user = verifyWsToken(req);

    if (!user) {
      console.log("❌ [WebSocket] Connection rejected: Unauthorized");
      ws.close(4001, "Unauthorized: Invalid or missing JWT token");
      return;
    }

    const userId = (user.parentId || user.teacherId || user.studentId || user.userId || user.id || user._id || user.adminId || "").toString();
    if (!userId) {
      console.log("❌ [WebSocket] Connection rejected: Missing User ID in token payload");
      ws.close(4001, "Unauthorized: User ID missing in token payload");
      return;
    }
    ws.user = user;
    ws.userId = userId;
    ws.isAlive = true;

    clientsMap.set(userId, { ws, connectedAt: new Date() });
    lastSeenCache.delete(userId); // clear stale last seen
    console.log(`⚡ [WebSocket] User connected: ${userId} (${user.role || "user"})`);

    // Send connection success handshake
    ws.send(
      JSON.stringify({
        type: "connected",
        payload: {
          userId,
          message: "Successfully connected to End-to-End Encrypted Chat Gateway",
        },
      })
    );

    // Notify all room partners that this user came online
    getRoomPartnerIds(userId).then((partnerIds) => {
      partnerIds.forEach((partnerId) => {
        sendToUser(partnerId, {
          type: "user_online",
          payload: { userId },
        });
      });
    }).catch(() => {});

    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("message", async (rawMessage) => {
      try {
        const data = JSON.parse(rawMessage.toString());
        const { type, payload, messageId } = data;

        switch (type) {
          case "send_message":
            await handleSendMessage(ws, payload, messageId);
            break;

          case "mark_read":
            await handleMarkRead(ws, payload);
            break;

          case "typing_start":
          case "typing_stop":
            handleTyping(ws, type, payload);
            break;

          case "get_online_status": {
            // Check if a specific userId is online
            const { targetUserId } = payload || {};
            if (targetUserId) {
              const isOnline = clientsMap.has(targetUserId.toString());
              const lastSeen = isOnline ? null : (lastSeenCache.get(targetUserId.toString()) || null);
              ws.send(JSON.stringify({
                type: "online_status_response",
                payload: { userId: targetUserId, isOnline, lastSeen },
              }));
            }
            break;
          }

          case "ping":
            ws.send(JSON.stringify({ type: "pong" }));
            break;

          default:
            ws.send(
              JSON.stringify({
                type: "error",
                payload: { message: `Unknown event type: ${type}` },
              })
            );
        }
      } catch (err) {
        console.error("❌ [WebSocket] Message handling error:", err.message);
        ws.send(
          JSON.stringify({
            type: "error",
            payload: { message: "Invalid message payload or server processing error" },
          })
        );
      }
    });

    ws.on("close", () => {
      console.log(`🔌 [WebSocket] User disconnected: ${userId}`);
      const entry = clientsMap.get(userId);
      if (entry && (entry.ws === ws || entry === ws)) {
        clientsMap.delete(userId);
        const lastSeen = new Date().toISOString();
        lastSeenCache.set(userId, lastSeen);

        // Notify all room partners that this user went offline
        getRoomPartnerIds(userId).then((partnerIds) => {
          partnerIds.forEach((partnerId) => {
            sendToUser(partnerId, {
              type: "user_offline",
              payload: { userId, lastSeen },
            });
          });
        }).catch(() => {});
      }
    });

    ws.on("error", (err) => {
      console.error(`❌ [WebSocket] Error for user ${userId}:`, err.message);
    });
  });

  // Heartbeat ping interval to cleanup stale dead connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  return wss;
};

/**
 * Handle incoming E2EE message sending and real-time relay
 */
const handleSendMessage = async (ws, payload, clientMessageId) => {
  const senderId = ws.userId;
  const senderRole = (ws.user.role || ws.user.userType || "parent").toLowerCase();

  const {
    roomId,
    recipientId,
    encryptedPayload,
    ephemeralPublicKey,
    messageType,
    attachmentId,
  } = payload;

  if (!roomId || !recipientId || !encryptedPayload || !encryptedPayload.ciphertext) {
    return ws.send(
      JSON.stringify({
        type: "error",
        messageId: clientMessageId,
        payload: { message: "Missing required message parameters (roomId, recipientId, encryptedPayload)" },
      })
    );
  }

  // Verify participant membership in chat room
  const room = await ChatRoom.findById(roomId);
  if (!room) {
    return ws.send(
      JSON.stringify({
        type: "error",
        messageId: clientMessageId,
        payload: { message: "Chat room does not exist" },
      })
    );
  }

  const isParentSender = room.parentUserId.toString() === senderId;
  const isTeacherSender = room.teacherUserId.toString() === senderId;

  if (!isParentSender && !isTeacherSender) {
    return ws.send(
      JSON.stringify({
        type: "error",
        messageId: clientMessageId,
        payload: { message: "Unauthorized sender for this room" },
      })
    );
  }

  // Create encrypted chat message record
  const chatMessage = await ChatMessage.create({
    roomId,
    senderId,
    senderRole,
    recipientId,
    encryptedPayload: {
      ciphertext: encryptedPayload.ciphertext,
      iv: encryptedPayload.iv,
      authTag: encryptedPayload.authTag || "",
      algo: encryptedPayload.algo || "AES-GCM-256",
      keyVersion: encryptedPayload.keyVersion || "1",
    },
    ephemeralPublicKey: ephemeralPublicKey || "",
    attachmentId: attachmentId || null,
    messageType: messageType || "text",
    status: "sent",
  });

  // Update ChatRoom lastMessageAt & unread counters
  room.lastMessageAt = new Date();
  if (isParentSender) {
    room.unreadCountTeacher += 1;
  } else {
    room.unreadCountParent += 1;
  }
  await room.save();

  console.log(`✉️ [sm-chat-service] Created message _id="${chatMessage._id}" from sender="${senderId}" (${senderRole}) to recipient="${recipientId}" in room="${roomId}"`);

  // Send ACK to sender
  ws.send(
    JSON.stringify({
      type: "message_ack",
      messageId: clientMessageId,
      payload: {
        id: chatMessage._id,
        roomId,
        status: "sent",
        createdAt: chatMessage.createdAt,
      },
    })
  );

  // Relay real-time message if recipient is online
  const recipientEntry = clientsMap.get(recipientId.toString());
  const recipientSocket = recipientEntry?.ws || recipientEntry;

  if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
    recipientSocket.send(
      JSON.stringify({
        type: "new_message",
        payload: {
          id: chatMessage._id,
          roomId,
          senderId,
          senderRole,
          recipientId,
          encryptedPayload: chatMessage.encryptedPayload,
          ephemeralPublicKey: chatMessage.ephemeralPublicKey,
          attachmentId: chatMessage.attachmentId,
          messageType: chatMessage.messageType,
          createdAt: chatMessage.createdAt,
        },
      })
    );

    // Update status to delivered
    chatMessage.status = "delivered";
    chatMessage.deliveredAt = new Date();
    await chatMessage.save();

    // Notify sender that message was delivered
    ws.send(
      JSON.stringify({
        type: "message_status_update",
        payload: {
          id: chatMessage._id,
          roomId,
          status: "delivered",
          deliveredAt: chatMessage.deliveredAt,
        },
      })
    );
  }
};

/**
 * Handle read confirmation signaling
 */
const handleMarkRead = async (ws, payload) => {
  const userId = ws.userId;
  const { roomId } = payload;

  if (!roomId) return;

  const room = await ChatRoom.findById(roomId);
  if (!room) return;

  const isParent = room.parentUserId.toString() === userId;
  const isTeacher = room.teacherUserId.toString() === userId;

  if (isParent) room.unreadCountParent = 0;
  if (isTeacher) room.unreadCountTeacher = 0;
  await room.save();

  await ChatMessage.updateMany(
    { roomId, recipientId: userId, status: { $ne: "read" } },
    { $set: { status: "read", readAt: new Date() } }
  );

  const recipientId = isParent ? room.teacherUserId.toString() : room.parentUserId.toString();
  const recipientEntry = clientsMap.get(recipientId);
  const recipientSocket = recipientEntry?.ws || recipientEntry;

  if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
    recipientSocket.send(
      JSON.stringify({
        type: "messages_read",
        payload: { roomId, readerId: userId },
      })
    );
  }
};

/**
 * Handle typing indicators
 */
const handleTyping = (ws, type, payload) => {
  const { recipientId, roomId } = payload;
  if (!recipientId) return;

  const recipientEntry = clientsMap.get(recipientId.toString());
  const recipientSocket = recipientEntry?.ws || recipientEntry;
  if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
    recipientSocket.send(
      JSON.stringify({
        type,
        payload: {
          roomId,
          senderId: ws.userId,
        },
      })
    );
  }
};

/**
 * REST-style helper: check if a userId is currently online
 * Used by REST routes if needed
 */
const isUserOnline = (userId) => clientsMap.has(userId.toString());
const getUserLastSeen = (userId) => lastSeenCache.get(userId.toString()) || null;

module.exports = {
  initWebSocketGateway,
  clientsMap,
  isUserOnline,
  getUserLastSeen,
  sendToUser,
};
