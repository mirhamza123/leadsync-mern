const Keyword = require("../models/Keyword");

exports.getKeywords = async (req, res) => {
  try {
    const keywords = await Keyword.find({}).sort({ matchCount: -1 });
    res.json(keywords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createKeyword = async (req, res) => {
  try {
    const term = req.body.term?.trim();
    if (!term) return res.status(400).json({ message: "Term is required" });

    const existing = await Keyword.findOne({
      term: {
        $regex: `^${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    });
    if (existing)
      return res.status(409).json({ message: "Keyword already exists" });

    const keyword = await Keyword.create({ term });
    res.status(201).json(keyword);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteKeyword = async (req, res) => {
  try {
    const deleted = await Keyword.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Keyword not found" });
    res.json({ message: "Keyword removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
