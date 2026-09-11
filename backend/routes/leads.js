const express = require("express");
const router = express.Router();
const Lead = require("../models/Lead");

// GET /api/leads?status=New&search=marcus
router.get("/", async (req, res) => {
  try {
    const { status, search, intentTier } = req.query;
    const filter = {};

    if (status && status !== "All") filter.status = status;
    if (intentTier && intentTier !== "All") filter.intentTier = intentTier;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
        { commentSnippet: { $regex: search, $options: "i" } },
      ];
    }

    const leads = await Lead.find(filter).sort({ createdAt: -1 });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/leads/stats  -> dashboard summary cards
router.get("/stats", async (req, res) => {
  try {
    const totalScanned = await Lead.countDocuments({});
    const qualified = await Lead.countDocuments({
      intentTier: { $in: ["High Intent", "Medium Intent"] },
    });
    const contacted = await Lead.countDocuments({ status: "Contacted" });
    const convertedLeads = await Lead.find({ status: "Converted" });
    const converted = convertedLeads.length;
    const pipelineValue = convertedLeads.reduce(
      (sum, l) => sum + (l.dealValue || 0),
      0
    );
    const avgDealSize = converted > 0 ? Math.round(pipelineValue / converted) : 0;

    res.json({
      totalScanned,
      qualified,
      qualificationRate: totalScanned
        ? +((qualified / totalScanned) * 100).toFixed(2)
        : 0,
      contacted,
      outreachRate: qualified ? +((contacted / qualified) * 100).toFixed(1) : 0,
      converted,
      pipelineValue,
      avgDealSize,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/leads/:id
router.get("/:id", async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/leads  -> manual quick input or scraper extraction
router.post("/", async (req, res) => {
  try {
    const lead = new Lead(req.body);
    const saved = await lead.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/leads/:id  -> e.g. push to CRM / update status
router.patch("/:id", async (req, res) => {
  try {
    const updated = await Lead.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Lead not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/leads/:id
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Lead.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Lead not found" });
    res.json({ message: "Lead deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
