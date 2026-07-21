---
name: bug-fix
description: Use when fixing a bug in a project that has established standards, debugging protocols, or documented project memory to ground the fix in.
---

# Bug Fix (Meta-Skill)

## Overview

Use this skill to orchestrate a safe, standard-compliant bug fix. You are not allowed to blindly modify code based on assumptions. You must first ground yourself in the project's context, trace the bug systematically, and execute the fix using disciplined test-driven practices.

**Announce at start:** "spark detection 💥 Using bug-fix meta-skill to coordinate this investigation"

## Standard Operating Procedure (SOP)

You MUST execute this checklist strictly in order. Do not skip steps.

### Phase 1: Context Grounding
Before touching any code, you must understand the rules of this repository.
- `[ ]` **Step 1:** Check whether `.docs/` exists for the relevant project root. If it does, read the local project memory there before touching code. Start with `PROJECT_SCAN.md`, `PROJECT_PROFILE.md`, `ARCHITECTURE_GRAPH.md`, `API_CONTRACT.md`, `DOMAIN_MAP.md`, and `TESTING_STRATEGY.md`.
- `[ ]` **Step 1b — Staleness Check:** After reading `.docs/`, check the `Last Scanned` field in `PROJECT_SCAN.md`. Run `git rev-list --count --since="<Last Scanned>" HEAD` to count commits since the last scan. If that count is **more than 20 commits**, OR the scan date is **more than 30 days old**, invoke `project-scanner` in **Delta Scan Mode** before continuing. Announce this briefly ("Project memory is N commits behind — running a quick delta scan first") but don't wait for confirmation — this is a safe read+update-memory operation, not a code change. If `git rev-list` fails (not a git repo, etc.), skip this check gracefully and continue normally. *(The 20-commit / 30-day threshold here is intentionally identical to the Memory Health dashboard's staleness badge threshold — see `src/dashboard/server.js`'s `STALE_COMMIT_THRESHOLD`/`STALE_DAY_THRESHOLD` — so the badge and this gate never tell a developer contradictory stories. Change one, change both.)*
- `[ ]` **Step 2:** Use that memory to identify proven architecture boundaries, contracts, conventions, and known gaps. Do NOT depend on removed legacy docs such as `STANDARDS.md` or `DOMAINS/`. If `.docs/` is missing or incomplete, fall back gracefully to direct repository inspection.
- `[ ]` **Step 2b:** Check whether `docs/spark/rules/KNOWLEDGE_RULES.md` exists. If it does, read it and treat every `Must` rule as a hard constraint and every `Should` rule as a strong preference during investigation and the fix, in addition to conventions found in `.docs/`. If a `Must` rule is violated, flag it explicitly using the rule's own Rationale and Fix Guidance text.

### Phase 2: Tactical Delegation (Investigation)
Do not guess the root cause. Delegate the investigation.
- `[ ]` **Step 3:** Invoke the `systematic-debugging` skill. Follow its rigorous condition-based waiting and root-cause tracing protocols to find exactly what is broken.
- `[ ]` *(Optional)*: If the bug spans multiple independent services, invoke `dispatching-parallel-agents` to investigate them concurrently.

### Phase 3: Execution
Once the root cause is proven (not guessed), fix it safely.
- `[ ]` **Step 4:** Invoke the `test-driven-development` skill. Write a failing test that reproduces the bug, then implement the minimal code required to make it pass. Ensure your fix aligns with the architecture rules read in Phase 1.
