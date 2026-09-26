# Contributing to the blocklist

## Definition

A "joke review" is a short review that consists only of a joke or jokes -
no actual commentary, opinion, or reaction to the film itself. A review
that includes a joke alongside real thoughts about the film does NOT
qualify, and should not be reported.

## How reporting works

1. Anyone using the extension can click "Report joke reviewer" under a
   review. This opens a pre-filled GitHub issue - no server or account of
   ours is involved, it's a normal GitHub issue filed under the reporter's
   own account.
2. Reports can also be filed manually using the issue template.

Requiring a GitHub account to report is intentional - see "Abuse
resistance" below.

## How a username actually gets added

A username is only added to `data/blocklist.json` once ALL of the
following hold:

- At least 3 independent GitHub accounts have reported the same username
  with linked evidence, OR a maintainer independently verifies a clear-cut
  case across multiple reviews.
- Each linked review is checked by a maintainer against the definition
  above before merging - report volume alone never adds anyone
  automatically.
- The change is submitted as a pull request to `data/blocklist.json` and
  passes the automated check in `.github/workflows/validate-blocklist.yml`
  (valid JSON, no duplicates, every entry has a reason and at least one
  letterboxd.com evidence link).
- The pull request is approved by 2 maintainers before merge (branch
  protection rule on `data/blocklist.json`).

## Abuse resistance, summarized

- Reporting requires a GitHub account - discourages anonymous mass-flagging
  far better than an open form would.
- The extension itself throttles how many reports a single browser can
  file per day (see `DAILY_REPORT_LIMIT` in `extension/config.js`).
- No username is added on report count alone - a human checks the linked
  evidence against the definition first, every time.
- Every entry stores its evidence links and the date added, and the whole
  file lives in git history, so every addition and removal is fully
  auditable and revertable.
- Disagree with an addition? Open an issue with the "dispute" label linking
  your own reviews; a maintainer reviews and can revert the change with a
  one-line PR.

## Removing an entry

Open a PR removing the entry, with a short note on why (the user deleted
the review in question, the original report turns out to be mistaken,
etc). Same 2-approval process applies.
