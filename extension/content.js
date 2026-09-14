const COMMENT_SELECTORS = [
  ".comments-comment-item",
  "article.comments-comment-item",
  "div[data-id]",
  ".comments-comment-entity",
  ".comments-comment-item-content-body",
  ".comments-post-meta",
];

const SYSTEM_TEXT =
  /^(?:like|reply|follow|following|see more(?: comments)?|reactions?|key skills|note|premium|messaging)$/i;

function cleanText(value = "") {
  return value.replace(/\s+/g, " ").trim();
}

function cleanName(value = "") {
  return cleanText(value)
    .replace(
      /\s*[•|·]\s*(?:\d+(?:st|nd|rd|th)\+?|follow(?:ing)?|reply|1st|2nd|3rd).*$/i,
      "",
    )
    .replace(/\s+(?:follow(?:ing)?|reply)$/i, "")
    .trim();
}

function firstText(element, selectors) {
  for (const selector of selectors) {
    const value = cleanText(element.querySelector(selector)?.textContent || "");
    if (value && !SYSTEM_TEXT.test(value)) return value;
  }
  return "";
}

function getProfileLink(element) {
  return element?.matches?.("a[href*='/in/']")
    ? element
    : element?.querySelector("a[href*='/in/']");
}

function findContainer(profileLink) {
  if (!profileLink) return null;
  let current = profileLink;
  for (let depth = 0; current && depth < 10; depth += 1) {
    if (
      current.matches?.(COMMENT_SELECTORS.join(",")) ||
      current.querySelector?.(
        ".comments-comment-item__main-content, .comments-comment-item-content-body, .comments-comment-entity, [data-test-id='comment-content'], span.dir-ltr",
      )
    ) {
      return current;
    }
    current = current.parentElement;
  }
  return (
    profileLink.closest("article, li, div[data-id]") ||
    profileLink.parentElement
  );
}

function extractLead(container) {
  if (!container) return null;
  const profileLink = getProfileLink(container);
  if (!profileLink) return null;

  const name = cleanName(
    firstText(container, [
      ".comments-post-meta__name-text",
      ".comments-comment-item__post-meta .hoverable-link-text",
      ".comments-comment-item__post-meta .t-14",
      "a[href*='/in/'] span[aria-hidden='true']",
      "a[href*='/in/']",
    ]),
  );

  // Filter out system words & non-person single strings
  if (!name || SYSTEM_TEXT.test(name) || name.length < 3) return null;

  const headline = firstText(container, [
    ".comments-post-meta__headline",
    ".comments-comment-item__post-meta .comments-post-meta__headline",
    ".comments-comment-item__post-meta .t-12",
    ".comments-comment-meta__description-subtitle",
  ]);

  const commentNode = container.querySelector(
    ".comments-comment-item__main-content, .comments-comment-item-content-body, .comments-comment-entity, [data-test-id='comment-content'], .feed-shared-text, span.dir-ltr",
  );

  const commentSnippet = cleanText(commentNode?.textContent || "");
  if (
    !commentSnippet ||
    SYSTEM_TEXT.test(commentSnippet) ||
    commentSnippet.toLowerCase() === name.toLowerCase()
  )
    return null;

  return { name, headline, commentSnippet };
}

function extractFallbackLead(profileLink) {
  const rawName = cleanName(profileLink.textContent || "");
  if (!rawName || SYSTEM_TEXT.test(rawName) || rawName.length < 3) return null;

  const container = findContainer(profileLink);
  if (!container) return null;

  const lines = (container.innerText || "")
    .split(/\r?\n/)
    .map(cleanText)
    .filter((line) => line && line !== rawName && !SYSTEM_TEXT.test(line));

  const meaningfulLines = lines.filter(
    (line) =>
      !/^\d+\s*(?:m|h|d|w|mo|y)(?:o)?$/i.test(line) && !line.includes("•"),
  );

  if (!meaningfulLines.length) return null;

  const headline = meaningfulLines.length > 1 ? meaningfulLines[0] : "";
  const commentSnippet = meaningfulLines.slice(headline ? 1 : 0).join(" ");
  if (!commentSnippet || SYSTEM_TEXT.test(commentSnippet)) return null;

  return { name: rawName, headline, commentSnippet };
}

function scrapeComments() {
  const candidates = new Set();
  COMMENT_SELECTORS.forEach((selector) =>
    document
      .querySelectorAll(selector)
      .forEach((element) => candidates.add(element)),
  );

  const leads = [];

  // Strategy 1: Primary container parsing
  candidates.forEach((element) => {
    const lead = extractLead(element);
    if (lead) leads.push(lead);
  });

  // Strategy 2: Targeted comment section profile links scanning
  const commentSectionLinks = document.querySelectorAll(
    ".comments-comment-item a[href*='/in/'], .comments-comment-entity a[href*='/in/']",
  );

  commentSectionLinks.forEach((profileLink) => {
    const lead =
      extractLead(findContainer(profileLink)) ||
      extractFallbackLead(profileLink);
    if (lead) leads.push(lead);
  });

  // Unique leads filtering by lowercased name
  const uniqueLeads = new Map();
  leads.forEach((lead) => {
    const key = lead.name.toLowerCase();
    if (!uniqueLeads.has(key)) uniqueLeads.set(key, lead);
  });

  return Array.from(uniqueLeads.values());
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.action === "SCRAPE_PAGE" || message?.type === "SCRAPE_PAGE") {
    const results = scrapeComments();
    sendResponse({ leads: results });
  }
  return true;
});
