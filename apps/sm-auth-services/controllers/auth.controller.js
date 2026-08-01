const jwt = require("jsonwebtoken");
const { AdminModel: Admin, SchoolModel: School, EmailRegistryModel: EmailRegistry, PendingSuperAdminModel: PendingSuperAdmin } = require("@sms/shared");
const { sendEmail } = require("@sms/shared/utils");
const { getSchoolDbConnection } = require("../configs/db");

// Schema imports for school database queries
const { TeacherSchema: teacherSchema, StudentSchema: studentSchema, ParentSchema: parentSchema, ClassSchema: classSchema, SubjectSchema: subjectSchema } = require("@sms/shared");

/**
 * Unified Login - Single login for all user types
 * User only provides email + password
 * System auto-detects role via EmailRegistry
 */
const login = async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Step 1: Lookup email in EmailRegistry for fast role/school detection
        const emailEntry = await EmailRegistry.findOne({
            email: normalizedEmail,
            status: "active"
        });

        if (!emailEntry) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const { role, schoolId, userId } = emailEntry;

        let user;
        let tokenPayload;

        // Step 2: Authenticate based on role
        if (role === "super_admin") {
            // Super Admin - stored in Admin collection
            user = await Admin.findOne({ email: normalizedEmail });

            // Allow if status is active or undefined (legacy support)
            if (!user || (user.status && user.status !== "active")) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password",
                });
            }

            if (password !== user.password) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password",
                });
            }

            tokenPayload = {
                adminId: user.adminId,
                email: user.email,
                username: user.username,
                role: user.role,
            };

        } else if (role === "sch_admin") {
            // School Admin - stored in Users collection (SuperAdmin DB)
            const { UserModel: User } = require("@sms/shared");

            // Parallel fetch: user + school lookup (schoolId known from EmailRegistry)
            const [schAdminUser, school] = await Promise.all([
                User.findOne({ email: normalizedEmail }),
                School.findOne({ schoolId }),
            ]);
            user = schAdminUser;

            if (!user || user.status !== "active") {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password",
                });
            }

            // Verify school is active
            if (!school || school.status !== "active") {
                return res.status(403).json({
                    success: false,
                    message: "Your school is currently inactive",
                });
            }

            if (password !== user.password) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password",
                });
            }

            tokenPayload = {
                userId: user.userId,
                email: user.email,
                role: user.role,
                schoolId: user.schoolId,
                schoolDbName: school.schoolDbName,
                schoolName: school.schoolName,
            };

        } else {
            // Teacher, Student, Parent, Driver - stored in school-specific database
            // We need the school to get schoolDbName, but we can resolve the model
            // schema early and fetch school + user in parallel once we have schoolDb.
            const school = await School.findOne({ schoolId });

            if (!school || school.status !== "active") {
                return res.status(403).json({
                    success: false,
                    message: "Your school is currently inactive",
                });
            }

            const schoolDb = getSchoolDbConnection(school.schoolDbName);
            let Model;
            let idField;

            switch (role) {
                case "teacher":
                    Model = schoolDb.model("Teacher", teacherSchema);
                    idField = "teacherId";
                    break;
                case "student":
                    Model = schoolDb.model("Student", studentSchema);
                    idField = "studentId";
                    break;
                case "parent":
                    Model = schoolDb.model("Parent", parentSchema);
                    idField = "parentId";
                    break;
                case "driver":
                    const { DriverSchema: driverSchema } = require("@sms/shared");
                    Model = schoolDb.model("Driver", driverSchema);
                    idField = "driverId";
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        message: "Invalid user role",
                    });
            }

            user = await Model.findOne({ email: normalizedEmail });

            if (!user || user.status !== "active") {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password",
                });
            }

            if (password !== user.password) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password",
                });
            }

            // Build role-specific token payload
            tokenPayload = {
                userId: user[idField],
                email: user.email,
                role: role,
                schoolId: schoolId,
                schoolDbName: school.schoolDbName,
                schoolName: school.schoolName,
                firstName: user.firstName,
                lastName: user.lastName,
            };

            // Add role-specific fields — enrichment queries run in parallel where possible
            if (role === "teacher") {
                tokenPayload.teacherId = user.teacherId;
                tokenPayload.classes = user.classes || [];
                tokenPayload.subjects = user.subjects || [];
                tokenPayload.department = user.department;

                // Fetch subject names (non-blocking — failure is acceptable)
                try {
                    const Subject = schoolDb.model("Subject", subjectSchema);
                    const subjectDocs = await Subject.find({ subjectId: { $in: user.subjects || [] } }).lean();
                    tokenPayload.subjectNames = subjectDocs.map(s => s.name);
                } catch (e) {
                    tokenPayload.subjectNames = [];
                }
            } else if (role === "student") {
                tokenPayload.studentId = user.studentId;
                tokenPayload.class = user.class;
                tokenPayload.section = user.section;
                tokenPayload.rollNumber = user.rollNumber;

                // Fetch class and section names
                try {
                    const Class = schoolDb.model("Class", classSchema);
                    const classDoc = await Class.findOne({ classId: user.class }).lean();
                    if (classDoc) {
                        tokenPayload.className = classDoc.name;
                        const sectionDoc = classDoc.sections?.find(s => s.sectionId === user.section || s._id?.toString() === user.section);
                        tokenPayload.sectionName = sectionDoc?.name || user.section;
                    }
                } catch (e) {
                    // Fallback to IDs if lookup fails
                }
            } else if (role === "parent") {
                tokenPayload.parentId = user.parentId;
                tokenPayload.studentIds = user.studentIds || [];
            } else if (role === "driver") {
                tokenPayload.driverId = user.driverId;
                tokenPayload.currentVehicleId = user.currentVehicleId;
                tokenPayload.currentRouteId = user.currentRouteId;
            }
        }

        // Step 3: Generate JWT token
        const token = jwt.sign(
            tokenPayload,
            process.env.JWT_SECRET,
            { expiresIn: rememberMe ? "30d" : (process.env.JWT_EXPIRES_IN || "7d") }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                token,
                user: {
                    ...tokenPayload,
                    firstName: user.firstName,
                    lastName: user.lastName,
                },
            },
        });

    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({
            success: false,
            message: "Error during login",
            error: error.message,
        });
    }
};

