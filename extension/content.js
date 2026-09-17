const COMMENT_CONTAINER_SELECTOR =
  ".comments-comments-list, .comments-comment-box, div.comments-comment-list__container";
const COMMENT_SELECTOR =
  ".comments-comment-item, article.comments-comment-item, div.comments-comment-entity";
const NAME_SELECTORS =
  ".comments-post-meta__name-text, .comments-comment-meta__description-title";
const BODY_SELECTOR = ".comments-comment-item__main-content";
const BODY_FALLBACK_SELECTOR =
  "span.dir-ltr:not(.comments-post-meta__name-text):not(.comments-comment-meta__description-title)";
const SYSTEM_TEXT =
  /(?:follows? this page|commented on this|commented on|starting a new position|likes? this|shared this)/i;
const STANDALONE_LINK = /^(?:(?:https?:)?\/\/|www\.)\S+$/i;

function cleanText(value = "") {
  return value
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanName(value = "") {
  return cleanText(value)
    .replace(
      /\s*[•|·]\s*(?:\d+(?:st|nd|rd|th)\+?|follow(?:ing)?|reply).*$/i,
      "",
    )
    .replace(/\s+(?:follow(?:ing)?|reply)$/i, "")
    .trim();
}

function getViewportScore(element) {
  const rect = element.getBoundingClientRect();
  if (
    rect.width <= 0 ||
    rect.height <= 0 ||
    rect.bottom <= 0 ||
    rect.top >= window.innerHeight
  ) {
    return null;
  }

  const visibleTop = Math.max(rect.top, 0);
  const visibleBottom = Math.min(rect.bottom, window.innerHeight);
  const visibleHeight = Math.max(0, visibleBottom - visibleTop);
  const centerDistance = Math.abs(
    (rect.top + rect.bottom) / 2 - window.innerHeight / 2,
  );

  return visibleHeight * 2 - centerDistance;
}

function findActiveCommentContainer() {
  const candidates = [];
  document.querySelectorAll(COMMENT_CONTAINER_SELECTOR).forEach((element) => {
    const score = getViewportScore(element);
    if (score !== null) candidates.push({ element, score });
  });

  const topLevelCandidates = candidates.filter(
    ({ element }) =>
      !candidates.some(
        (candidate) =>
          candidate.element !== element && candidate.element.contains(element),
      ),
  );

  return (
    topLevelCandidates.reduce(
      (active, candidate) =>
        !active || candidate.score > active.score ? candidate : active,
      null,
    )?.element || null
  );
}

function extractComment(commentNode) {
  const authorName = cleanName(
    commentNode.querySelector(NAME_SELECTORS)?.textContent || "",
  );
  const bodyNode =
    commentNode.querySelector(BODY_SELECTOR) ||
    Array.from(commentNode.querySelectorAll(BODY_FALLBACK_SELECTOR)).find(
      (node) =>
        !node.closest(
          ".comments-post-meta, .comments-comment-meta, .comments-comment-item__post-meta",
        ),
    );
  const text = cleanText(bodyNode?.textContent || "");

  if (
    !authorName ||
    !text ||
    SYSTEM_TEXT.test(text) ||
    SYSTEM_TEXT.test(authorName)
  ) {
    return null;
  }
  if (STANDALONE_LINK.test(text)) return null;

  return { authorName, text };
}

function scrapeComments() {
  const targetContainer = findActiveCommentContainer();
  if (!targetContainer) return [];

  const seen = new Set();
  const leads = [];
  const comments = new Set(targetContainer.querySelectorAll(COMMENT_SELECTOR));

  comments.forEach((commentNode) => {
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
    const results = scrapeComments();
    sendResponse({ leads: results });
  }
  return true;
});
