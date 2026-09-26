(function () {
  const PROCESSED_ATTR = "data-jrb-processed";
  const REVIEW_LINK_PATTERN = /^\/([A-Za-z0-9_]+)\/film\/[a-z0-9-]+\/?$/;

  let blocklist = new Set();
  let localAllowlist = new Set();

  function usernameFromHref(href) {
    if (!href) return null;
    const m = href.match(REVIEW_LINK_PATTERN);
    return m ? m[1].toLowerCase() : null;
  }

  // Letterboxd's exact CSS classes can change and can't be verified live
  // from here, so this deliberately anchors on the review permalink URL
  // pattern (stable) rather than guessing class names. If this heuristic
  // grabs the wrong wrapping element on your version of the site, set
  // CONFIG.REVIEW_CONTAINER_SELECTOR in config.js instead - it always wins.
  function findReviewContainer(anchor) {
    if (CONFIG.REVIEW_CONTAINER_SELECTOR) {
      const el = anchor.closest(CONFIG.REVIEW_CONTAINER_SELECTOR);
      if (el) return el;
    }
    let el = anchor;
    for (let i = 0; i < 6 && el.parentElement; i++) {
      el = el.parentElement;
      const text = (el.textContent || "").trim();
      if (text.length > 40 && ["LI", "ARTICLE", "DIV", "SECTION"].includes(el.tagName)) {
        return el;
      }
    }
    return anchor.parentElement;
  }

  function extractReviewData(container) {
    const permalink = container.querySelector('a[href*="/film/"]');
    const reviewUrl = permalink
      ? new URL(permalink.getAttribute("href"), location.origin).href
      : location.href;
    const excerpt = (container.textContent || "").trim().slice(0, 500);
    return { reviewUrl, excerpt };
  }

  function hideReview(container, username) {
    if (container.dataset.jrbHidden === "true") return;
    container.dataset.jrbHidden = "true";
    container.style.display = "none";

    const banner = document.createElement("div");
    banner.className = "jrb-hidden-banner";
    banner.textContent = `Review by ${username} hidden (flagged joke reviewer). `;

    const showBtn = document.createElement("button");
    showBtn.type = "button";
    showBtn.textContent = "Show anyway";
    showBtn.className = "jrb-show-btn";
    showBtn.addEventListener("click", () => {
      container.style.display = "";
      banner.remove();
    });
    banner.appendChild(showBtn);
    container.insertAdjacentElement("beforebegin", banner);

    chrome.runtime.sendMessage({ type: "REVIEW_HIDDEN" });
  }

  function addReportButton(container, username) {
    if (container.querySelector(".jrb-report-btn")) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "jrb-report-btn";
    btn.textContent = "🚩 Report joke reviewer";
    btn.title = "Flag this user's review to the community blocklist (opens a GitHub issue)";

    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const allowed = await chrome.runtime.sendMessage({ type: "CHECK_REPORT_LIMIT" });
      if (!allowed || !allowed.ok) {
        const original = btn.textContent;
        btn.textContent = "Daily report limit reached";
        btn.disabled = true;
        setTimeout(() => {
          btn.textContent = original;
          btn.disabled = false;
        }, 4000);
        return;
      }
      const { reviewUrl, excerpt } = extractReviewData(container);
      const url = getIssueUrl({ username, reviewUrl, excerpt });
      window.open(url, "_blank", "noopener");
    });

    container.appendChild(btn);
  }

  function processAnchor(anchor) {
    if (anchor.hasAttribute(PROCESSED_ATTR)) return;
    anchor.setAttribute(PROCESSED_ATTR, "true");

    const username = usernameFromHref(anchor.getAttribute("href"));
    if (!username) return;

    const container = findReviewContainer(anchor);
    if (!container || container.hasAttribute(PROCESSED_ATTR)) return;
    container.setAttribute(PROCESSED_ATTR, "true");

    if (localAllowlist.has(username)) return;

    if (blocklist.has(username)) {
      hideReview(container, username);
    } else {
      addReportButton(container, username);
    }
  }

  function scan() {
    document.querySelectorAll('a[href^="/"]').forEach((a) => {
      if (REVIEW_LINK_PATTERN.test(a.getAttribute("href") || "")) {
        processAnchor(a);
      }
    });
  }

  async function init() {
    const res = await chrome.runtime.sendMessage({ type: "GET_BLOCKLIST" });
    blocklist = new Set((res && res.list) || []);

    const stored = await chrome.storage.local.get("localAllowlist");
    localAllowlist = new Set(stored.localAllowlist || []);

    scan();

    const observer = new MutationObserver(() => scan());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  init();
})();
