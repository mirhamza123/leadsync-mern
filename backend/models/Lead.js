const mongoose = require("mongoose");

const LeadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    title: { type: String, trim: true }, // e.g. "VP of Sales"
    company: { type: String, trim: true }, // e.g. "CloudScale"
    avatarInitials: { type: String, trim: true },
    avatarColor: { type: String, default: "bg-blue-600" },
    linkedinUrl: { type: String, trim: true },

    commentSnippet: { type: String, trim: true },
    commentTimestamp: { type: Date, default: Date.now },

    intentTier: {
      type: String,
      enum: ["High Intent", "Medium Intent", "Low Intent"],
      default: "Medium Intent",
    },
    intentTag: { type: String, trim: true }, // e.g. "DM Requested", "Pricing Inquiry"
    matchScore: { type: Number, min: 0, max: 100, default: 0 },

    status: {
      type: String,
      enum: ["New", "Contacted", "Converted"],
      default: "New",
    },
    contactedBy: { type: String, trim: true },
    contactedAt: { type: Date },

    dealValue: { type: Number, default: 0 },
    sourcePost: { type: String, trim: true },

    isSpam: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lead", LeadSchema);
