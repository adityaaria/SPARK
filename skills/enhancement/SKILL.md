---
name: enhancement
description: Use when building a new feature or enhancement in a project that has an existing business flow and domain architecture to align with.
---

# Enhancement (Meta-Skill)

## Overview

Use this skill to orchestrate the safe addition of new features. Do not inject your own architectural preferences. You must ground yourself in the project's reality, scope the feature thoughtfully, plan it out, and execute it using the project's established conventions.

**Announce at start:** "spark detection 💥 Using enhancement meta-skill to coordinate feature development"

## Standard Operating Procedure (SOP)

You MUST execute this checklist strictly in order. Do not skip steps.

### Phase 1: Context Grounding
- `[ ]` **Step 1:** Check whether `.docs/` exists for the relevant project root. If it does, read the local project memory first. Focus heavily on `PROJECT_SCAN.md`, `PROJECT_PROFILE.md`, `FEATURE_MAP.md`, `BUSINESS_FLOW.md`, `DOMAIN_MAP.md`, and `TESTING_STRATEGY.md`.
- `[ ]` **Step 1b — Staleness Check:** After reading `.docs/`, check the `Last Scanned` field in `PROJECT_SCAN.md`. Run `git rev-list --count --since="<Last Scanned>" HEAD` to count commits since the last scan. If that count is **more than 20 commits**, OR the scan date is **more than 30 days old**, invoke `project-scanner` in **Delta Scan Mode** before continuing. Announce this briefly ("Project memory is N commits behind — running a quick delta scan first") but don't wait for confirmation — this is a safe read+update-memory operation, not a code change. If `git rev-list` fails (not a git repo, etc.), skip this check gracefully and continue normally. *(The 20-commit / 30-day threshold here is intentionally identical to the Memory Health dashboard's staleness badge threshold — see `src/dashboard/server.js`'s `STALE_COMMIT_THRESHOLD`/`STALE_DAY_THRESHOLD` — so the badge and this gate never tell a developer contradictory stories. Change one, change both.)*
- `[ ]` **Step 2:** Determine which existing domain or module should own the feature, or whether a new one is justified. Do NOT depend on removed legacy docs such as `DOMAINS/`. If `.docs/` is missing or incomplete, fall back gracefully to direct repository inspection.
- `[ ]` **Step 2b:** Check whether `docs/spark/rules/KNOWLEDGE_RULES.md` exists. If it does, read it and treat every `Must` rule as a hard constraint and every `Should` rule as a strong preference during implementation, in addition to conventions found in `.docs/`. If a `Must` rule is violated, flag it explicitly using the rule's own Rationale and Fix Guidance text.

### Phase 2: Tactical Delegation (Scoping & Planning)
- `[ ]` **Step 3:** Invoke the `brainstorming` skill to map out edge cases, UX flows, and failure modes for this enhancement.
- `[ ]` **Step 4:** Invoke the `writing-plans` skill to create a step-by-step implementation plan (saving to `docs/spark/plans/`). The plan MUST adhere to the standards found in Phase 1.

### Phase 3: Execution
- `[ ]` **Step 5:** Invoke the `executing-plans` skill to write the code.
- `[ ]` *(Optional)*: If the enhancement is massive (e.g., touching frontend UI, backend API, and database migrations simultaneously), invoke `dispatching-parallel-agents` to delegate the sub-tasks to specialized subagents.
- `[ ]` **Step 6:** Invoke the `verification-before-completion` skill before considering the enhancement done — run verification commands and confirm their output before claiming completion.
