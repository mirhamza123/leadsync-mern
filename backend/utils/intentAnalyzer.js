const INTENT_RULES = [
  {
    tag: "DM Requested",
    tier: "High Intent",
    keywords: ["dm", "direct message", "send me"],
  },
  {
    tag: "Pricing Inquiry",
    tier: "High Intent",
    keywords: ["price", "pricing", "cost", "budget", "quote"],
  },
  {
    tag: "Demo Requested",
    tier: "High Intent",
    keywords: ["demo", "demonstration", "walkthrough"],
  },
];

function analyzeIntent(comment = "") {
  const normalized = comment.toLowerCase();
  const match = INTENT_RULES.find((rule) =>
    rule.keywords.some((keyword) => normalized.includes(keyword)),
  );

  if (!match) {
    return {
      intentTier: "Medium Intent",
      intentTag: "Manual Entry",
      matchScore: 75,
    };
  }

  return {
    intentTier: match.tier,
    intentTag: match.tag,
    matchScore: Math.min(
      99,
      85 +
        match.keywords.filter((keyword) => normalized.includes(keyword))
          .length *
          5,
    ),
  };
}

function parseLeadText(rawText = "") {
  return rawText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf(":");
      const name =
        separatorIndex >= 0
          ? line.slice(0, separatorIndex).trim()
          : "Anonymous Lead";
      const commentSnippet =
        separatorIndex >= 0 ? line.slice(separatorIndex + 1).trim() : line;
      const avatarInitials = name
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      return {
        name,
        commentSnippet,
        avatarInitials: avatarInitials || "LD",
        ...analyzeIntent(commentSnippet),
      };
    });
}

module.exports = { analyzeIntent, parseLeadText };
