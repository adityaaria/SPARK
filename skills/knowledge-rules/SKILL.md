---
name: knowledge-rules
description: Use when a project needs explicit coding-standard rules established, refreshed, or enforced during code review and implementation.
---

# Knowledge Rules

## Overview

Use this skill to build and maintain `docs/spark/rules/KNOWLEDGE_RULES.md` — explicit, prescriptive coding-standard rules for a project. This is distinct from `.docs/` (stable, *descriptive* project memory built by `spark:project-scanner`): Knowledge Rules are *prescriptive* — a rule the project has decided to hold code to, whether discovered from consistent evidence or declared by a developer.

This fills a gap `project-scanner` leaves by design: that skill finds legacy traps and anti-patterns during scanning but never persists them (see its "Legacy Discovery" and "Never Persist Temporary Intelligence" sections) — those findings are one-time, conversational, and can't be re-checked later or fed into a dashboard. Knowledge Rules are the durable, reusable layer for the subset of findings a developer actually wants enforced going forward.

**Announce at start:**

> spark detection 💥 Using knowledge-rules to establish enforceable coding standards

**Not to be confused with `.docs/` or `docs/spark/plans/`:** `.docs/` describes what the codebase currently is. `docs/spark/plans/` describes planned work for one feature. `docs/spark/rules/KNOWLEDGE_RULES.md` prescribes what code *must* or *should* do, regardless of feature or scan. Do not write rule entries into `.docs/`, and do not write project-memory facts into `KNOWLEDGE_RULES.md`.

---

# Output Contract

**Location:** `docs/spark/rules/KNOWLEDGE_RULES.md` — one file, many entries. Create the `docs/spark/rules/` directory if it doesn't exist.

Every entry follows this exact format (parseable by both agents and the SPARK dashboard):

```markdown
## RULE-<3-digit number>: <short rule title>
- Severity: Must | Should
- Source: auto-detected | manual
- Added: <YYYY-MM-DD>
- Last-Verified: <YYYY-MM-DD>
- Rationale: <why this rule holds — evidence for auto-detected, developer's reasoning for manual>
- Detection: <grep/keyword pattern to find violations; leave blank if no mechanical pattern exists>
- Enforced-Via: agent-review | linter:<tool>:<rule-id>
- Fix Guidance: <how to fix a violation>
```

