const crypto = require("crypto");
const UserE2EEKeys = require("../models/userE2EEKeys.model");

const extractUserId = (user) =>
  (user?.parentId || user?.teacherId || user?.studentId || user?.userId || user?.id || user?._id || user?.adminId || "").toString();

/**
 * Auto-generate ECDH P-256 E2EE Key Pair on server for unregistered users
 */
const generateServerE2EEKeyPair = () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", {
    namedCurve: "P-256",
  });

  const identityPublicKey = publicKey.export({ type: "spki", format: "der" }).toString("base64");
  const privateKeyBase64 = privateKey.export({ type: "pkcs8", format: "der" }).toString("base64");

  return { identityPublicKey, privateKeyBase64 };
};

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

    let keyDoc = await UserE2EEKeys.findOne({ userId: targetUserId });

    // Auto pre-generate key bundle if recipient has not logged into chat yet
    if (!keyDoc) {
      console.log(`⚡ [sm-chat-service] Auto pre-generating E2EE key bundle for targetUserId: "${targetUserId}"`);
      const { identityPublicKey, privateKeyBase64 } = generateServerE2EEKeyPair();
      let detectedRole = "parent";
      if (targetUserId.startsWith("TCH") || targetUserId.startsWith("PRT")) {
        detectedRole = "teacher";
      } else if (targetUserId.startsWith("ADM") || targetUserId.startsWith("SUP")) {
        detectedRole = "admin";
      }

      try {
        keyDoc = await UserE2EEKeys.create({
          userId: targetUserId,
          role: detectedRole,
          identityPublicKey,
          privateKeyBase64,
        });
      } catch (createErr) {
        console.error("❌ Error creating pre-generated keyDoc:", createErr);
        // Fallback: try finding again in case of race condition
        keyDoc = await UserE2EEKeys.findOne({ userId: targetUserId });
      }
    }

    console.log(`🔑 [sm-chat-service] getUserKeys 200: Public key ready for targetUserId: "${targetUserId}"`);

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
