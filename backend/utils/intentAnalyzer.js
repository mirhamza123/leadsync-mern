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
  {
    tag: "Active Interest",
    tier: "Medium Intent",
    keywords: ["interested in", "looking for", "evaluating", "seeking"],
  },
];

const NOISE_LINES = new Set([
  "key skills",
  "note",
  "follow",
  "see more comments",
  "reactions",
  "like",
  "reply",
]);

const SPAM_PATTERNS = [/^cfbr!?$/i, /^interested!?$/i, /^following!?$/i];
const TITLE_WORDS = new Set([
  "ceo",
  "cto",
  "designer",
  "developer",
  "engineer",
  "founder",
  "manager",
  "director",
  "consultant",
  "marketing",
  "sales",
  "software",
]);

function isNoiseLine(line) {
  const normalized = line.trim().toLowerCase();
  return (
    !normalized ||
    NOISE_LINES.has(normalized) ||
    /^\d+\s*(mo|m|h|d|w|y)s?$/i.test(normalized) ||
    /^\d+\s*(reaction|reactions|like|likes)$/i.test(normalized)
  );
}

function isSpamComment(comment) {
  return SPAM_PATTERNS.some((pattern) => pattern.test(comment.trim()));
}

function looksLikeName(line) {
  const words = line.trim().split(/\s+/);
  const normalizedWords = words.map((word) => word.toLowerCase());
  return (
    words.length >= 2 &&
    words.length <= 5 &&
    !/[?!.,:;|@]/.test(line) &&
    !normalizedWords.some((word) => TITLE_WORDS.has(word)) &&
    words.every((word) => /^[A-Za-zÀ-ÖØ-öø-ÿ'’-]+$/.test(word))
  );
}

function cleanComment(lines) {
  return lines
    .join(" ")
    .replace(/\s+/g, " ")
    .replace(/^['\"]|['\"]$/g, "")
    .trim();
}

function analyzeIntent(comment = "") {
  const normalized = comment.toLowerCase();
  const match = INTENT_RULES.find((rule) =>
    rule.keywords.some((keyword) => normalized.includes(keyword)),
  );

  if (!match) {
    return {
      intentTier: "Low Intent",
      intentScore: "Low Intent",
      intentTag: "Manual Entry",
      matchScore: 50,
    };
  }

  return {
    intentTier: match.tier,
    intentScore: match.tier,
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
    .split(/\r?\n\s*\r?\n/)
    .map((block) =>
      block
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
    )
    .flatMap((block) => {
      const lines = block.filter((line) => !isNoiseLine(line));
      if (!lines.length) return [];

      const inlineSeparator = lines[0].indexOf(":");
      const inlineName =
        inlineSeparator > 0 ? lines[0].slice(0, inlineSeparator).trim() : "";
      const nameIndex =
        inlineName && looksLikeName(inlineName)
          ? 0
          : lines.findIndex(looksLikeName);
      if (nameIndex < 0) return [];

      const name = inlineName || lines[nameIndex];
      const remaining = inlineName
        ? [lines[0].slice(inlineSeparator + 1).trim(), ...lines.slice(1)]
        : lines.slice(nameIndex + 1);
      const content = remaining.filter((line) => !isNoiseLine(line));
      const headline = inlineName ? "" : content.shift() || "";
      const commentSnippet = cleanComment(content);
      if (!commentSnippet || isSpamComment(commentSnippet)) return [];

      return [
        {
          name,
          headline,
          commentSnippet,
          intentScore: analyzeIntent(commentSnippet).intentTier,
        },
      ];
    });
}

module.exports = { analyzeIntent, parseLeadText };
