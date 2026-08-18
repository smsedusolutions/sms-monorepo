const { SchoolModel: School, MenuModel: Menu } = require("@sms/shared");
const { getSchoolDbConnection } = require("../configs/db");
const {
  getPaginationParams,
  formatPaginationResponse,
} = require("../utils/pagination");

const { generateNextId } = require("@sms/shared/utils");

// Helper function to generate schoolId
// Format: SCHL + 5 digit number (SCHL00001, SCHL00002, ... SCHL99999, SCHL100000)
const generateSchoolId = async () => {
  return generateNextId(School, "schoolId", "SCHL", 5);
};

const createSchool = async (req, res) => {
  try {
    const {
      schoolName,
      schoolLogo,
      dbName,
      status,
      schoolAddress,
      schoolEmail,
      schoolContact,
      schoolWebsite,
      attendanceSettings,
    } = req.body;

    // Validate dbName is provided
    if (!dbName) {
      return res.status(400).json({
        success: false,
        message: "dbName is required to create a school database",
      });
    }

    // Generate schoolDbName with prefix format
    const schoolDbName = `school-db-${dbName}`;

    // Check if a school with this dbName already exists
    const existingSchool = await School.findOne({ schoolDbName });
    if (existingSchool) {
      return res.status(400).json({
        success: false,
        message: `A school with database name '${schoolDbName}' already exists`,
      });
    }

    // Auto-generate schoolId
    const schoolId = await generateSchoolId();

    const newSchool = new School({
      schoolId,
      schoolName,
      schoolLogo,
      schoolDbName,
      status,
      schoolAddress,
      schoolEmail,
      schoolContact,
      schoolWebsite,
      attendanceSettings,
    });

    const savedSchool = await newSchool.save();

    // Initialize the school's database
    // MongoDB creates databases lazily, so we create an initialization collection
    try {
      const schoolDb = getSchoolDbConnection(schoolDbName);
      // Create an _init collection to ensure the database is created
      await schoolDb.collection("_init").insertOne({
        createdAt: new Date(),
        schoolId: schoolId,
        message: "Database initialized",
      });
      console.log(`✅ Database '${schoolDbName}' initialized successfully`);
    } catch (dbError) {
      console.error(`⚠️ Warning: Could not initialize database '${schoolDbName}':`, dbError.message);
      // Note: We don't fail the school creation if DB init fails
      // The database will be created when first collection is added
    }

    // Auto-assign default menus to the new school
    try {
      const result = await Menu.updateMany(
        { defaultMenu: true },
        { $addToSet: { schoolId: schoolId } },
      );
      console.log(`📋 Assigned ${result.modifiedCount} default menus to school ${schoolId}`);
    } catch (menuError) {
      console.error(`⚠️ Warning: Could not assign default menus to school ${schoolId}:`, menuError.message);
      // Don't fail school creation if menu assignment fails
    }

    return res.status(201).json({
      success: true,
      message: "School created successfully",
      data: savedSchool,
    });
  } catch (error) {
    console.error("Error creating school:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating school",
      error: error.message,
    });
  }
};

// Get school by schoolId
const getSchoolById = async (req, res) => {
  try {
    const { schoolId } = req.params;

    const school = await School.findOne({ schoolId });

    if (!school) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "School fetched successfully",
      data: school,
    });
  } catch (error) {
    console.error("Error fetching school:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching school",
      error: error.message,
    });
  }
};

// Get all schools
const getAllSchools = async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);

    // Fetch paginated results and total count in parallel
    const [schools, total] = await Promise.all([
      School.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      School.countDocuments(),
    ]);

    const response = formatPaginationResponse(schools, total, page, limit);

    return res.status(200).json({
      success: true,
      message: "Schools fetched successfully",
      ...response,
    });
  } catch (error) {
    console.error("Error fetching schools:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching schools",
      error: error.message,
    });
  }
};

// Update school by schoolId
const updateSchoolById = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const updateData = req.body;

    // Prevent updating schoolId
    delete updateData.schoolId;

    // Detect school status change for cascade deactivation
    if (updateData.status) {
      const currentSchool = await School.findOne({ schoolId });
      if (currentSchool && currentSchool.status !== updateData.status) {
        if (updateData.status === "inactive") {
          // Deactivate: add schoolId to deactivatedSchools on all menus containing it
          await Menu.updateMany(
            { schoolId: { $in: [schoolId] } },
            { $addToSet: { deactivatedSchools: schoolId } },
          );
          console.log(`🔒 Deactivated all menus for school ${schoolId}`);
        } else if (updateData.status === "active") {
          // Reactivate: remove schoolId from deactivatedSchools
          await Menu.updateMany(
            { deactivatedSchools: schoolId },
            { $pull: { deactivatedSchools: schoolId } },
          );
          console.log(`🔓 Reactivated all menus for school ${schoolId}`);
        }
      }
    }

    const updatedSchool = await School.findOneAndUpdate(
      { schoolId },
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedSchool) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "School updated successfully",
      data: updatedSchool,
    });
  } catch (error) {
    console.error("Error updating school:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating school",
      error: error.message,
    });
  }
};

// Get school by subdomain (PUBLIC — no auth required)
// Used by the login page to fetch school branding before user logs in
const getSchoolBySubdomain = async (req, res) => {
  try {
    const { subdomain } = req.params;

    if (!subdomain) {
      return res.status(400).json({
        success: false,
        message: "Subdomain is required",
      });
    }

    const school = await School.findOne(
      { subdomain: subdomain.toLowerCase().trim() },
      // Projection: only return public-safe fields
      {
        schoolName: 1,
        schoolLogo: 1,
        schoolAddress: 1,
        schoolEmail: 1,
        schoolContact: 1,
        schoolWebsite: 1,
        schoolTagline: 1,
        loginTheme: 1,
        status: 1,
        _id: 0,
      }
    );

    if (!school) {
      return res.status(404).json({
        success: false,
        schoolNotFound: true,
        message: `No school found for subdomain: ${subdomain}`,
      });
    }

    if (school.status === "inactive") {
      return res.status(403).json({
        success: false,
        message: "This school is currently inactive.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "School branding fetched successfully",
      data: school,
    });
  } catch (error) {
    console.error("Error fetching school by subdomain:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching school branding",
      error: error.message,
    });
  }
};

module.exports = {
  createSchool,
  getSchoolById,
  getAllSchools,
  updateSchoolById,
  getSchoolBySubdomain,
};
