const crypto = require("crypto");
const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const {
    AcademicYearSchema: academicYearSchema,
    SchoolModel: schoolModel
} = require("@sms/shared");

const getModels = (schoolDbName) => {
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return {
        AcademicYear: schoolDb.model("AcademicYear", academicYearSchema),
        School: schoolModel // Global DB model
    };
};

const generateAcademicYearId = () => "AY-" + crypto.randomBytes(3).toString("hex").toUpperCase();

// Helper: Seed default academic years for new schools
const seedDefaultAcademicYears = async (AcademicYear, schoolId) => {
    const defaultYears = [
        {
            schoolId,
            academicYearId: generateAcademicYearId(),
            name: "2024-2025",
            code: "2024-2025",
            startDate: new Date("2024-06-01"),
            endDate: new Date("2025-05-31"),
            isCurrent: false,
            status: "completed",
            description: "Previous Academic Year"
        },
        {
            schoolId,
            academicYearId: generateAcademicYearId(),
            name: "2025-2026",
            code: "2025-2026",
            startDate: new Date("2025-06-01"),
            endDate: new Date("2026-05-31"),
            isCurrent: false,
            status: "completed",
            description: "Previous Academic Year"
        },
        {
            schoolId,
            academicYearId: generateAcademicYearId(),
            name: "2026-2027",
            code: "2026-2027",
            startDate: new Date("2026-06-01"),
            endDate: new Date("2027-05-31"),
            isCurrent: true,
            status: "active",
            description: "Current Ongoing Academic Year"
        },
        {
            schoolId,
            academicYearId: generateAcademicYearId(),
            name: "2027-2028",
            code: "2027-2028",
            startDate: new Date("2027-06-01"),
            endDate: new Date("2028-05-31"),
            isCurrent: false,
            status: "upcoming",
            description: "Next Academic Year"
        }
    ];

    for (const yr of defaultYears) {
        const existing = await AcademicYear.findOne({ schoolId, code: yr.code });
        if (!existing) {
            await AcademicYear.create(yr);
        }
    }
};

