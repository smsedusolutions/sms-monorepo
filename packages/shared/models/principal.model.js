const mongoose = require("mongoose");
const { Schema } = mongoose;

const PrincipalSchema = new Schema(
  {
    schoolId: { type: String, required: true, index: true },
    principalId: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, index: true },
    password: { type: String, required: true },
    phone: { type: String },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    profileImage: { type: String },
    role: { type: String, default: "principal", immutable: true },
  },
  { timestamps: true }
);

PrincipalSchema.index({ schoolId: 1, principalId: 1 });
PrincipalSchema.index({ schoolId: 1, email: 1 });

module.exports = PrincipalSchema;
