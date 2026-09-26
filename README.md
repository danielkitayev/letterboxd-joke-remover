# Letterboxd Joke Review Blocker

A browser extension that hides Letterboxd reviews from users the community
has flagged for posting joke-only reviews, plus the git-based "database" of
flagged usernames that powers it - no server to run or pay for.

## How it works

- `extension/` - the browser extension itself (Manifest V3). It runs on
  letterboxd.com, checks each review's author against the shared blocklist,
  and hides matches. A button next to every non-flagged review lets anyone
  report it.
- `data/blocklist.json` - the actual community database, a plain JSON file
  in this repo. The extension fetches it periodically straight from
  raw.githubusercontent.com.
- Reports arrive as GitHub Issues (template in `.github/ISSUE_TEMPLATE/`).
  A maintainer checks the linked evidence and merges qualifying usernames
  into `data/blocklist.json` via pull request - see `CONTRIBUTING.md` for
  the exact bar and the abuse-resistance rules.

## One-time setup

1. Create a GitHub repo (public) and push this project to it.
2. Edit `extension/config.js`: set `GITHUB_OWNER` and `GITHUB_REPO` to your
   new repo.
3. In the repo's Settings, add a branch-protection rule on `main` requiring
   2 approving reviews for changes to `data/blocklist.json`, so no single
   person can unilaterally add or remove someone.
4. Load the extension unpacked:
   - Chrome / Edge: open `chrome://extensions`, enable Developer mode,
     click "Load unpacked", select the `extension/` folder.
   - Firefox: open `about:debugging#/runtime/this-firefox`, click "Load
     Temporary Add-on", select `extension/manifest.json` (see "Firefox
     notes" below - one small manifest change is needed for a permanent
     install).
5. Optional: publish it properly.
   - Chrome Web Store: one-time $5 developer registration fee, no
     recurring cost.
   - Firefox Add-ons: free to publish.

## Selector calibration

Letterboxd's exact CSS classes can change, and I can't verify them from a
static read, so the content script deliberately avoids depending on them.
Instead it finds reviews via the stable URL pattern of a review permalink
(`/{username}/film/{slug}/`) and walks up the DOM with a generic heuristic
to find the surrounding review block.

This should work as-is. If a review gets hidden/flagged in the wrong spot
(the banner lands in an odd place, or too much/too little content is
affected), open DevTools on a film's reviews page, inspect one review
element, find its outer wrapping element, and set
`REVIEW_CONTAINER_SELECTOR` in `extension/config.js` to match it - that
override always takes priority over the heuristic.

## Firefox notes

Manifest V3 mostly works as-is in current Firefox. For a permanent
(non-temporary) install, change the `background` key in
`extension/manifest.json` from:

```json
"background": { "service_worker": "background.js" }
```

to:

```json
"background": { "scripts": ["config.js", "background.js"] }
```

Nothing else needs to change - the messaging, storage, and fetch calls all
work the same way.

## Design choices worth knowing about

- **User-level blocking, not per-review.** Flagging a user hides all of
  their reviews on Letterboxd, not just the one that got reported. Make
  sure whoever merges entries is confident the account is a repeat
  joke-only reviewer, not a one-off.
- **GitHub-account-gated reporting.** This trades off some reporting
  volume (not every Letterboxd user has a GitHub account) for real
  abuse-resistance - anonymous mass-flagging is much harder when every
  report is tied to an identity and rate-limited.
- **Nothing is ever auto-hidden from report volume alone.** A maintainer
  always checks the linked evidence against the definition before merging.
  See `CONTRIBUTING.md` for the full policy.

## Privacy

The extension only reads review content already visible in your own
browser. It sends data anywhere only when you click "Report" - and even
then, that's a normal GitHub issue you file yourself, not a call made
behind your back.
