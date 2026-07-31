const ChatRoom = require("../models/chatRoom.model");
const ChatMessage = require("../models/chatMessage.model");

const extractUserId = (user) =>
  (user?.parentId || user?.teacherId || user?.studentId || user?.userId || user?.id || user?._id || user?.adminId || "").toString();

/**
 * Get all active chat rooms for the authenticated parent or teacher
 */
const getRooms = async (req, res) => {
  try {
    const userId = extractUserId(req.user);
    const role = (req.user.role || req.user.userType || "").toLowerCase();

    let query = {};
    if (role === "parent") {
      query.parentUserId = userId;
    } else if (role === "teacher") {
      query.teacherUserId = userId;
    } else {
      // Admin / SuperAdmin can query by user ID
      query = { $or: [{ parentUserId: userId }, { teacherUserId: userId }] };
    }

    const rooms = await ChatRoom.find(query)
      .sort({ lastMessageAt: -1 })
      .lean();

    console.log(`💬 [sm-chat-service] getRooms: userId="${userId}", role="${role}" -> found ${rooms.length} rooms`);

    return res.status(200).json({
      success: true,
      data: rooms,
    });
  } catch (error) {
    console.error("❌ Get Rooms Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching chat rooms",
      error: error.message,
    });
  }
};

/**
 * Get or create a Parent-Teacher conversation room
 */
const getOrCreateRoom = async (req, res) => {
  try {
    const userId = extractUserId(req.user);
    const userRole = (req.user.role || req.user.userType || "").toLowerCase();
    const { partnerUserId, studentId, schoolId } = req.body;

    if (!partnerUserId) {
      return res.status(400).json({
        success: false,
        message: "partnerUserId is required",
      });
    }

    let parentUserId, teacherUserId;

    if (userRole === "parent") {
      parentUserId = userId;
      teacherUserId = partnerUserId;
    } else if (userRole === "teacher") {
      teacherUserId = userId;
      parentUserId = partnerUserId;
    } else {
      // Fallback if role is admin specifying both
      parentUserId = req.body.parentUserId || userId;
      teacherUserId = req.body.teacherUserId || partnerUserId;
    }

    const queryFilter = {
      parentUserId,
      teacherUserId,
    };
    if (studentId) {
      queryFilter.studentId = studentId;
    }

    let room = await ChatRoom.findOne(queryFilter);

    if (!room) {
      room = await ChatRoom.create({
        schoolId: schoolId || req.user.schoolId || null,
        parentUserId,
        teacherUserId,
        studentId: studentId || null,
        lastMessageAt: new Date(),
        status: "active",
      });
    }

    return res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    console.error("❌ Get/Create Room Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error creating or retrieving chat room",
      error: error.message,
    });
  }
};

/**
 * Get paginated encrypted chat history for a specific room
 */
const getRoomMessages = async (req, res) => {
  try {
    const userId = extractUserId(req.user);
    const { roomId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Verify participant membership
    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Chat room not found",
      });
    }

    const isParticipant =
      room.parentUserId.toString() === userId ||
      room.teacherUserId.toString() === userId;

    if (!isParticipant && req.user.role !== "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are not a participant in this room.",
      });
    }

    const messages = await ChatMessage.find({ roomId })
      .populate("attachmentId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ChatMessage.countDocuments({ roomId });

    return res.status(200).json({
      success: true,
      data: messages.reverse(),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ Get Room Messages Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching room messages",
      error: error.message,
    });
  }
};

/**
 * Mark messages in a room as read
 */
const markAsRead = async (req, res) => {
  try {
    const userId = extractUserId(req.user);
    const { roomId } = req.params;

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Chat room not found",
      });
    }

    const isParent = room.parentUserId.toString() === userId;
    const isTeacher = room.teacherUserId.toString() === userId;

    if (!isParent && !isTeacher) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    // Reset unread count for user role
    if (isParent) {
      room.unreadCountParent = 0;
    } else {
      room.unreadCountTeacher = 0;
    }
    await room.save();

    // Mark recipient unread messages as read
    await ChatMessage.updateMany(
      { roomId, recipientId: userId, status: { $ne: "read" } },
      { $set: { status: "read", readAt: new Date() } }
    );

    return res.status(200).json({
      success: true,
      message: "Messages marked as read",
    });
  } catch (error) {
    console.error("❌ Mark As Read Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error marking messages as read",
      error: error.message,
    });
  }
};

module.exports = {
  getRooms,
  getOrCreateRoom,
  getRoomMessages,
  markAsRead,
};
