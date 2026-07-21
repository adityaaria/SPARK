# Keeping Project Memory Fresh

SPARK's `.docs/` project memory (built by `project-scanner`) can go stale as a
repository changes. Two layers keep it current automatically; a third is an
optional safety net you install yourself.

## 1. Delta Scan Mode (built into `project-scanner`)

A lighter-weight refresh mode, used when `project-scanner` is invoked by
another skill or by CI rather than directly by you. Instead of rewriting all
10 `.docs/` files from scratch, it finds what changed since the last scan
(`git diff` since the commit nearest the last `Last Scanned` date) and
re-verifies only the claims whose evidence touches those changed files. See
"Delta Scan Mode" in `skills/project-scanner/SKILL.md` for the exact rules —
including why `Last Scanned` updates at the file level, not per-claim.

Nothing to set up — this runs automatically wherever an automated caller
(the staleness gate below, or the CI workflow further down) triggers it.

## 2. Staleness Gate (built into `audit`, `bug-fix`, `enhancement`)

Each of these skills checks `.docs/PROJECT_SCAN.md`'s `Last Scanned` date
during Context Grounding. If more than **20 commits** have landed since then,
or the scan is more than **30 days** old, the skill runs a Delta Scan before
continuing — so you're not reviewing or fixing code against memory that's
already out of date. This adds a brief pause the first time it triggers on a
long-idle project; nothing changes for a project whose memory is already
fresh.

Nothing to set up — this is automatic whenever you use one of those three
skills.

## 3. Scheduled CI Refresh (optional, you install this yourself)

Layers 1 and 2 only run while someone is actively using SPARK in your
project. If nobody touches the project through Claude for weeks, `.docs/`
can still drift. This workflow is a safety net that runs on a schedule,
independent of anyone's activity.

**This is a template for your own project's repository — it is not part of
SPARK itself, and installing it does not change anything about SPARK.**

Copy this to `.github/workflows/refresh-project-memory.yml` in the project
you want to keep fresh (not in the SPARK repo):

```yaml
name: Refresh Project Memory (SPARK)

on:
  schedule:
    - cron: '0 3 * * 1' # every Monday 3am UTC — adjust to taste
  workflow_dispatch: {} # also runnable manually from the Actions tab

jobs:
  refresh-memory:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # delta scan needs full history for git rev-list/diff

      - name: Check whether a refresh is needed
        id: check
        run: |
          # TODO: count commits since .docs/PROJECT_SCAN.md's Last Scanned date,
          # set needs_refresh=true/false. Skip the Claude step below when
          # false, so this doesn't burn API calls every week when nothing
          # meaningful changed.
          echo "needs_refresh=true" >> "$GITHUB_OUTPUT"

      - name: Run project-scanner (delta scan) via Claude
        if: steps.check.outputs.needs_refresh == 'true'
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          # IMPORTANT: check docs.claude.com for the current non-interactive/
          # headless Claude Code CLI syntax before filling this in — don't
          # assume a remembered flag is still correct, it may have changed.
          # Goal: run the project-scanner skill in Delta Scan Mode
          # non-interactively, letting it write to .docs/.
          echo "placeholder — fill in per current official docs"

      - name: Open a PR if anything changed
        uses: peter-evans/create-pull-request@v6
        with:
          commit-message: "chore: refresh project memory (.docs/) via scheduled delta scan"
          title: "🤖 Refresh project memory (delta scan)"
          body: |
            Automatic, from the scheduled workflow. Please review the `.docs/`
            changes before merging — this is a delta scan, so only the parts
            tied to files that changed since the last scan were re-verified.
          branch: spark/auto-refresh-memory
          delete-branch: true
```

Notes:

- **Always opens a PR — never commits directly to `main`.** `.docs/` is read
  by every other SPARK skill as a source of truth, so even an automated
  change to it needs human review before merging.
- **Verify the Claude Code CLI's headless/non-interactive syntax against
  [docs.claude.com](https://docs.claude.com) before enabling this** — CLI
  flags change over time, and the placeholder above is deliberately left
  unfilled rather than guessed.
- The "Check whether a refresh is needed" step exists to control cost: skip
  calling Claude entirely on weeks with no relevant commits.
- Requires an `ANTHROPIC_API_KEY` secret in *your project's* repo (not
  SPARK's). Until you add it, the schedule simply does nothing harmful — it
  fails clearly at the Claude step rather than silently.
