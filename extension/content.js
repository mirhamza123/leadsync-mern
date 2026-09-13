const COMMENT_SELECTORS = [
  ".comments-comment-item",
  "article.comments-comment-item",
  "div[data-id]",
];

const SYSTEM_TEXT = new Set([
  "like",
  "reply",
  "follow",
  "see more comments",
  "see more",
  "reactions",
  "key skills",
  "note",
]);

function cleanText(value = "") {
  return value.replace(/\s+/g, " ").trim();
}

function isSystemText(value = "") {
  return SYSTEM_TEXT.has(cleanText(value).toLowerCase());
}

function cleanName(value = "") {
  let name = cleanText(value)
    .replace(/\s*[•|]\s*(?:\d+(?:st|nd|rd|th)\s+)?(?:follow|following).*$/i, "")
    .replace(/\s+(?:follow|following)$/i, "")
    .replace(/\s*,?\s+(?:Ph\.?D\.?|M\.?D\.?|MBA|Esq\.?)$/i, "")
    .replace(/\s*\([^)]*\)\s*$/g, "")
    .trim();

  const words = name.split(/\s+/).filter(Boolean);
  while (
    words.length &&
    /^(?:[A-Z]{1,4}|\d+(?:st|nd|rd|th))$/.test(words.at(-1))
  ) {
    words.pop();
  }
  return words.join(" ");
}

function getText(element, selectors) {
  for (const selector of selectors) {
    const match = element.querySelector(selector);
    const value = cleanText(match?.textContent || "");
    if (value && !isSystemText(value)) return value;
  }
  return "";
}

function getProfileLink(element) {
  return element.querySelector("a[href*='/in/']");
}

function findCommentContainer(profileLink) {
  let current = profileLink;
  for (let depth = 0; current && depth < 8; depth += 1) {
    const text = cleanText(current.textContent || "");
    const hasCommentBody = current.querySelector(
      ".comments-comment-item__main-content, .comments-comment-item-content-body, .feed-shared-text",
    );
    if (
      hasCommentBody ||
      (text.length > 40 && current.querySelector("button"))
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

function extractFromContainer(container) {
  if (!container) return null;

  const profileLink = getProfileLink(container);
  if (!profileLink) return null;

  const name = cleanName(
    getText(container, [
      ".comments-post-meta__name-text",
      ".comments-comment-item__post-meta .hoverable-link-text",
      ".comments-comment-item__post-meta .t-14",
      "a[href*='/in/'] span[aria-hidden='true']",
      "a[href*='/in/']",
    ]),
  );
  if (!name || isSystemText(name) || name.split(/\s+/).length < 2) return null;

  const headline = getText(container, [
    ".comments-post-meta__headline",
    ".comments-comment-item__post-meta .comments-post-meta__headline",
    ".comments-comment-item__post-meta .t-12",
  ]);

  const commentElement = container.querySelector(
    ".comments-comment-item__main-content, .comments-comment-item-content-body, .feed-shared-text, [data-test-id='comment-content']",
  );
  const commentSnippet = cleanText(commentElement?.textContent || "");
  if (!commentSnippet || isSystemText(commentSnippet)) return null;

  return { name, headline, commentSnippet };
}

function scrapeComments() {
  const candidates = new Set();
  for (const selector of COMMENT_SELECTORS) {
    document
      .querySelectorAll(selector)
      .forEach((element) => candidates.add(element));
  }

  const leads = [...candidates]
    .map((candidate) => {
      const profileLink = candidate.matches("a[href*='/in/']")
        ? candidate
        : getProfileLink(candidate);
      return extractFromContainer(
        profileLink ? findCommentContainer(profileLink) : candidate,
      );
    })
    .filter(Boolean);

  if (!leads.length) {
    document.querySelectorAll("a[href*='/in/']").forEach((profileLink) => {
      const lead = extractFromContainer(findCommentContainer(profileLink));
      if (lead) leads.push(lead);
    });
  }

  const uniqueLeads = new Map();
  for (const lead of leads) {
    const key = lead.name.toLowerCase();
    if (!uniqueLeads.has(key)) uniqueLeads.set(key, lead);
  }
  return [...uniqueLeads.values()];
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "SCRAPE_PAGE") return false;
  sendResponse({ leads: scrapeComments() });
  return true;
});
