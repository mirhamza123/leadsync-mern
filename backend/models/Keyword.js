const mongoose = require("mongoose");

const KeywordSchema = new mongoose.Schema(
  {
    term: { type: String, required: true, unique: true, trim: true },
    matchCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Keyword", KeywordSchema);
