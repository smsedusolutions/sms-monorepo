const {
  UserModel: User,
  EmailRegistryModel: EmailRegistry,
  SchoolModel: School,
} = require("@sms/shared");
const {
  getPaginationParams,
  formatPaginationResponse,
} = require("../utils/pagination");

const { generateNextId } = require("@sms/shared/utils");

// Helper function to generate userId
const generateUserId = async () => {
  return generateNextId(User, "userId", "USR", 5);
};

// Create User (School Admin)
const createUser = async (req, res) => {
  try {
    const { username, email, password, role, schoolId, contactNumber, ...rest } =
      req.body;

    // Validate input
    if (!username || !email || !password || !schoolId) {
      return res.status(400).json({
        success: false,
        message: "Username, email, password, and schoolId are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists in EmailRegistry (global check)
    const existingEmail = await EmailRegistry.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already exists in the system",
      });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username already exists",
      });
    }

    // Generate userId
    const userId = await generateUserId();

    const newUser = new User({
      ...rest,
      userId,
      username,
      email: normalizedEmail,
      password, // Plain text for now
      role: role || "sch_admin",
      schoolId,
      contactNumber,
    });

    const savedUser = await newUser.save();

    // Register in EmailRegistry for unified login
    await EmailRegistry.create({
      email: normalizedEmail,
      role: savedUser.role,
      schoolId: savedUser.schoolId,
      userId: savedUser.userId,
      status: "active",
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        userId: savedUser.userId,
        username: savedUser.username,
        email: savedUser.email,
        role: savedUser.role,
        schoolId: savedUser.schoolId,
        contactNumber: savedUser.contactNumber,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating user",
      error: error.message,
    });
  }
};

// Get User by userId (with aggregated details)
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ userId }).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Convert to object to add additional fields
    const userObj = user.toObject();

    // Fetch school details for schoolName
    if (user.schoolId) {
      const school = await School.findOne({ schoolId: user.schoolId });
      if (school) {
        userObj.schoolName = school.schoolName;
      }
    }

    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: userObj,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: error.message,
    });
  }
};

// Get all Users
const getAllUsers = async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);

    // Fetch paginated results and total count in parallel
    const [users, total] = await Promise.all([
      User.find()
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(),
    ]);

    const response = formatPaginationResponse(users, total, page, limit);

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      ...response,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
};

// Update User by userId
const updateUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    // Prevent updating userId
    delete updateData.userId;

    // Get current user for email comparison
    const currentUser = await User.findOne({ userId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // If email is being updated, update EmailRegistry too
    if (updateData.email && updateData.email !== currentUser.email) {
      const normalizedEmail = updateData.email.toLowerCase().trim();

      // Check if new email exists
      const existingEmail = await EmailRegistry.findOne({ email: normalizedEmail });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already exists in the system",
        });
      }

      // Update EmailRegistry
      await EmailRegistry.findOneAndUpdate(
        { email: currentUser.email.toLowerCase() },
        { email: normalizedEmail }
      );

      updateData.email = normalizedEmail;
    }

    // If status is being updated, update EmailRegistry too
    if (updateData.status) {
      await EmailRegistry.findOneAndUpdate(
        { email: currentUser.email.toLowerCase() },
        { status: updateData.status }
      );
    }

    // Map phone field to contactNumber if phone is provided
    if (updateData.phone && !updateData.contactNumber) {
      updateData.contactNumber = updateData.phone;
    }

    const updatedUser = await User.findOneAndUpdate(
      { userId },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating user",
      error: error.message,
    });
  }
};

// Delete User by userId (soft delete)
const deleteUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Soft delete - set status to inactive
    await User.findOneAndUpdate({ userId }, { status: "inactive" });

    // Update EmailRegistry status
    await EmailRegistry.findOneAndUpdate(
      { email: user.email.toLowerCase() },
      { status: "inactive" }
    );

    return res.status(200).json({
      success: true,
      message: "User deleted successfully (soft delete)",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message,
    });
  }
};

module.exports = {
  createUser,
  getUserById,
  getAllUsers,
  updateUserById,
  deleteUserById,
};
