async function refreshStats() {
  const { blocklist, blocklistFetchedAt } = await chrome.storage.local.get([
    "blocklist",
    "blocklistFetchedAt"
  ]);
  const { hiddenThisSession } = await chrome.storage.session.get(["hiddenThisSession"]);

  document.getElementById("stats").textContent =
    `${(blocklist || []).length} flagged users loaded - ${hiddenThisSession || 0} reviews hidden this session`;

  document.getElementById("lastUpdated").textContent = blocklistFetchedAt
    ? `Last updated: ${new Date(blocklistFetchedAt).toLocaleString()}`
    : "Not yet fetched";
}

document.getElementById("refreshBtn").addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "FORCE_REFRESH" });
  refreshStats();
});

document.getElementById("repoLink").href = getRepoUrl();

chrome.storage.local.get("localAllowlist").then(({ localAllowlist }) => {
  document.getElementById("allowlist").value = (localAllowlist || []).join(", ");
});

document.getElementById("saveAllowlist").addEventListener("click", async () => {
  const raw = document.getElementById("allowlist").value;
  const list = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  await chrome.storage.local.set({ localAllowlist: list });
});

refreshStats();
