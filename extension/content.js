const ROOT_SELECTORS = [
  "article",
  "div[data-id]",
  "div[class*='comment']",
];
const PROFILE_LINK_SELECTOR = "a[href*='/in/']";
const BODY_SELECTOR =
  "span[dir='ltr'], div[dir='ltr'], p, .update-components-text";
const UI_TEXT = new Set([
  "like",
  "reply",
  "replies",
  "follow",
  "following",
  "translated",
  "see more",
  "see more comments",
  "reactions",
  "send",
  "share",
]);
const SYSTEM_TEXT =
  /(?:follows? this page|commented on this|starting a new position|shared this|likes? this)/i;
const TIME_TEXT = /^(?:just now|\d+\s*(?:m|min|h|d|w|mo|y)(?:s)?|\d+\s*ago)$/i;
const LINK_TEXT = /^(?:(?:https?:)?\/\/|www\.)\S+$/i;

function cleanText(value = "") {
  return value.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
}

function cleanName(value = "") {
  return cleanText(value)
    .replace(/^(?:view|go to)\s+/i, "")
    .replace(/[\u2019']s\s+profile.*$/i, "")
    .replace(/\s*[,|]\s*open to work.*$/i, "")
    .replace(
      /\s*[•·|]\s*(?:\d+(?:st|nd|rd|th)\+?|follow(?:ing)?|reply).*$/i,
      "",
    )
    .replace(/\s+(?:follow(?:ing)?|reply|translated)$/i, "")
    .trim();
}

function isVisible(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom > 0 &&
    rect.top < window.innerHeight
  );
}

function viewportScore(element) {
  if (!isVisible(element)) return null;
  const rect = element.getBoundingClientRect();
  const visibleTop = Math.max(0, rect.top);
  const visibleBottom = Math.min(window.innerHeight, rect.bottom);
  const visibleHeight = Math.max(0, visibleBottom - visibleTop);
  const distance = Math.abs(
    (rect.top + rect.bottom) / 2 - window.innerHeight / 2,
  );
  return visibleHeight * 2 - distance;
}

function hasCommentSignals(element) {
  return Boolean(
    element.querySelector(PROFILE_LINK_SELECTOR) &&
      element.querySelector(BODY_SELECTOR),
  );
}

function findScopedRoot() {
  const candidates = new Set();
  ROOT_SELECTORS.forEach((selector) => {
    document.querySelectorAll(selector).forEach((element) => {
      if (hasCommentSignals(element)) candidates.add(element);
    });
  });

  const scored = Array.from(candidates)
    .map((element) => ({ element, score: viewportScore(element) }))
    .filter(({ score }) => score !== null)
    .filter(
      ({ element }) =>
        !Array.from(candidates).some(
          (parent) => parent !== element && parent.contains(element),
        ),
    )
    .sort((left, right) => right.score - left.score);

  return scored[0]?.element || null;
}

function findCommentNodes(root) {
  const nodes = new Set();
  root.querySelectorAll(PROFILE_LINK_SELECTOR).forEach((profileLink) => {
    let current = profileLink;
    for (let depth = 0; current && depth < 10; depth += 1) {
      if (
        current !== root &&
        current.querySelector(PROFILE_LINK_SELECTOR) &&
        current.querySelector(BODY_SELECTOR) &&
        isVisible(current)
      ) {
        nodes.add(current);
        break;
      }
      current = current.parentElement;
    }
  });

  if (!nodes.size) {
    root.querySelectorAll("article, div[data-id], div[class*='comment']")
      .forEach((element) => {
        if (hasCommentSignals(element) && isVisible(element)) nodes.add(element);
      });
  }

  return nodes;
}

function extractAuthor(commentNode) {
  const profileLink = commentNode.querySelector(PROFILE_LINK_SELECTOR);
  if (!profileLink) return "";

  const imageAlt = profileLink.querySelector("img[alt]")?.getAttribute("alt");
  return cleanName(profileLink.textContent || imageAlt || "");
}

function extractBody(commentNode, authorName) {
  const bodyCandidates = Array.from(commentNode.querySelectorAll(BODY_SELECTOR));
  const body = bodyCandidates
    .map((element) => cleanText(element.textContent || ""))
    .filter((text) => text && text.toLowerCase() !== authorName.toLowerCase())
    .filter((text) => !UI_TEXT.has(text.toLowerCase()))
    .filter((text) => !TIME_TEXT.test(text))
    .filter((text) => !SYSTEM_TEXT.test(text))
    .filter((text) => !LINK_TEXT.test(text))
    .sort((left, right) => right.length - left.length)[0];

  return body || "";
}

function extractComment(commentNode) {
  const authorName = extractAuthor(commentNode);
  const text = extractBody(commentNode, authorName);
  if (!authorName || !text) return null;
  if (SYSTEM_TEXT.test(authorName) || SYSTEM_TEXT.test(text)) return null;
  return { authorName, text };
}

function scrapeComments() {
  const root = findScopedRoot();
  if (!root) return [];

  const leads = [];
  const seen = new Set();
  findCommentNodes(root).forEach((commentNode) => {
    const lead = extractComment(commentNode);
    if (!lead) return;

    const key = `${lead.authorName.toLowerCase()}\u0000${lead.text.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    leads.push(lead);
  });

  return leads;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.action === "SCRAPE_PAGE" || message?.type === "SCRAPE_PAGE") {
    sendResponse({ leads: scrapeComments() });
  }
  return true;
});
