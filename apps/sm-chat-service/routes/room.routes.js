const express = require("express");
const router = express.Router();
const {
  getRooms,
  getOrCreateRoom,
  getRoomMessages,
  markAsRead,
} = require("../controllers/roomController");
const { Authenticated } = require("@sms/shared/middlewares");

router.get("/", Authenticated, getRooms);
router.post("/", Authenticated, getOrCreateRoom);
router.get("/:roomId/messages", Authenticated, getRoomMessages);
router.put("/:roomId/read", Authenticated, markAsRead);

module.exports = router;