// 1. Get All Academic Years (with automatic deduplication and seeding)
const getAcademicYears = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const schoolDbName = await getSchoolDbName(schoolId);
        const { AcademicYear, School } = getModels(schoolDbName);

        let years = await AcademicYear.find({ schoolId }).sort({ startDate: -1 });

        // Auto-seed defaults if empty
        if (years.length === 0) {
            await seedDefaultAcademicYears(AcademicYear, schoolId);
            years = await AcademicYear.find({ schoolId }).sort({ startDate: -1 });
        }

        // Automatic DB Cleanup: Remove any duplicates by code
        const seenCodes = new Set();
        const duplicateIdsToDelete = [];
        const uniqueYears = [];

        for (const yr of years) {
            const codeKey = (yr.code || yr.name || "").trim();
            if (seenCodes.has(codeKey)) {
                duplicateIdsToDelete.push(yr._id);
            } else {
                seenCodes.add(codeKey);
                uniqueYears.push(yr);
            }
        }

        if (duplicateIdsToDelete.length > 0) {
            await AcademicYear.deleteMany({ _id: { $in: duplicateIdsToDelete } });
        }

        // Normalize statuses relative to current academic year:
        const currentYear = uniqueYears.find(y => y.isCurrent) || uniqueYears[0];
        if (currentYear) {
            for (const yr of uniqueYears) {
                if (yr._id.toString() === currentYear._id.toString()) {
                    if (!yr.isCurrent || yr.status !== "active") {
                        yr.isCurrent = true;
                        yr.status = "active";
                        await AcademicYear.updateOne({ _id: yr._id }, { $set: { isCurrent: true, status: "active" } });
                    }
                } else {
                    yr.isCurrent = false;
                    const isBefore = new Date(yr.startDate).getTime() < new Date(currentYear.startDate).getTime();
                    const expectedStatus = isBefore ? "completed" : "upcoming";

                    if (yr.status !== "archived" && yr.status !== expectedStatus) {
                        yr.status = expectedStatus;
                        await AcademicYear.updateOne({ _id: yr._id }, { $set: { isCurrent: false, status: expectedStatus } });
                    } else if (yr.isCurrent) {
                        await AcademicYear.updateOne({ _id: yr._id }, { $set: { isCurrent: false } });
                    }
                }
            }

            if (School) {
                await School.updateOne({ schoolId }, { $set: { currentAcademicYear: currentYear.code } });
            }
        }

        // Sort: Current year first, then by startDate descending
        uniqueYears.sort((a, b) => {
            if (a.isCurrent && !b.isCurrent) return -1;
            if (!a.isCurrent && b.isCurrent) return 1;
            return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        });

        res.status(200).json({
            success: true,
            data: uniqueYears
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Get Current Academic Year
const getCurrentAcademicYear = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const schoolDbName = await getSchoolDbName(schoolId);
        const { AcademicYear } = getModels(schoolDbName);

        let current = await AcademicYear.findOne({ schoolId, isCurrent: true });

        if (!current) {
            let years = await AcademicYear.find({ schoolId }).sort({ isCurrent: -1, startDate: -1 });
            if (years.length === 0) {
                await seedDefaultAcademicYears(AcademicYear, schoolId);
                current = await AcademicYear.findOne({ schoolId, isCurrent: true });
            } else {
                current = years[0];
            }
        }

        res.status(200).json({
            success: true,
            data: current
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Create Academic Year
const createAcademicYear = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { name, code, startDate, endDate, isCurrent, status, description } = req.body;

        if (!name || !startDate || !endDate) {
            return res.status(400).json({ success: false, message: "Name, startDate, and endDate are required" });
        }

        const yearCode = (code || name).trim();
        const schoolDbName = await getSchoolDbName(schoolId);
        const { AcademicYear, School } = getModels(schoolDbName);

        // Check for duplicate code
        const existing = await AcademicYear.findOne({ schoolId, code: yearCode });
        if (existing) {
            return res.status(400).json({ success: false, message: `Academic year code '${yearCode}' already exists.` });
        }

        // If setting as current, unset previous current year
        if (isCurrent) {
            await AcademicYear.updateMany({ schoolId }, { $set: { isCurrent: false } });
            await School.updateOne({ schoolId }, { $set: { currentAcademicYear: yearCode } });
        }

        const newYear = new AcademicYear({
            schoolId,
            academicYearId: generateAcademicYearId(),
            name: name.trim(),
            code: yearCode,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            isCurrent: !!isCurrent,
            status: status || "active",
            description: description ? description.trim() : undefined,
            createdBy: req.user?.userId || "admin"
        });

        await newYear.save();

        res.status(201).json({
            success: true,
            message: "Academic year registered successfully",
            data: newYear
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. Update Academic Year
const updateAcademicYear = async (req, res) => {
    try {
        const { schoolId, id } = req.params;
        const { name, code, startDate, endDate, isCurrent, status, description } = req.body;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { AcademicYear, School } = getModels(schoolDbName);

        const year = await AcademicYear.findOne({
            schoolId,
            $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { academicYearId: id }]
        });

        if (!year) {
            return res.status(404).json({ success: false, message: "Academic year not found" });
        }

        const yearCode = code ? code.trim() : year.code;

        // If setting as current, unset previous current year
        if (isCurrent) {
            await AcademicYear.updateMany({ schoolId, _id: { $ne: year._id } }, { $set: { isCurrent: false } });
            await School.updateOne({ schoolId }, { $set: { currentAcademicYear: yearCode } });
            year.isCurrent = true;
        } else if (isCurrent === false && year.isCurrent) {
            // Keep at least one year as current or allow manual change
            year.isCurrent = false;
        }

        if (name) year.name = name.trim();
        if (code) year.code = yearCode;
        if (startDate) year.startDate = new Date(startDate);
        if (endDate) year.endDate = new Date(endDate);
        if (status) year.status = status;
        if (description !== undefined) year.description = description ? description.trim() : "";

        await year.save();

        res.status(200).json({
            success: true,
            message: "Academic year updated successfully",
            data: year
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 5. Set as Current Academic Year
const setCurrentAcademicYear = async (req, res) => {
    try {
        const { schoolId, id } = req.params;
        const schoolDbName = await getSchoolDbName(schoolId);
        const { AcademicYear, School } = getModels(schoolDbName);

        const year = await AcademicYear.findOne({
            schoolId,
            $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { academicYearId: id }]
        });

        if (!year) {
            return res.status(404).json({ success: false, message: "Academic year not found" });
        }

        if (year.status === "completed" || year.status === "archived") {
            return res.status(400).json({
                success: false,
                message: "Cannot set a completed or archived academic year as current."
            });
        }

        // Update previous years (earlier startDate) to completed
        await AcademicYear.updateMany(
            { schoolId, _id: { $ne: year._id }, startDate: { $lt: year.startDate }, status: { $ne: "archived" } },
            { $set: { isCurrent: false, status: "completed" } }
        );

        // Update future years (later startDate) to upcoming
        await AcademicYear.updateMany(
            { schoolId, _id: { $ne: year._id }, startDate: { $gt: year.startDate }, status: { $ne: "archived" } },
            { $set: { isCurrent: false, status: "upcoming" } }
        );

        // Ensure any remaining years unset isCurrent
        await AcademicYear.updateMany(
            { schoolId, _id: { $ne: year._id } },
            { $set: { isCurrent: false } }
        );

        year.isCurrent = true;
        year.status = "active";
        await year.save();

        if (School) {
            await School.updateOne({ schoolId }, { $set: { currentAcademicYear: year.code } });
        }

        res.status(200).json({
            success: true,
            message: `'${year.name}' is now set as the current academic year`,
            data: year
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 6. Delete Academic Year
const deleteAcademicYear = async (req, res) => {
    try {
        const { schoolId, id } = req.params;
        const schoolDbName = await getSchoolDbName(schoolId);
        const { AcademicYear } = getModels(schoolDbName);

        const year = await AcademicYear.findOne({
            schoolId,
            $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { academicYearId: id }]
        });

        if (!year) {
            return res.status(404).json({ success: false, message: "Academic year not found" });
        }

        if (year.isCurrent) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete the active/current academic year. Please set another year as current first."
            });
        }

        await AcademicYear.deleteOne({ _id: year._id });

        res.status(200).json({
            success: true,
            message: "Academic year deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAcademicYears,
    getCurrentAcademicYear,
    createAcademicYear,
    updateAcademicYear,
    setCurrentAcademicYear,
    deleteAcademicYear
};
