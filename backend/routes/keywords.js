const express = require("express");
const router = express.Router();
const Keyword = require("../models/Keyword");

// GET /api/keywords
router.get("/", async (req, res) => {
  try {
    const keywords = await Keyword.find({}).sort({ matchCount: -1 });
    res.json(keywords);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/keywords  { term }
router.post("/", async (req, res) => {
  try {
    const term = req.body.term?.trim();
    if (!term) return res.status(400).json({ message: "Term is required" });

    const existing = await Keyword.findOne({ term: new RegExp(`^${term}$`, "i") });
    if (existing) return res.status(409).json({ message: "Keyword already exists" });

    const keyword = await Keyword.create({ term });
    res.status(201).json(keyword);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/keywords/:id
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Keyword.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Keyword not found" });
    res.json({ message: "Keyword removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
