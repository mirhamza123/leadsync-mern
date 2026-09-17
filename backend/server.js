require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const Lead = require("./models/Lead");
const { analyzeIntent, parseLeadText } = require("./utils/intentAnalyzer");

const leadRoutes = require("./routes/leadRoutes");
const keywordRoutes = require("./routes/keywordRoutes");

const app = express();

connectDB();

app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "LeadSync API running" });
});

app.post("/api/leads/extract", async (req, res) => {
  try {
    const { structuredLeads, rawText } = req.body || {};
    const extractedLeads = Array.isArray(structuredLeads)
      ? structuredLeads
      : parseLeadText(typeof rawText === "string" ? rawText : "");
    const parsedLeads = extractedLeads.map((lead) => ({
      name: lead?.name || lead?.authorName || "",
      headline: lead?.headline || lead?.title || "",
      commentSnippet: lead?.commentSnippet || lead?.text || "",
    }));
    const validLeads = parsedLeads.filter(
      (lead) => lead?.name?.trim() && lead?.commentSnippet?.trim(),
    );

    if (!validLeads.length) {
      return res.status(400).json({
        success: false,
        message: "No valid leads found",
        count: 0,
      });
    }

    const documents = validLeads.map((lead) => {
      const intent = analyzeIntent(lead.commentSnippet);
      return {
        name: lead.name.trim(),
        title: (lead.headline || lead.title || "").trim(),
        commentSnippet: lead.commentSnippet.trim(),
        intentTier: intent.intentTier,
        intentTag: intent.intentTag,
        matchScore: intent.matchScore,
        avatarInitials: lead.name
          .trim()
          .split(/\s+/)
          .map((part) => part[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
        status: "New",
        isSpam: false,
      };
    });
    const savedLeads = await Lead.insertMany(documents);
    return res.status(201).json({
      success: true,
      message: `${savedLeads.length} lead(s) extracted successfully`,
      count: savedLeads.length,
      leads: savedLeads,
    });
  } catch (error) {
    console.error("Lead extraction failed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save leads",
      count: 0,
    });
  }
});

app.use("/api/leads", leadRoutes);
app.use("/api/keywords", keywordRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server error" });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`),
);

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the existing backend process or choose another PORT.`,
    );
    process.exit(1);
  }

  console.error("Failed to start server:", error.message);
  process.exit(1);
});
