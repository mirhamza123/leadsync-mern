const COMMENT_CONTAINER_SELECTOR =
  ".comments-comments-list, .comments-comment-box, div.comments-comment-list__container";
const POST_SELECTOR = ".feed-shared-update-v2, div.occludable-update, article";
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
    .replace(/^(?:view|go to)\s+/i, "")
    .replace(/['’]s\s+profile.*$/i, "")
    .replace(/\s*[,|]\s*open to work.*$/i, "")
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
    const containsCommentItems =
      element.matches(COMMENT_SELECTOR) ||
      element.querySelector(COMMENT_SELECTOR);
    if (!containsCommentItems) return;

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

  const activeContainer =
    topLevelCandidates.reduce(
      (active, candidate) =>
        !active || candidate.score > active.score ? candidate : active,
      null,
    )?.element || null;
  if (activeContainer) return activeContainer;

  const visibleItems = Array.from(
    document.querySelectorAll(COMMENT_SELECTOR),
  ).filter((element) => getViewportScore(element) !== null);
  if (!visibleItems.length) return null;

  const anchor = visibleItems.reduce((active, element) => {
    const score = getViewportScore(element);
    return !active || score > active.score ? { element, score } : active;
  }, null)?.element;
  if (!anchor) return null;

  let fallback = anchor.parentElement;
  while (fallback && fallback !== document.body) {
    const itemCount = fallback.querySelectorAll(COMMENT_SELECTOR).length;
    if (itemCount > 1) return fallback;
    fallback = fallback.parentElement;
  }

  return anchor;
}

function findActivePost() {
  return (
    Array.from(document.querySelectorAll(POST_SELECTOR))
      .map((element) => ({ element, score: getViewportScore(element) }))
      .filter(({ score }) => score !== null)
      .reduce(
        (active, candidate) =>
          !active || candidate.score > active.score ? candidate : active,
        null,
      )?.element || null
  );
}

function findFallbackCommentNodes(targetPost) {
  const nodes = new Set();
  targetPost.querySelectorAll("a[href*='/in/']").forEach((profileLink) => {
    let current = profileLink;
    for (let depth = 0; current && depth < 8; depth += 1) {
      if (
        (current.querySelector(BODY_SELECTOR) ||
          current.querySelector(BODY_FALLBACK_SELECTOR)) &&
        getViewportScore(current) !== null
      ) {
        nodes.add(current);
        break;
      }
      current = current.parentElement;
    }
  });
  return nodes;
}

function extractComment(commentNode) {
  const authorNode = commentNode.querySelector(NAME_SELECTORS);
  const fallbackAuthorNode = commentNode.querySelector("a[href*='/in/']");
  const authorName = cleanName(
    authorNode?.textContent || fallbackAuthorNode?.textContent || "",
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

function extractFromContainer(targetContainer) {
  const seen = new Set();
  const leads = [];
  const comments = new Set(targetContainer.querySelectorAll(COMMENT_SELECTOR));
  if (targetContainer.matches(COMMENT_SELECTOR)) comments.add(targetContainer);
  findFallbackCommentNodes(targetContainer).forEach((commentNode) =>
    comments.add(commentNode),
  );

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

function scrapeComments() {
  const activeContainer = findActiveCommentContainer();
  const scopedLeads = activeContainer
    ? extractFromContainer(activeContainer)
    : [];
  if (scopedLeads.length) return scopedLeads;

  const activePost = findActivePost();
  if (!activePost || activePost === activeContainer) return [];
  return extractFromContainer(activePost);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.action === "SCRAPE_PAGE" || message?.type === "SCRAPE_PAGE") {
    const results = scrapeComments();
    sendResponse({ leads: results });
  }
  return true;
});
