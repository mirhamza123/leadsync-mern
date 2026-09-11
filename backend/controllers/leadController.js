const Lead = require("../models/Lead");

// 1. Fetch all non-spam leads
exports.getLeads = async (req, res) => {
  try {
    const leads = await Lead.find({ isSpam: false }).sort({ createdAt: -1 });
    res.status(200).json(leads);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching leads", error: error.message });
  }
};

// 2. Extract Leads from Manual Text
exports.extractLeads = async (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText)
      return res.status(400).json({ message: "Raw text is required" });

    const lines = rawText.split("\n").filter((line) => line.trim() !== "");
    const newLeads = [];

    for (const line of lines) {
      const parts = line.split(":");
      const name = parts.length > 1 ? parts[0].trim() : "Anonymous Lead";
      const commentSnippet =
        parts.length > 1 ? parts.slice(1).join(":").trim() : line.trim();

      // Initials calculation (e.g. "Marcus Vance" -> "MV")
      const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      const lead = new Lead({
        name,
        commentSnippet,
        avatarInitials: initials || "LD",
        intentTier: "High Intent",
        intentTag: "DM Requested",
        matchScore: Math.floor(Math.random() * (99 - 85 + 1)) + 85,
        status: "New",
      });

      const savedLead = await lead.save();
      newLeads.push(savedLead);
    }

    res
      .status(201)
      .json({ message: "Leads extracted successfully", leads: newLeads });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error extracting leads", error: error.message });
  }
};

// 3. Update Lead Status (New -> Contacted -> Converted)
exports.updateLeadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedLead = await Lead.findByIdAndUpdate(
      id,
      { status, ...(status === "Contacted" && { contactedAt: new Date() }) },
      { new: true },
    );

    res.status(200).json(updatedLead);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating status", error: error.message });
  }
};
