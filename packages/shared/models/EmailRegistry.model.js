const mongoose = require("mongoose");

/**
 * EmailRegistry - Global index of all user emails across the system
 * Used for fast O(1) lookup of which school/role an email belongs to
 * This prevents slow queries across multiple school databases
 */
const emailRegistrySchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        role: {
            type: String,
            required: true,
            enum: ["super_admin", "sch_admin", "teacher", "student", "parent", "driver", "principal"],
            index: true,
        },
        schoolId: {
            type: String,
            default: null,
            index: true,
        },
        userId: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

emailRegistrySchema.index({ email: 1, status: 1 });
emailRegistrySchema.index({ schoolId: 1, role: 1 });

module.exports = mongoose.model("EmailRegistry", emailRegistrySchema);