// Verify Token (optional - for checking token validity)
const verifyToken = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "No token provided",
            });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        return res.status(200).json({
            success: true,
            message: "Token is valid",
            data: {
                userId: decoded.userId || decoded.adminId,
                email: decoded.email,
                role: decoded.role,
                schoolId: decoded.schoolId,
            },
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};

// Helper function to generate adminId
const generateAdminId = async () => {
    const lastAdmin = await Admin.findOne().sort({ adminId: -1 });

    if (!lastAdmin || !lastAdmin.adminId) {
        return "ADM00001";
    }

    const lastIdNumber = parseInt(lastAdmin.adminId.replace("ADM", ""), 10);
    const newIdNumber = lastIdNumber + 1;

    return `ADM${String(newIdNumber).padStart(5, "0")}`;
};

// Create Super Admin (initial setup or by existing super_admin)
const createAdmin = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Username, email, and password are required",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check if email already exists in EmailRegistry
        const existingEmail = await EmailRegistry.findOne({ email: normalizedEmail });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: "Email already exists",
            });
        }

        // Check if username already exists
        const existingAdmin = await Admin.findOne({ username });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: "Username already exists",
            });
        }

        // Generate adminId
        const adminId = await generateAdminId();

        // Create admin
        const newAdmin = new Admin({
            adminId,
            username,
            email: normalizedEmail,
            password,
            role: "super_admin",
            status: "active",
        });

        const savedAdmin = await newAdmin.save();

        // Register in EmailRegistry for unified login
        await EmailRegistry.create({
            email: normalizedEmail,
            role: "super_admin",
            schoolId: null,
            userId: adminId,
            status: "active",
        });

        return res.status(201).json({
            success: true,
            message: "Super Admin created successfully",
            data: {
                adminId: savedAdmin.adminId,
                username: savedAdmin.username,
                email: savedAdmin.email,
                role: savedAdmin.role,
            },
        });
    } catch (error) {
        console.error("Error creating admin:", error);
        return res.status(500).json({
            success: false,
            message: "Error creating admin",
            error: error.message,
        });
    }
};

