// Edit GITHUB_OWNER and GITHUB_REPO to point at the repo you create
// (the one containing this whole project, including data/blocklist.json).
const CONFIG = {
  GITHUB_OWNER: "danielkitayev",
  GITHUB_REPO: "letterboxd-joke-remover",
  GITHUB_BRANCH: "main",
  BLOCKLIST_PATH: "data/blocklist.json",

  // How often the extension re-fetches the shared blocklist from GitHub.
  REFRESH_INTERVAL_MINUTES: 360, // 6 hours

  // Max "report" clicks a single browser can submit per UTC day.
  // Soft abuse-resistance measure - see CONTRIBUTING.md for the full policy.
  DAILY_REPORT_LIMIT: 5,

  // Leave null to use the built-in heuristic for finding a review's
  // surrounding block. If reviews get hidden/flagged in the wrong place,
  // inspect a review in DevTools, find its outer wrapping element, and put
  // a matching CSS selector here (e.g. "li.film-detail" or similar) - see
  // "Selector calibration" in README.md.
  REVIEW_CONTAINER_SELECTOR: null
};

function getBlocklistUrl() {
  return `https://raw.githubusercontent.com/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/${CONFIG.GITHUB_BRANCH}/${CONFIG.BLOCKLIST_PATH}`;
}

function getRepoUrl() {
  return `https://github.com/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}`;
}

// Builds a pre-filled "new GitHub issue" URL. No token or server involved -
// the reporter's own GitHub login is what actually files it when they click
// through and hit submit.
function getIssueUrl({ username, reviewUrl, excerpt }) {
  const title = encodeURIComponent(`Report: ${username}`);
  const body = encodeURIComponent(
`**Reported username:** ${username}
**Review URL:** ${reviewUrl}

**Review excerpt:**
${excerpt}

**Why this fits the definition** (a short review that consists only of a joke or jokes, no real commentary on the film):
<!-- explain briefly -->

**Have you checked this user's other reviews to confirm this isn't a one-off?**
<!-- yes/no -->
`
  );
  return `${getRepoUrl()}/issues/new?title=${title}&body=${body}&labels=report`;
}
