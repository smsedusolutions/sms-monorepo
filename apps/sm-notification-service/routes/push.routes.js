const express = require("express");
const router = express.Router();
const { Authenticated } = require("@sms/shared/middlewares");
const {
  getVapidPublicKey,
  subscribe,
  unsubscribe,
  getSubscriptionStatus,
} = require("../controllers/push.controller");

// Public: Retrieve VAPID Public Key to create subscriptions in browser
router.get("/vapid-public-key", getVapidPublicKey);

// Authenticated: Register or update browser push subscription
router.post("/subscribe", Authenticated, subscribe);

// Authenticated: Remove browser push subscription
router.delete("/unsubscribe", Authenticated, unsubscribe);

// Authenticated: Get current subscription status
router.get("/status", Authenticated, getSubscriptionStatus);

module.exports = router;
