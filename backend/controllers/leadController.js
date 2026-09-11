const Lead = require("../models/Lead");
const { parseLeadText } = require("../utils/intentAnalyzer");

exports.getLeads = async (req, res) => {
  try {
    const { status, search, intentTier } = req.query;
    const filter = { isSpam: false };
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
    const totalScanned = await Lead.countDocuments({});
    const qualified = await Lead.countDocuments({
      intentTier: { $in: ["High Intent", "Medium Intent"] },
    });
    const contacted = await Lead.countDocuments({ status: "Contacted" });
    const convertedLeads = await Lead.find({ status: "Converted" });
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
    if (!req.body.rawText?.trim())
      return res.status(400).json({ message: "Raw text is required" });
    const leads = await Lead.create(parseLeadText(req.body.rawText));
    res
      .status(201)
      .json({
        message: "Leads extracted successfully",
        leads: Array.isArray(leads) ? leads : [leads],
      });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

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
