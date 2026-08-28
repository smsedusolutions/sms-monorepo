// packages/shared/models/driver.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const DriverSchema = new Schema({
    schoolId: { type: String, required: true, index: true },
    driverId: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, index: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    
    // License info for alerts
    licenseNumber: { type: String, required: true },
    licenseExpiry: { type: Date },
    
    status: { type: String, enum: ['active', 'inactive', 'on-leave'], default: 'active' },
    profileImage: { type: String },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    dateOfBirth: { type: Date },
    role: { type: String, default: 'driver' },
    
    // Tracking current assignment
    currentVehicleId: { type: String },
    currentRouteId: { type: String },
}, { timestamps: true });

DriverSchema.index({ schoolId: 1, driverId: 1 });
DriverSchema.index({ schoolId: 1, email: 1 });

module.exports = DriverSchema;
