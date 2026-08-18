// apps/sm-user-service/controllers/driver.controller.js
const { getSchoolDbConnection } = require("../configs/db");
const {
  SchoolModel: School,
  EmailRegistryModel: EmailRegistry,
  DriverSchema: driverSchema,
} = require("@sms/shared");
const {
  getPaginationParams,
  formatPaginationResponse,
} = require("../utils/pagination");
const { logActivity } = require("@sms/shared/utils");

const getDriverModel = (schoolDbName) => {
  const schoolDb = getSchoolDbConnection(schoolDbName);
  return schoolDb.model("Driver", driverSchema);
};

const { generateNextId } = require("@sms/shared/utils");

const generateDriverId = async (Driver) => {
  return generateNextId(Driver, "driverId", "DRV", 5);
};

const getSchoolDbName = async (schoolId) => {
  const school = await School.findOne({ schoolId });
  return school ? school.schoolDbName : null;
};

exports.createDriver = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { firstName, lastName, email, password, phone, licenseNumber, licenseExpiry, status, profileImage } = req.body;

    if (!firstName || !lastName || !email || !password || !licenseNumber) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (await EmailRegistry.findOne({ email: normalizedEmail })) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    const schoolDbName = await getSchoolDbName(schoolId);
    const Driver = getDriverModel(schoolDbName);
    const driverId = await generateDriverId(Driver);

    const newDriver = new Driver({
      driverId, schoolId, firstName, lastName, email: normalizedEmail,
      password, phone, licenseNumber, licenseExpiry, status: status || "active", profileImage
    });

    const savedDriver = await newDriver.save();

    await EmailRegistry.create({
      email: normalizedEmail, role: "driver", schoolId, userId: driverId, status: savedDriver.status
    });

    logActivity({
      schoolDb: getSchoolDbConnection(schoolDbName), schoolId, actor: req.user,
      action: "CREATE", entity: "Driver", entityId: driverId,
      entityLabel: `${firstName} ${lastName}`, description: `Created driver ${driverId}`
    });

    res.status(201).json({ success: true, data: savedDriver });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllDrivers = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { page, limit, skip } = getPaginationParams(req.query);
    const schoolDbName = await getSchoolDbName(schoolId);
    const Driver = getDriverModel(schoolDbName);

    const [drivers, total] = await Promise.all([
      Driver.find({}).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit),
      Driver.countDocuments({})
    ]);

    res.json({ success: true, ...formatPaginationResponse(drivers, total, page, limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateDriver = async (req, res) => {
  try {
    const { schoolId, id: driverId } = req.params;
    const updateData = req.body;
    const schoolDbName = await getSchoolDbName(schoolId);
    const Driver = getDriverModel(schoolDbName);

    const currentDriver = await Driver.findOne({ driverId });
    if (!currentDriver) return res.status(404).json({ success: false, message: "Driver not found" });

    if (updateData.email && updateData.email.toLowerCase() !== currentDriver.email) {
       // Update logic for email registry...
    }

    const updated = await Driver.findOneAndUpdate({ driverId }, updateData, { new: true }).select("-password");
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteDriver = async (req, res) => {
  try {
    const { schoolId, id: driverId } = req.params;
    const schoolDbName = await getSchoolDbName(schoolId);
    const Driver = getDriverModel(schoolDbName);

    const driver = await Driver.findOne({ driverId });
    if (!driver) {
      return res.status(404).json({ success: false, message: "Driver not found" });
    }

    // Delete from EmailRegistry to free up the email
    await EmailRegistry.findOneAndDelete({ userId: driverId, schoolId });

    // Delete the driver
    await Driver.findOneAndDelete({ driverId });

    logActivity({
      schoolDb: getSchoolDbConnection(schoolDbName), schoolId, actor: req.user,
      action: "DELETE", entity: "Driver", entityId: driverId,
      entityLabel: `${driver.firstName} ${driver.lastName}`, description: `Deleted driver ${driverId}`
    });

    res.json({ success: true, message: "Driver deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDriverById = async (req, res) => {
  try {
    const { schoolId, id: driverId } = req.params;
    const schoolDbName = await getSchoolDbName(schoolId);
    const Driver = getDriverModel(schoolDbName);

    const driver = await Driver.findOne({ driverId }).select("-password");
    if (!driver) {
      return res.status(404).json({ success: false, message: "Driver not found" });
    }

    res.json({ success: true, data: driver });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

