const express = require("express");
const router = express.Router();
const { internalAuth } = require("../middlewares/internalAuth");
const { handleInternalNotify } = require("../controllers/internal.controller");

// Internal endpoint protected by X-Internal-Secret header
router.post("/notify", internalAuth, handleInternalNotify);

module.exports = router;
