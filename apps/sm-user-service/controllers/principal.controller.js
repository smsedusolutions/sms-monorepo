// apps/sm-user-service/controllers/principal.controller.js
const { getSchoolDbConnection } = require("../configs/db");
const {
  SchoolModel: School,
  EmailRegistryModel: EmailRegistry,
  PrincipalSchema: principalSchema,
} = require("@sms/shared");
const {
  getPaginationParams,
  formatPaginationResponse,
} = require("../utils/pagination");
const { logActivity } = require("@sms/shared/utils");

const getPrincipalModel = (schoolDbName) => {
  const schoolDb = getSchoolDbConnection(schoolDbName);
  return schoolDb.model("Principal", principalSchema);
};

const { generateNextId } = require("@sms/shared/utils");

const generatePrincipalId = async (Principal) => {
  return generateNextId(Principal, "principalId", "PRC", 5);
};

const getSchoolDbName = async (schoolId) => {
  const school = await School.findOne({ schoolId });
  return school ? school.schoolDbName : null;
};

// Create a new principal
exports.createPrincipal = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { firstName, lastName, email, password, phone, status, profileImage } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ success: false, message: "firstName, lastName, email, and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingEmail = await EmailRegistry.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: "Email already exists in the system" });
    }

    const schoolDbName = await getSchoolDbName(schoolId);
    if (!schoolDbName) {
      return res.status(404).json({ success: false, message: "School not found" });
    }

    const Principal = getPrincipalModel(schoolDbName);

    // Check if a principal record already exists for this school
    const existingPrincipal = await Principal.findOne({});
    if (existingPrincipal) {
      return res.status(400).json({
        success: false,
        message: "A principal record already exists for this school. Creation rejected.",
      });
    }

    const principalId = await generatePrincipalId(Principal);

    const newPrincipal = new Principal({
      principalId,
      schoolId,
      firstName,
      lastName,
      email: normalizedEmail,
      password,
      phone,
      status: status || "active",
      profileImage,
    });

    const savedPrincipal = await newPrincipal.save();

    await EmailRegistry.create({
      email: normalizedEmail,
      role: "principal",
      schoolId,
      userId: principalId,
      status: savedPrincipal.status || "active",
    });

    logActivity({
      schoolDb: getSchoolDbConnection(schoolDbName),
      schoolId,
      actor: req.user,
      action: "CREATE",
      entity: "Principal",
      entityId: principalId,
      entityLabel: `${firstName} ${lastName}`,
      description: `Created principal ${principalId}`,
    });

    res.status(201).json({ success: true, data: savedPrincipal });
  } catch (error) {
    console.error("Error creating principal:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all principals (or the main principal) for a school
exports.getAllPrincipals = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const schoolDbName = await getSchoolDbName(schoolId);
    if (!schoolDbName) {
      return res.status(404).json({ success: false, message: "School not found" });
    }

    const Principal = getPrincipalModel(schoolDbName);
    const principals = await Principal.find({}).select("-password").sort({ createdAt: -1 });

    res.json({ success: true, data: principals });
  } catch (error) {
    console.error("Error fetching principals:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get principal by ID
exports.getPrincipalById = async (req, res) => {
  try {
    const { schoolId, id: principalId } = req.params;
    const schoolDbName = await getSchoolDbName(schoolId);
    if (!schoolDbName) {
      return res.status(404).json({ success: false, message: "School not found" });
    }

    const Principal = getPrincipalModel(schoolDbName);
    const principal = await Principal.findOne({ principalId }).select("-password");

    if (!principal) {
      return res.status(404).json({ success: false, message: "Principal not found" });
    }

    res.json({ success: true, data: principal });
  } catch (error) {
    console.error("Error fetching principal by ID:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update principal
exports.updatePrincipal = async (req, res) => {
  try {
    const { schoolId, id: principalId } = req.params;
    const updateData = req.body;
    const schoolDbName = await getSchoolDbName(schoolId);
    if (!schoolDbName) {
      return res.status(404).json({ success: false, message: "School not found" });
    }

    const Principal = getPrincipalModel(schoolDbName);
    const currentPrincipal = await Principal.findOne({ principalId });

    if (!currentPrincipal) {
      return res.status(404).json({ success: false, message: "Principal not found" });
    }

    // Update email in EmailRegistry if email changed
    if (updateData.email && updateData.email.toLowerCase() !== currentPrincipal.email) {
      const newEmail = updateData.email.toLowerCase().trim();
      const existingEmail = await EmailRegistry.findOne({ email: newEmail });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: "New email is already in use" });
      }

      await EmailRegistry.findOneAndUpdate(
        { email: currentPrincipal.email },
        { email: newEmail }
      );
      updateData.email = newEmail;
    }

    // Sync status with EmailRegistry
    if (updateData.status && updateData.status !== currentPrincipal.status) {
      await EmailRegistry.findOneAndUpdate(
        { email: currentPrincipal.email },
        { status: updateData.status }
      );
    }

    const updatedPrincipal = await Principal.findOneAndUpdate(
      { principalId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    logActivity({
      schoolDb: getSchoolDbConnection(schoolDbName),
      schoolId,
      actor: req.user,
      action: "UPDATE",
      entity: "Principal",
      entityId: principalId,
      entityLabel: `${updatedPrincipal.firstName} ${updatedPrincipal.lastName}`,
      description: `Updated principal ${principalId}`,
    });

    res.json({ success: true, data: updatedPrincipal });
  } catch (error) {
    console.error("Error updating principal:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete principal (soft delete - set status to inactive)
exports.deletePrincipal = async (req, res) => {
  try {
    const { schoolId, id: principalId } = req.params;
    const schoolDbName = await getSchoolDbName(schoolId);
    if (!schoolDbName) {
      return res.status(404).json({ success: false, message: "School not found" });
    }

    const Principal = getPrincipalModel(schoolDbName);
    const principal = await Principal.findOne({ principalId });

    if (!principal) {
      return res.status(404).json({ success: false, message: "Principal not found" });
    }

    principal.status = "inactive";
    await principal.save();

    await EmailRegistry.findOneAndUpdate(
      { email: principal.email },
      { status: "inactive" }
    );

    logActivity({
      schoolDb: getSchoolDbConnection(schoolDbName),
      schoolId,
      actor: req.user,
      action: "DELETE",
      entity: "Principal",
      entityId: principalId,
      entityLabel: `${principal.firstName} ${principal.lastName}`,
      description: `Deactivated principal ${principalId}`,
    });

    res.json({ success: true, message: "Principal account deactivated successfully" });
  } catch (error) {
    console.error("Error deleting principal:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
