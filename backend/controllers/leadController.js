const Lead = require("../models/Lead");
const { analyzeIntent, parseLeadText } = require("../utils/intentAnalyzer");

exports.getLeads = async (req, res) => {
  try {
    const { status, search, intentTier } = req.query;
    const filter = {
      isSpam: false,
      commentSnippet: { $exists: true, $ne: "" },
    };
    if (status && status !== "All") filter.status = status;
    if (intentTier && intentTier !== "All") filter.intentTier = intentTier;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
        { commentSnippet: { $regex: search, $options: "i" } },
      ];
    }
    res.json(await Lead.find(filter).sort({ createdAt: -1 }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getLeadStats = async (req, res) => {
  try {
    const validLeadFilter = {
      isSpam: false,
      commentSnippet: { $exists: true, $ne: "" },
    };
    const totalScanned = await Lead.countDocuments(validLeadFilter);
    const qualified = await Lead.countDocuments({
      ...validLeadFilter,
      intentTier: { $in: ["High Intent", "Medium Intent"] },
    });
    const contacted = await Lead.countDocuments({
      ...validLeadFilter,
      status: "Contacted",
    });
    const convertedLeads = await Lead.find({
      ...validLeadFilter,
      status: "Converted",
    });
    const converted = convertedLeads.length;
    const pipelineValue = convertedLeads.reduce(
      (sum, lead) => sum + (lead.dealValue || 0),
      0,
    );

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
      avgDealSize: converted ? Math.round(pipelineValue / converted) : 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    res.json(lead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.createLead = async (req, res) => {
  try {
    res.status(201).json(await Lead.create(req.body));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.extractLeads = async (req, res) => {
  try {
    let parsedLeads = req.body.structuredLeads;
    if (!Array.isArray(parsedLeads)) {
      if (!req.body.rawText?.trim()) {
        return res.status(400).json({ message: "Raw text is required" });
      }
      parsedLeads = await parseWithGemini(req.body.rawText);
    }

    const validLeads = parsedLeads.filter(
      (lead) => lead?.name?.trim() && lead?.commentSnippet?.trim(),
    );
    if (!validLeads.length) {
      return res.status(400).json({ message: "No valid leads found" });
    }

    const leads = await Lead.insertMany(
      validLeads.map((lead) => ({
        name: lead.name,
        title: lead.headline || lead.title || "",
        commentSnippet: lead.commentSnippet,
        intentTier:
          lead.intentScore || analyzeIntent(lead.commentSnippet).intentTier,
        intentTag: analyzeIntent(lead.commentSnippet).intentTag,
        matchScore: analyzeIntent(lead.commentSnippet).matchScore,
        avatarInitials: lead.name
          .split(/\s+/)
          .map((part) => part[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
        status: "New",
        isSpam: false,
      })),
    );
    res.status(201).json({
      message: "Leads extracted successfully",
      leads: Array.isArray(leads) ? leads : [leads],
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

async function parseWithGemini(rawText) {
  if (!process.env.GEMINI_API_KEY) {
    return parseLeadText(rawText).map((lead) => ({
      name: lead.name,
      headline: lead.headline,
      commentSnippet: lead.commentSnippet,
      intentScore: lead.intentScore,
    }));
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Parse these copied LinkedIn comments into qualified leads. Omit spam, reactions, system labels, bots, and entries without a real full name or comment. Return only the structured JSON array.\n\n${rawText}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING" },
                headline: { type: "STRING" },
                commentSnippet: { type: "STRING" },
                intentScore: {
                  type: "STRING",
                  enum: ["High Intent", "Medium Intent", "Low Intent"],
                },
              },
              required: ["name", "headline", "commentSnippet", "intentScore"],
            },
          },
        },
      }),
    },
  );
  if (!response.ok)
    throw new Error(`Gemini request failed (${response.status})`);
  const data = await response.json();
  return JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || "[]");
}

exports.updateLead = async (req, res) => {
  try {
    const updated = await Lead.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Lead not found" });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteLead = async (req, res) => {
  try {
    const deleted = await Lead.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Lead not found" });
    res.json({ message: "Lead deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.clearAllLeads = async (req, res) => {
  try {
    const result = await Lead.deleteMany({});
    res.json({
      message: "All leads deleted",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
