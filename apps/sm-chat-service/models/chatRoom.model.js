const mongoose = require("mongoose");

const ChatRoomSchema = new mongoose.Schema(
  {
    schoolId: {
      type: String,
      required: false,
      index: true,
    },
    parentUserId: {
      type: String,
      required: true,
      index: true,
    },
    teacherUserId: {
      type: String,
      required: true,
      index: true,
    },
    studentId: {
      type: String,
      required: false,
      index: true,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    unreadCountParent: {
      type: Number,
      default: 0,
    },
    unreadCountTeacher: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "archived", "blocked"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Compound index to guarantee fast room lookup per parent-teacher-student
ChatRoomSchema.index({ parentUserId: 1, teacherUserId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("ChatRoom", ChatRoomSchema);
