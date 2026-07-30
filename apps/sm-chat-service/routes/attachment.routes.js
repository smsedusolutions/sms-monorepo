const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const { uploadAttachment, getAttachmentFile } = require("../controllers/attachmentController");
const { Authenticated } = require("@sms/shared/middlewares");

router.post("/upload", Authenticated, upload.single("file"), uploadAttachment);
router.get("/file/:filename", getAttachmentFile);

module.exports = router;
