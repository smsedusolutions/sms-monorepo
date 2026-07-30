const express = require("express");
const router = express.Router();
const { registerKeys, getUserKeys } = require("../controllers/keyController");
const { Authenticated } = require("@sms/shared/middlewares");
const { isUserOnline, getUserLastSeen } = require("../websocket/wsGateway");

router.post("/", Authenticated, registerKeys);
router.get("/:targetUserId", Authenticated, getUserKeys);

// GET /api/chat/keys/status/:targetUserId  - real-time online presence check
router.get("/status/:targetUserId", Authenticated, (req, res) => {
  const { targetUserId } = req.params;
  const online = isUserOnline(targetUserId);
  const lastSeen = online ? null : getUserLastSeen(targetUserId);
  return res.json({ success: true, data: { userId: targetUserId, isOnline: online, lastSeen } });
});

module.exports = router;
