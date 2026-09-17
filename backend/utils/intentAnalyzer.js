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

const SPAM_PATTERNS = [/^cfbr!?$/i, /^following!?$/i];
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
const NON_NAME_STARTS = new Set([
  "i",
  "we",
  "this",
  "that",
  "thank",
  "thanks",
  "congratulations",
  "looking",
  "interested",
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
    !NON_NAME_STARTS.has(normalizedWords[0]) &&
    /^[A-ZÀ-ÖØ-Þ]/.test(words[0]) &&
    words.every((word) => /^[A-Za-zÀ-ÖØ-öø-ÿ'’-]+$/.test(word))
  );
}

function cleanComment(lines) {
  return lines
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function cleanAuthorName(line) {
  return line
    .trim()
    .replace(/^(?:view|go to)\s+/i, "")
    .replace(/['’]s\s+profile.*$/i, "")
    .replace(/\s*[,|]\s*open to work.*$/i, "")
    .replace(/\s*[•·|]\s*(?:\d+(?:st|nd|rd|th)\+?|follow(?:ing)?|reply).*$/i, "")
    .replace(/\s+(?:open to work|follow(?:ing)?|reply)$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isProfileMetadata(line) {
  return (
    /^\d+(?:st|nd|rd|th)\+?$/i.test(line) ||
    /^(?:open to work|follow(?:ing)?|reply)$/i.test(line) ||
    /^[•·|]\s*\d+(?:st|nd|rd|th)\+?/i.test(line)
  );
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
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return [];

  const nameIndex = lines.findIndex((line) => {
    const name = cleanAuthorName(line);
    return (
      name &&
      !isNoiseLine(name) &&
      !isProfileMetadata(line) &&
      (line !== name || looksLikeName(name))
    );
  });
  if (nameIndex < 0) return [];

  const authorName = cleanAuthorName(lines[nameIndex]);
  if (!looksLikeName(authorName)) return [];

  const remaining = lines
    .slice(nameIndex + 1)
    .filter((line) => !isProfileMetadata(line) && !isNoiseLine(line))
    .filter((line) => cleanAuthorName(line).toLowerCase() !== authorName.toLowerCase());
  const text = cleanComment(remaining.length === 1 ? remaining : remaining.slice(1));
  if (!text || isSpamComment(text)) return [];

  return [
    {
      authorName,
      text,
    },
  ];
}

module.exports = { analyzeIntent, parseLeadText };
