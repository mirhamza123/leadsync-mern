const express = require("express");
const controller = require("../controllers/leadController");

const router = express.Router();

router.get("/stats", controller.getLeadStats);
router.get("/", controller.getLeads);
router.post("/extract", controller.extractLeads);
router.post("/", controller.createLead);
router.get("/:id", controller.getLead);
router.patch("/:id", controller.updateLead);
router.delete("/:id", controller.deleteLead);

module.exports = router;