// Helper to generate 6 digit numeric OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Request Super Admin OTP
const requestSuperAdminOtp = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Username, email, and password are required",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check if email already exists in EmailRegistry
        const existingEmail = await EmailRegistry.findOne({ email: normalizedEmail });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: "Email is already registered in the system",
            });
        }

        // Check if username already exists in Admin
        const existingAdmin = await Admin.findOne({ username });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: "Username is already taken",
            });
        }

        // Check if super_admin_mail is set in env
        const superAdminMail = process.env.super_admin_mail || process.env.SUPER_ADMIN_MAIL;
        if (!superAdminMail) {
            return res.status(500).json({
                success: false,
                message: "Default super admin email is not configured in the system environment",
            });
        }

        // Generate OTP
        const otp = generateOTP();

        // Delete any existing pending registrations for this email
        await PendingSuperAdmin.deleteMany({ email: normalizedEmail });

        const pending = new PendingSuperAdmin({
            username,
            email: normalizedEmail,
            password,
            otp,
            createdAt: new Date()
        });

        await pending.save();

        // Send OTP email
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #333; text-align: center;">Super Admin Creation Request</h2>
                <p>Hello,</p>
                <p>A request was made to create a new Super Admin account with the following details:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">Username:</td>
                        <td style="padding: 8px; border-bottom: 1px solid #eee;">${username}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
                        <td style="padding: 8px; border-bottom: 1px solid #eee;">${normalizedEmail}</td>
                    </tr>
                </table>
                <p>Please use the following One-Time Password (OTP) to confirm this creation. This OTP is valid for 5 minutes.</p>
                <div style="background-color: #f7f7f7; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #4CAF50; border-radius: 4px; margin: 20px 0;">
                    ${otp}
                </div>
                <p style="color: #666; font-size: 12px; text-align: center;">If you did not initiate this request, please ignore this email.</p>
            </div>
        `;

        await sendEmail({
            to: superAdminMail,
            subject: "Verify Super Admin Creation",
            html: emailContent,
            from: "Spexzee System Administration"
        });

        return res.status(200).json({
            success: true,
            message: "Verification code sent to the default super admin email address",
        });

    } catch (error) {
        console.error("Error requesting super admin OTP:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to process request",
            error: error.message
        });
    }
};

// Confirm Super Admin OTP and Create
const confirmSuperAdminOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and verification code are required",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Find pending registration
        const pending = await PendingSuperAdmin.findOne({ email: normalizedEmail });
        if (!pending) {
            return res.status(404).json({
                success: false,
                message: "No pending super admin registration found for this email",
            });
        }

        // Verify OTP code
        if (pending.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid verification code",
            });
        }

        // Check expiration (5 minutes = 300000ms)
        const timeDiff = new Date() - pending.createdAt;
        if (timeDiff > 300000) {
            await PendingSuperAdmin.deleteOne({ _id: pending._id });
            return res.status(400).json({
                success: false,
                message: "Verification code has expired. Please request a new one",
            });
        }

        // Double check if username/email already taken in the meantime
        const existingEmail = await EmailRegistry.findOne({ email: normalizedEmail });
        if (existingEmail) {
            await PendingSuperAdmin.deleteOne({ _id: pending._id });
            return res.status(400).json({
                success: false,
                message: "Email is already registered in the system",
            });
        }

        const existingAdmin = await Admin.findOne({ username: pending.username });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: "Username is already taken",
            });
        }

        // Generate adminId
        const adminId = await generateAdminId();

        // Create Super Admin
        const newAdmin = new Admin({
            adminId,
            username: pending.username,
            email: normalizedEmail,
            password: pending.password,
            role: "super_admin",
            status: "active",
        });

        await newAdmin.save();

        // Save in EmailRegistry
        await EmailRegistry.create({
            email: normalizedEmail,
            role: "super_admin",
            schoolId: null,
            userId: adminId,
            status: "active",
        });

        // Clean up pending registration
        await PendingSuperAdmin.deleteOne({ _id: pending._id });

        return res.status(201).json({
            success: true,
            message: "Super Admin created successfully!",
            data: {
                adminId,
                username: pending.username,
                email: normalizedEmail,
                role: "super_admin",
            }
        });

    } catch (error) {
        console.error("Error confirming super admin OTP:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to verify code and create super admin",
            error: error.message
        });
    }
};

module.exports = {
    login,
    verifyToken,
    createAdmin,
    requestSuperAdminOtp,
    confirmSuperAdminOtp,
};
