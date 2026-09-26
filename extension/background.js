importScripts("config.js");

const ALARM_NAME = "jrb-refresh-blocklist";

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: CONFIG.REFRESH_INTERVAL_MINUTES });
  refreshBlocklist();
});

chrome.runtime.onStartup.addListener(() => {
  refreshBlocklist();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) refreshBlocklist();
});

async function refreshBlocklist() {
  try {
    const res = await fetch(getBlocklistUrl(), { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const list = Array.isArray(data.users)
      ? data.users.map((u) => String(u.username).toLowerCase())
      : [];
    await chrome.storage.local.set({
      blocklist: list,
      blocklistFetchedAt: Date.now()
    });
    return true;
  } catch (err) {
    console.warn("[joke-blocker] failed to refresh blocklist:", err);
    return false;
  }
}

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

async function checkAndIncrementReportLimit() {
  const stored = await chrome.storage.local.get(["reportCount", "reportDate"]);
  const today = todayUTC();
  let count = stored.reportDate === today ? stored.reportCount || 0 : 0;
  if (count >= CONFIG.DAILY_REPORT_LIMIT) {
    return { ok: false, remaining: 0 };
  }
  count += 1;
  await chrome.storage.local.set({ reportCount: count, reportDate: today });
  return { ok: true, remaining: CONFIG.DAILY_REPORT_LIMIT - count };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_BLOCKLIST") {
    chrome.storage.local.get(["blocklist", "blocklistFetchedAt"]).then(
      ({ blocklist, blocklistFetchedAt }) => {
        const staleMs = CONFIG.REFRESH_INTERVAL_MINUTES * 60 * 1000 * 2;
        const stale = !blocklistFetchedAt || Date.now() - blocklistFetchedAt > staleMs;
        if (stale) refreshBlocklist();
        sendResponse({ list: blocklist || [] });
      }
    );
    return true;
  }

  if (msg.type === "CHECK_REPORT_LIMIT") {
    checkAndIncrementReportLimit().then(sendResponse);
    return true;
  }

  if (msg.type === "REVIEW_HIDDEN") {
    chrome.storage.session.get(["hiddenThisSession"]).then(({ hiddenThisSession }) => {
      chrome.storage.session.set({ hiddenThisSession: (hiddenThisSession || 0) + 1 });
    });
  }

  if (msg.type === "FORCE_REFRESH") {
    refreshBlocklist().then((ok) => sendResponse({ ok }));
    return true;
  }
});
