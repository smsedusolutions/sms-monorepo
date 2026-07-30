const Attachment = require("../models/attachment.model");
const ChatRoom = require("../models/chatRoom.model");
const path = require("path");
const fs = require("fs");

/**
 * Upload an encrypted file attachment (image/document)
 */
const uploadAttachment = async (req, res) => {
  try {
    const userId = (req.user.userId || req.user.id || req.user._id || req.user.teacherId || req.user.studentId || req.user.adminId || "").toString();
    const { roomId, iv, authTag } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No attachment file uploaded",
      });
    }

    if (!roomId || !iv) {
      return res.status(400).json({
        success: false,
        message: "roomId and IV parameters are required",
      });
    }

    // Verify room access
    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: "Chat room not found" });
    }

    const isParticipant =
      room.parentUserId.toString() === userId ||
      room.teacherUserId.toString() === userId;

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const fileUrl = `/api/chat/attachments/file/${req.file.filename}`;

    const attachment = await Attachment.create({
      roomId,
      uploaderId: userId,
      fileUrl,
      mimeType: req.file.mimetype || "application/octet-stream",
      size: req.file.size,
      iv,
      authTag: authTag || "",
    });

    return res.status(201).json({
      success: true,
      data: attachment,
    });
  } catch (error) {
    console.error("❌ Upload Attachment Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error uploading encrypted attachment",
      error: error.message,
    });
  }
};

/**
 * Download/serve encrypted attachment file
 */
const getAttachmentFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, "../uploads", filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    return res.sendFile(filePath);
  } catch (error) {
    console.error("❌ Get Attachment Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error retrieving attachment file",
      error: error.message,
    });
  }
};

module.exports = {
  uploadAttachment,
  getAttachmentFile,
};
