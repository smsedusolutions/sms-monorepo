const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            unique: true,
        },
        username: {
            type: String,
            required: true,
            unique: true,
        },
        firstName: {
            type: String,
        },
        lastName: {
            type: String,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ["sch_admin"],
            default: "sch_admin",
        },
        schoolId: {
            type: String,
            required: true,
        },
        contactNumber: {
            type: String,
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
        profileImage: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("User", userSchema);
