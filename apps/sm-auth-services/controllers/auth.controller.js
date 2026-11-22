const jwt = require("jsonwebtoken");
const { AdminModel: Admin, SchoolModel: School, EmailRegistryModel: EmailRegistry, PendingSuperAdminModel: PendingSuperAdmin, PasswordResetOtpModel: PasswordResetOtp } = require("@sms/shared");
const { sendEmail, verifyPassword, hashPassword } = require("@sms/shared/utils");
const { getSchoolDbConnection } = require("../configs/db");

// Schema imports for school database queries
const { TeacherSchema: teacherSchema, StudentSchema: studentSchema, ParentSchema: parentSchema, ClassSchema: classSchema, SubjectSchema: subjectSchema } = require("@sms/shared");

// Cache for school documents to avoid repeated database lookups on every login
const schoolCache = new Map();

const getSchoolById = async (schoolId) => {
    if (!schoolId) return null;
    if (schoolCache.has(schoolId)) {
        return schoolCache.get(schoolId);
    }
    const school = await School.findOne({ schoolId }).lean();
    if (school) {
        schoolCache.set(schoolId, school);
    }
    return school;
};

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
        }).lean();

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
            user = await Admin.findOne({ email: normalizedEmail }).lean();

            // Allow if status is active or undefined (legacy support)
            if (!user || (user.status && user.status !== "active")) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password",
                });
            }

            // SECURITY (GAP-001): bcrypt comparison with migration-aware fallback
            const { valid: pwValid, needsRehash } = await verifyPassword(password, user.password);
            if (!pwValid) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password",
                });
            }
            // Opportunistically upgrade legacy plaintext password to bcrypt
            if (needsRehash) {
                try {
                    const newHash = await hashPassword(password);
                    await Admin.updateOne({ email: normalizedEmail }, { password: newHash });
                } catch (rehashErr) {
                    console.error('Password rehash failed for super_admin:', rehashErr.message);
                }
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
                User.findOne({ email: normalizedEmail }).lean(),
                getSchoolById(schoolId),
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

            // SECURITY (GAP-001): bcrypt comparison with migration-aware fallback
            const { UserModel: UserForRehash } = require("@sms/shared");
            const { valid: pwValidSch, needsRehash: rehashSch } = await verifyPassword(password, user.password);
            if (!pwValidSch) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password",
                });
            }
            if (rehashSch) {
                try {
                    const newHash = await hashPassword(password);
                    await UserForRehash.updateOne({ email: normalizedEmail }, { password: newHash });
                } catch (rehashErr) {
                    console.error('Password rehash failed for sch_admin:', rehashErr.message);
                }
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
            // Teacher, Student, Parent, Driver, Principal - stored in school-specific database
            const school = await getSchoolById(schoolId);

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
                case "principal":
                    const { PrincipalSchema: principalSchema } = require("@sms/shared");
                    Model = schoolDb.model("Principal", principalSchema);
                    idField = "principalId";
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        message: "Invalid user role",
                    });
            }

            // Utilize compound index { email: 1, schoolId: 1 }
            user = await Model.findOne({ email: normalizedEmail, schoolId }).lean();
            if (!user) {
                user = await Model.findOne({ email: normalizedEmail }).lean();
            }

            if (!user || user.status !== "active") {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password",
                });
            }

            // SECURITY (GAP-001): bcrypt comparison with migration-aware fallback
            const { valid: pwValidRole, needsRehash: rehashRole } = await verifyPassword(password, user.password);
            if (!pwValidRole) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password",
                });
            }
            if (rehashRole) {
                try {
                    const newHash = await hashPassword(password);
                    await Model.updateOne({ email: normalizedEmail, schoolId }, { password: newHash });
                } catch (rehashErr) {
                    console.error(`Password rehash failed for ${role}:`, rehashErr.message);
                }
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

            // Add role-specific fields
            if (role === "teacher") {
                tokenPayload.teacherId = user.teacherId;
                tokenPayload.classes = user.classes || [];
                tokenPayload.subjects = user.subjects || [];
                tokenPayload.department = user.department;

                try {
                    const Subject = schoolDb.model("Subject", subjectSchema);
                    const subjectDocs = await Subject.find({ schoolId, subjectId: { $in: user.subjects || [] } }, 'name').lean();
                    tokenPayload.subjectNames = subjectDocs.map(s => s.name);
                } catch (e) {
                    tokenPayload.subjectNames = [];
                }
            } else if (role === "student") {
                tokenPayload.studentId = user.studentId;
                tokenPayload.class = user.class;
                tokenPayload.section = user.section;
                tokenPayload.rollNumber = user.rollNumber;

                try {
                    const Class = schoolDb.model("Class", classSchema);
                    const classDoc = await Class.findOne({ schoolId, classId: user.class }, 'name sections').lean();
                    if (classDoc) {
                        tokenPayload.className = classDoc.name;
                        const sectionDoc = classDoc.sections?.find(s => s.sectionId === user.section || s._id?.toString() === user.section || s.name === user.section);
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
            } else if (role === "principal") {
                tokenPayload.principalId = user.principalId;
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

const { generateNextId } = require("@sms/shared/utils");

// Helper function to generate adminId
const generateAdminId = async () => {
    return generateNextId(Admin, "adminId", "ADM", 5);
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

        // SECURITY (GAP-001): Hash password before storage
        const hashedPassword = await hashPassword(password);

        // Create admin
        const newAdmin = new Admin({
            adminId,
            username,
            email: normalizedEmail,
            password: hashedPassword,
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

        // SECURITY (GAP-001): Hash password before storing in pending table
        const hashedPassword = await hashPassword(password);

        const pending = new PendingSuperAdmin({
            username,
            email: normalizedEmail,
            password: hashedPassword,
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

// Request Password Reset OTP
const requestPasswordResetOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || typeof email !== 'string') {
            return res.status(400).json({
                success: false,
                message: "A valid email address is required",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Verify user exists in EmailRegistry and is active
        const emailEntry = await EmailRegistry.findOne({
            email: normalizedEmail,
            status: "active"
        }).lean();

        if (!emailEntry) {
            return res.status(404).json({
                success: false,
                message: "No active account found matching this email address.",
            });
        }

        // Generate cryptographically random 6-digit OTP
        const crypto = require("crypto");
        const otp = crypto.randomInt(100000, 999999).toString();

        // Upsert OTP record (valid for 10 minutes)
        await PasswordResetOtp.findOneAndUpdate(
            { email: normalizedEmail },
            { otp, verified: false, createdAt: new Date() },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Fetch school details if available to brand the email
        let schoolName = "SMS Edu Solutions";
        if (emailEntry.schoolId) {
            const school = await getSchoolById(emailEntry.schoolId);
            if (school && school.schoolName) {
                schoolName = school.schoolName;
            }
        }

        // Send OTP via Nodemailer
        const emailHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 6px 0;">Password Reset Request</h2>
                    <p style="color: #64748b; font-size: 14px; margin: 0;">${schoolName}</p>
                </div>
                <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                    Hello,
                </p>
                <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
                    We received a request to reset the password for your account (<strong>${normalizedEmail}</strong>). Use the one-time verification code below to proceed with setting a new password:
                </p>
                <div style="background-color: #f8fafc; border: 1.5px dashed #0284c7; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
                    <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0284c7; font-family: monospace;">
                        ${otp}
                    </div>
                    <p style="color: #64748b; font-size: 12px; margin: 8px 0 0 0;">Valid for 10 minutes</p>
                </div>
                <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-bottom: 24px;">
                    If you did not request a password reset, please disregard this email. Your existing password will remain active and secure.
                </p>
                <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
                <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
                    This is an automated security notice from ${schoolName}. Please do not reply directly to this email.
                </p>
            </div>
        `;

        await sendEmail({
            to: normalizedEmail,
            subject: `Password Reset Verification Code: ${otp}`,
            html: emailHtml,
            from: `${schoolName} Security`,
        });

        return res.status(200).json({
            success: true,
            message: "A 6-digit verification code has been sent to your email address.",
        });
    } catch (error) {
        console.error("Error requesting password reset OTP:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to process password reset request. Please check email configuration or try again later.",
            error: error.message,
        });
    }
};

// Verify Password Reset OTP
const verifyPasswordResetOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and verification code are required",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const trimmedOtp = String(otp).trim();

        const record = await PasswordResetOtp.findOne({ email: normalizedEmail });
        if (!record) {
            return res.status(400).json({
                success: false,
                message: "Verification code has expired or was not requested. Please request a new code.",
            });
        }

        if (record.otp !== trimmedOtp) {
            return res.status(400).json({
                success: false,
                message: "Invalid verification code. Please check your email and try again.",
            });
        }

        record.verified = true;
        await record.save();

        return res.status(200).json({
            success: true,
            message: "Verification code confirmed successfully.",
        });
    } catch (error) {
        console.error("Error verifying password reset OTP:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to verify code",
            error: error.message,
        });
    }
};

// Reset Password with OTP
const resetPasswordWithOtp = async (req, res) => {
    try {
        const { email, otp, newPassword, confirmPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Email, verification code, and new password are required",
            });
        }

        if (confirmPassword !== undefined && newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match",
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const trimmedOtp = String(otp).trim();

        const record = await PasswordResetOtp.findOne({ email: normalizedEmail });
        if (!record || record.otp !== trimmedOtp) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification session. Please request a new code.",
            });
        }

        // Check EmailRegistry for user role and location
        const emailEntry = await EmailRegistry.findOne({
            email: normalizedEmail,
            status: "active",
        }).lean();

        if (!emailEntry) {
            return res.status(404).json({
                success: false,
                message: "No active user account found matching this email address.",
            });
        }

        const { role, schoolId } = emailEntry;
        const hashedPassword = await hashPassword(newPassword);

        // Update password in the target collection
        if (role === "super_admin") {
            await Admin.updateOne(
                { email: normalizedEmail },
                { password: hashedPassword }
            );
        } else if (role === "sch_admin") {
            const { UserModel: User } = require("@sms/shared");
            await User.updateOne(
                { email: normalizedEmail },
                { password: hashedPassword }
            );
        } else {
            // School-specific user (Teacher, Student, Parent, Driver, Principal)
            const school = await getSchoolById(schoolId);
            if (!school) {
                return res.status(404).json({
                    success: false,
                    message: "School associated with user was not found.",
                });
            }

            const schoolDb = getSchoolDbConnection(school.schoolDbName);
            let Model;

            switch (role) {
                case "teacher":
                    Model = schoolDb.model("Teacher", teacherSchema);
                    break;
                case "student":
                    Model = schoolDb.model("Student", studentSchema);
                    break;
                case "parent":
                    Model = schoolDb.model("Parent", parentSchema);
                    break;
                case "driver":
                    const { DriverSchema: driverSchema } = require("@sms/shared");
                    Model = schoolDb.model("Driver", driverSchema);
                    break;
                case "principal":
                    const { PrincipalSchema: principalSchema } = require("@sms/shared");
                    Model = schoolDb.model("Principal", principalSchema);
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        message: "Unsupported role for password reset",
                    });
            }

            await Model.updateOne(
                { email: normalizedEmail },
                { password: hashedPassword }
            );
        }

        // Clean up the used OTP
        await PasswordResetOtp.deleteOne({ email: normalizedEmail });

        return res.status(200).json({
            success: true,
            message: "Password reset successfully. You can now log in with your new password.",
        });
    } catch (error) {
        console.error("Error resetting password with OTP:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to reset password",
            error: error.message,
        });
    }
};

module.exports = {
    login,
    verifyToken,
    createAdmin,
    requestSuperAdminOtp,
    confirmSuperAdminOtp,
    requestPasswordResetOtp,
    verifyPasswordResetOtp,
    resetPasswordWithOtp,
};
