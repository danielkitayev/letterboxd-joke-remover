#!/usr/bin/env node
// Dependency-free validator for data/blocklist.json - run via
// `node scripts/validate-blocklist.js`. Used by the CI workflow so no
// malformed or unsubstantiated entry can be merged.

const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "data", "blocklist.json");
const raw = fs.readFileSync(filePath, "utf8");

let data;
try {
  data = JSON.parse(raw);
} catch (e) {
  console.error("blocklist.json is not valid JSON:", e.message);
  process.exit(1);
}

const errors = [];

if (!Array.isArray(data.users)) {
  console.error('"users" must be an array.');
  process.exit(1);
}

const seen = new Set();

data.users.forEach((entry, i) => {
  const prefix = `users[${i}]`;

  if (!entry.username || typeof entry.username !== "string" || !/^[A-Za-z0-9_]+$/.test(entry.username)) {
    errors.push(`${prefix}: missing or invalid "username"`);
  } else {
    const key = entry.username.toLowerCase();
    if (seen.has(key)) errors.push(`${prefix}: duplicate username "${entry.username}"`);
    seen.add(key);
  }

  if (!entry.reason || typeof entry.reason !== "string" || entry.reason.trim().length < 10) {
    errors.push(`${prefix}: "reason" must be a descriptive string (10+ chars)`);
  }

  if (!Array.isArray(entry.evidence) || entry.evidence.length === 0) {
    errors.push(`${prefix}: "evidence" must be a non-empty array of review URLs`);
  } else {
    entry.evidence.forEach((url, j) => {
      if (typeof url !== "string" || !url.startsWith("https://letterboxd.com/")) {
        errors.push(`${prefix}.evidence[${j}]: must be a letterboxd.com URL`);
      }
    });
  }

  if (!entry.added || typeof entry.added !== "string") {
    errors.push(`${prefix}: missing "added" date`);
  }
});

if (errors.length) {
  console.error(`Found ${errors.length} problem(s) in blocklist.json:\n` + errors.join("\n"));
  process.exit(1);
}

console.log(`blocklist.json is valid - ${data.users.length} entries checked.`);
