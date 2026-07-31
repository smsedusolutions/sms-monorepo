const UserE2EEKeys = require("../models/userE2EEKeys.model");

const extractUserId = (user) =>
  (user?.parentId || user?.teacherId || user?.studentId || user?.userId || user?.id || user?._id || user?.adminId || "").toString();

/**
 * Register or update public key bundle for current authenticated user
 */
const registerKeys = async (req, res) => {
  try {
    const userId = extractUserId(req.user);
    const role = req.user.role || req.user.userType;
    const { identityPublicKey, privateKeyBase64, signedPreKey, oneTimePreKeys } = req.body;

    if (!identityPublicKey) {
      return res.status(400).json({
        success: false,
        message: "identityPublicKey is required",
      });
    }

    const updatePayload = {
      userId,
      role: role.toLowerCase(),
      identityPublicKey,
      signedPreKey: signedPreKey || null,
      oneTimePreKeys: Array.isArray(oneTimePreKeys) ? oneTimePreKeys : [],
    };

    if (privateKeyBase64) {
      updatePayload.privateKeyBase64 = privateKeyBase64;
    }

    const keyDoc = await UserE2EEKeys.findOneAndUpdate(
      { userId },
      updatePayload,
      { upsert: true, new: true, runValidators: true }
    );

    console.log(`🔐 [sm-chat-service] Registered public key for userId: "${userId}", role: "${role}"`);

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
    const requesterUserId = extractUserId(req.user);
    const isOwnKeys = requesterUserId === targetUserId;

    const keyDoc = await UserE2EEKeys.findOne({ userId: targetUserId });

    if (!keyDoc) {
      console.warn(`⚠️ [sm-chat-service] getUserKeys 404: Target user "${targetUserId}" has not registered E2EE public keys yet`);
      return res.status(404).json({
        success: false,
        message: "Recipient has not registered E2EE public keys yet",
      });
    }

    console.log(`🔑 [sm-chat-service] getUserKeys 200: Public key found for targetUserId: "${targetUserId}"`);

    return res.status(200).json({
      success: true,
      data: {
        userId: keyDoc.userId,
        role: keyDoc.role,
        identityPublicKey: keyDoc.identityPublicKey,
        privateKeyBase64: isOwnKeys ? keyDoc.privateKeyBase64 : undefined,
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
