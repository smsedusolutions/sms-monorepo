const { WebSocketServer, WebSocket } = require("ws");
const { verifyWsToken } = require("../middlewares/wsAuth");

// Active connected users map: userId -> Set<WebSocket>
const clientsMap = new Map();

/**
 * Broadcast an event to all open connections for a specific user
 * @param {string} userId 
 * @param {object} data 
 * @returns {number} Count of sockets message was delivered to
 */
const sendToUser = (userId, data) => {
  if (!userId) return 0;
  const sockets = clientsMap.get(userId.toString());
  if (!sockets || sockets.size === 0) return 0;

  let deliveredCount = 0;
  const payload = JSON.stringify(data);

  for (const ws of sockets) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
      deliveredCount++;
    }
  }

  return deliveredCount;
};

/**
 * Broadcast an event to multiple users
 * @param {string[]} userIds 
 * @param {object} data 
 */
const sendToUsers = (userIds, data) => {
  if (!Array.isArray(userIds)) return 0;
  let totalDelivered = 0;
  for (const uid of userIds) {
    totalDelivered += sendToUser(uid, data);
  }
  return totalDelivered;
};

/**
 * Check if a user is currently online via WebSocket
 * @param {string} userId 
 * @returns {boolean}
 */
const isUserOnline = (userId) => {
  if (!userId) return false;
  const sockets = clientsMap.get(userId.toString());
  return !!sockets && sockets.size > 0;
};

/**
 * Initialize WebSocket Gateway attached to the HTTP server
 * @param {import('http').Server} server 
 */
const initWebSocketGateway = (server) => {
  const wss = new WebSocketServer({ server });

  console.log("🚀 [sm-notification-service] WebSocket Gateway Initialized");

  wss.on("connection", (ws, req) => {
    const user = verifyWsToken(req);

    if (!user) {
      console.log("❌ [Notification WS] Connection rejected: Unauthorized");
      ws.close(4001, "Unauthorized: Invalid or missing JWT token");
      return;
    }

    const userId = (
      user.parentId ||
      user.teacherId ||
      user.studentId ||
      user.userId ||
      user.id ||
      user._id ||
      user.adminId ||
      ""
    ).toString();

    if (!userId) {
      console.log("❌ [Notification WS] Connection rejected: Missing User ID in token payload");
      ws.close(4001, "Unauthorized: User ID missing in token payload");
      return;
    }

    ws.user = user;
    ws.userId = userId;
    ws.isAlive = true;

    if (!clientsMap.has(userId)) {
      clientsMap.set(userId, new Set());
    }
    clientsMap.get(userId).add(ws);

    console.log(`⚡ [Notification WS] User connected: ${userId} (${user.role || "user"}) - Active tabs: ${clientsMap.get(userId).size}`);

    // Send connection success handshake
    ws.send(
      JSON.stringify({
        type: "connected",
        payload: {
          userId,
          message: "Successfully connected to Real-Time Notification Gateway",
          timestamp: new Date().toISOString(),
        },
      })
    );

    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("message", (rawMessage) => {
      try {
        const data = JSON.parse(rawMessage.toString());
        const { type } = data;

        if (type === "ping") {
          ws.send(JSON.stringify({ type: "pong", timestamp: new Date().toISOString() }));
        }
      } catch (err) {
        console.error("❌ [Notification WS] Message parsing error:", err.message);
      }
    });

    ws.on("close", () => {
      const userSockets = clientsMap.get(userId);
      if (userSockets) {
        userSockets.delete(ws);
        if (userSockets.size === 0) {
          clientsMap.delete(userId);
          console.log(`🔌 [Notification WS] User offline: ${userId}`);
        } else {
          console.log(`🔌 [Notification WS] User tab closed: ${userId} (remaining: ${userSockets.size})`);
        }
      }
    });

    ws.on("error", (err) => {
      console.error(`❌ [Notification WS] Error for user ${userId}:`, err.message);
    });
  });

  // Heartbeat ping interval to cleanup stale dead connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        const userSockets = clientsMap.get(ws.userId);
        if (userSockets) {
          userSockets.delete(ws);
          if (userSockets.size === 0) clientsMap.delete(ws.userId);
        }
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  return wss;
};

module.exports = {
  initWebSocketGateway,
  clientsMap,
  sendToUser,
  sendToUsers,
  isUserOnline,
};
