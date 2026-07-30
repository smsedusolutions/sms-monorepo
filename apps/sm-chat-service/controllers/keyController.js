const UserE2EEKeys = require("../models/userE2EEKeys.model");

/**
 * Register or update public key bundle for current authenticated user
 */
const registerKeys = async (req, res) => {
  try {
    const userId = (req.user.userId || req.user.id || req.user._id || req.user.teacherId || req.user.studentId || req.user.adminId || "").toString();
    const role = req.user.role || req.user.userType;
    const { identityPublicKey, signedPreKey, oneTimePreKeys } = req.body;

    if (!identityPublicKey) {
      return res.status(400).json({
        success: false,
        message: "identityPublicKey is required",
      });
    }

    const keyDoc = await UserE2EEKeys.findOneAndUpdate(
      { userId },
      {
        userId,
        role: role.toLowerCase(),
        identityPublicKey,
        signedPreKey: signedPreKey || null,
        oneTimePreKeys: Array.isArray(oneTimePreKeys) ? oneTimePreKeys : [],
      },
      { upsert: true, new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Public key bundle registered successfully",
      data: keyDoc,
    });
  } catch (error) {
    console.error("❌ Register Keys Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error registering public key bundle",
      error: error.message,
    });
  }
};

/**
 * Fetch public key bundle for a target user (recipient)
 */
const getUserKeys = async (req, res) => {
  try {
    const { targetUserId } = req.params;

    const keyDoc = await UserE2EEKeys.findOne({ userId: targetUserId });

    if (!keyDoc) {
      return res.status(404).json({
        success: false,
        message: "Recipient has not registered E2EE public keys yet",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        userId: keyDoc.userId,
        role: keyDoc.role,
        identityPublicKey: keyDoc.identityPublicKey,
        signedPreKey: keyDoc.signedPreKey,
        oneTimePreKeys: keyDoc.oneTimePreKeys,
      },
    });
  } catch (error) {
    console.error("❌ Get User Keys Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching user public key bundle",
      error: error.message,
    });
  }
};

module.exports = {
  registerKeys,
  getUserKeys,
};
