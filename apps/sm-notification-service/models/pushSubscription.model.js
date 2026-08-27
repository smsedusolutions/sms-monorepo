const mongoose = require("mongoose");
const { Schema } = mongoose;

const PushSubscriptionSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    aliases: {
      type: [String],
      default: [],
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

// Unique index on endpoint so each physical device/browser is stored exactly once
PushSubscriptionSchema.index({ endpoint: 1 }, { unique: true });
PushSubscriptionSchema.index({ userId: 1 });
PushSubscriptionSchema.index({ aliases: 1 });
PushSubscriptionSchema.index({ schoolId: 1, userId: 1 });

const PushSubscription =
  mongoose.models.PushSubscription ||
  mongoose.model("PushSubscription", PushSubscriptionSchema);

module.exports = PushSubscription;
