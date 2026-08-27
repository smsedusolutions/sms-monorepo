const mongoose = require("mongoose");
const { Schema } = mongoose;

const PushSubscriptionSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    schoolId: {
      type: String,
      required: true,
      index: true,
    },
    userRole: {
      type: String,
      required: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
    keys: {
      p256dh: {
        type: String,
        required: true,
      },
      auth: {
        type: String,
        required: true,
      },
    },
    userAgent: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Compound unique index on userId and endpoint to prevent duplicate device registrations
PushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true });
PushSubscriptionSchema.index({ schoolId: 1, userId: 1 });

const PushSubscription =
  mongoose.models.PushSubscription ||
  mongoose.model("PushSubscription", PushSubscriptionSchema);

module.exports = PushSubscription;
