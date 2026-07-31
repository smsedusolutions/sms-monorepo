const mongoose = require("mongoose");

const UserE2EEKeysSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["parent", "teacher", "admin", "superadmin"],
      required: true,
    },
    identityPublicKey: {
      type: String,
      required: true,
    },
    privateKeyBase64: {
      type: String,
      default: "",
    },
    signedPreKey: {
      type: String,
      default: null,
    },
    oneTimePreKeys: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserE2EEKeys", UserE2EEKeysSchema);