- `Severity: Must` is a hard constraint; `Should` is a strong preference.
- `Enforced-Via: linter:<tool>:<rule-id>` means the rule has a native equivalent already active in the project's linter config (e.g. `linter:eslint:@typescript-eslint/no-explicit-any`) — violations are caught in CI, not just at agent-review time.
- `Enforced-Via: agent-review` means enforcement lives entirely with `audit`/`bug-fix`/`enhancement` reading this file — used when a rule is semantic/project-specific and has no mechanical linter equivalent (e.g. "no hardcoded values — use named constants," which requires business context a linter can't have).

When creating the file for the first time, write this header before the first entry so a developer opening it by hand understands the format:

```markdown
<!--
About This File — Knowledge Rules

This file holds explicit coding-standard rules for this project, enforced during
review (audit, bug-fix) and implementation (enhancement). Unlike .docs/ (stable,
descriptive project memory built by project-scanner), every entry here is
prescriptive — a rule the project has decided to hold code to.

Managed by the knowledge-rules skill. You can also edit this file by hand.
Rules with Source: manual are permanent developer decisions — refreshing this
file may only add or update Source: auto-detected entries; it must never
delete or overwrite a manual entry.
-->
```

---

# Auto-Detect Mode

1. Read `.docs/PROJECT_PROFILE.md` first — especially its "Coding Convention" and "Validation Convention" content, if present — as a starting point for what conventions already have evidence behind them.
2. Scan the repository for patterns that are **consistent across the whole codebase or a clear majority**, not a single file. Apply an evidence bar equivalent to `project-scanner`'s Confidence Engine:
   - Treat a pattern as **Confirmed from Code** only when it holds project-wide with no meaningful exceptions (e.g. `tsconfig.json` has `strict: true` and a repo-wide search finds zero uses of `any`) — this is what may become a proposed rule.
   - Treat a pattern found in only some files as **Unverified Pattern** — do not propose a rule from it.
3. Typical proposals: strict TypeScript + zero `any` usage → propose "No `any` type"; a linter config that already forbids `console.log` → propose a matching rule so it's tracked in `KNOWLEDGE_RULES.md` too, not just the linter config.
4. **Before writing anything, present every proposed rule to the developer for confirmation** — title, severity, rationale, detection pattern. This is different from `.docs/` project memory, which is descriptive and safe to write directly; a rule is prescriptive and must be opted into.
5. Only write entries the developer confirms, with `Source: auto-detected`, `Added`/`Last-Verified` set to today.

---

# Manual Mode

A developer can request a rule directly in natural language — e.g. "no `watch`," "no `any` type," "no hardcoded values, make them named constants."

1. Translate the request into the `RULE-xxx` format above, with `Source: manual`.
2. Draft `Rationale` from what the developer said (or ask if it's ambiguous) and `Fix Guidance` for how to resolve a violation.
3. Show the drafted entry to the developer and confirm before appending it to the file.

---

# Lint-Mapping (Hybrid Enforcement)

Applies to a rule from either mode, after it's been drafted (auto-detected or manual) and before it's saved:

1. Check `.docs/PROJECT_PROFILE.md` for the linter/toolchain already in use (ESLint, Ruff, RuboCop, Checkstyle, etc.).
2. If the rule has a native equivalent in that linter (e.g. "no `any` type" on a TypeScript + ESLint + typescript-eslint project → `@typescript-eslint/no-explicit-any`), propose it explicitly: *"This rule has a built-in ESLint equivalent (`@typescript-eslint/no-explicit-any`). Want me to enable it in the linter config too, so violations are caught automatically in CI?"*
3. **Never modify a linter config file (`.eslintrc.*`, `ruff.toml`, `.rubocop.yml`, etc.) without explicit confirmation for that specific change** — every time, not once-and-forever. Show the exact proposed config diff and wait for approval before writing it.
4. If the developer approves, set `Enforced-Via: linter:<tool>:<rule-id>` on the entry. If they decline, or no mechanical equivalent exists, set `Enforced-Via: agent-review`.
5. `agent-review` rules are fully valid and still enforced via Phase 1 Context Grounding in `audit`/`bug-fix`/`enhancement` — the hybrid check only adds an extra enforcement layer for rules that happen to support it; it never reduces coverage for rules that don't.

---

# Refresh Rules

Re-scanning (auto-detect mode run again on an existing file) follows strict rules:

- May only add new `Source: auto-detected` entries or update `Last-Verified` on existing ones that are still evidenced.
- **Must never delete or overwrite a `Source: manual` entry.** This is the single most important rule in this skill — a manual rule is a permanent developer decision until the developer removes it themselves.
- If a previously auto-detected pattern is no longer consistent, do not delete it automatically — flag it to the developer and wait for confirmation before removing it.

---

# Execution Checklist

- [ ] Announce skill usage.
- [ ] Read `.docs/PROJECT_PROFILE.md` if present (Coding/Validation Convention sections).
- [ ] For auto-detect: only propose rules meeting the Confirmed-from-Code evidence bar; present all proposals for confirmation before writing any.
- [ ] For manual requests: translate to `RULE-xxx` format and confirm before writing.
- [ ] Run Lint-Mapping on every drafted rule; never edit a linter config file without per-change confirmation.
- [ ] On refresh: never touch `Source: manual` entries; only add/update `auto-detected` ones, with confirmation before removing any.
- [ ] Write the "About This File" header when creating the file for the first time.
- [ ] Confirm every written entry matches the exact `RULE-xxx` field format.
