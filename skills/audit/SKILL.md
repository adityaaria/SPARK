---
name: audit
description: Use when asked to review or audit code quality, architecture, or security in a project that has documented memory or established repository conventions to check against.
---

# Audit (Meta-Skill)

## Overview

Use this skill to orchestrate a rigorous code review or architecture audit. You must NOT evaluate the code based on generic AI preferences or external "best practices" unless they align with the project's documented memory and proven repository rules. Your sole source of truth for the audit is the local project memory when it exists, with graceful fallback to direct repository inspection.

**Announce at start:** "spark detection 💥 Using audit meta-skill to enforce project standards"

## Standard Operating Procedure (SOP)

You MUST execute this checklist strictly in order. Do not skip steps.

### Phase 1: Context Grounding
- `[ ]` **Step 1:** Check whether `.docs/` exists for the relevant project root. If it does, read the local project memory first. Focus on `PROJECT_SCAN.md`, `PROJECT_PROFILE.md`, `ARCHITECTURE_GRAPH.md`, `FEATURE_MAP.md`, `API_CONTRACT.md`, `DATABASE_CATALOG.md`, `BUSINESS_FLOW.md`, `DOMAIN_MAP.md`, and `TESTING_STRATEGY.md`. Do NOT depend on removed legacy docs such as `STANDARDS.md` or `DOMAINS/`. If `.docs/` is missing or incomplete, fall back gracefully to direct repository inspection.
- `[ ]` **Step 1b — Staleness Check:** After reading `.docs/`, check the `Last Scanned` field in `PROJECT_SCAN.md`. Run `git rev-list --count --since="<Last Scanned>" HEAD` to count commits since the last scan. If that count is **more than 20 commits**, OR the scan date is **more than 30 days old**, invoke `project-scanner` in **Delta Scan Mode** before continuing. Announce this briefly ("Project memory is N commits behind — running a quick delta scan first") but don't wait for confirmation — this is a safe read+update-memory operation, not a code change. If `git rev-list` fails (not a git repo, etc.), skip this check gracefully and continue normally. *(The 20-commit / 30-day threshold here is intentionally identical to the Memory Health dashboard's staleness badge threshold — see `src/dashboard/server.js`'s `STALE_COMMIT_THRESHOLD`/`STALE_DAY_THRESHOLD` — so the badge and this gate never tell a developer contradictory stories. Change one, change both.)*
- `[ ]` **Step 2:** Identify the exact boundaries of the code to be audited (e.g., a specific Pull Request, a newly written module, or a suspected legacy file).
- `[ ]` **Step 2b:** Check whether `docs/spark/rules/KNOWLEDGE_RULES.md` exists. If it does, read it and treat every `Must` rule as a hard constraint and every `Should` rule as a strong preference during review, in addition to conventions found in `.docs/`. If a `Must` rule is violated, flag it explicitly using the rule's own Rationale and Fix Guidance text.

### Phase 2: Tactical Delegation (Review)
- `[ ]` **Step 3:** Invoke the `receiving-code-review` (or `requesting-code-review` depending on your role) skill to structure your feedback.
- `[ ]` **Step 4:** Compare the target code strictly against the documented architecture, contracts, domains, testing strategy, and proven conventions from Phase 1. Actively flag any re-introduction of:
  - Business logic leaks.
  - Raw SQL/ORM mixing or N+1 queries.
  - Undocumented bypass comments (`@ts-ignore`, `// HACK`).

### Phase 3: Reporting
- `[ ]` **Step 5:** Output an Audit Report summarizing the violations. If the code is clean, explicitly state that it complies with the project memory and proven repository conventions in `.docs/`.
