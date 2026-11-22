const mongoose = require("mongoose");

const passwordResetOtpSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        otp: {
            type: String,
            required: true,
        },
        verified: {
            type: Boolean,
            default: false,
        },
        createdAt: {
            type: Date,
            default: Date.now,
            expires: 600, // TTL index: auto delete document after 10 minutes (600s)
        },
    },
    {
        timestamps: true,
    }
);

// Prevent re-compilation in development / serverless environments
module.exports =
    mongoose.models.PasswordResetOtp ||
    mongoose.model("PasswordResetOtp", passwordResetOtpSchema);
