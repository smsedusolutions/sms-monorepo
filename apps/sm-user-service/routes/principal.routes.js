// apps/sm-user-service/routes/principal.routes.js
const express = require("express");
const router = express.Router({ mergeParams: true });
const principalController = require("../controllers/principal.controller");

router.post("/", principalController.createPrincipal);
router.get("/", principalController.getAllPrincipals);
router.get("/:id", principalController.getPrincipalById);
router.put("/:id", principalController.updatePrincipal);
router.delete("/:id", principalController.deletePrincipal);

module.exports = router;
