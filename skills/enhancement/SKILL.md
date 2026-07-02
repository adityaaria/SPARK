---
name: enhancement
description: Use to build a new feature or enhancement by aligning strictly with the project's existing business flow and domain architecture.
---

# Enhancement (Meta-Skill)

## Overview

Use this skill to orchestrate the safe addition of new features. Do not inject your own architectural preferences. You must ground yourself in the project's reality, scope the feature thoughtfully, plan it out, and execute it using the project's established conventions.

**Announce at start:** "spark detection 💥 Using enhancement meta-skill to coordinate feature development"

## Standard Operating Procedure (SOP)

You MUST execute this checklist strictly in order. Do not skip steps.

### Phase 1: Context Grounding
- `[ ]` **Step 1:** Check whether `.docs/` exists for the relevant project root. If it does, read the local project memory first. Focus heavily on `PROJECT_SCAN.md`, `PROJECT_PROFILE.md`, `FEATURE_MAP.md`, `BUSINESS_FLOW.md`, `DOMAIN_MAP.md`, and `TESTING_STRATEGY.md`.
- `[ ]` **Step 2:** Determine which existing domain or module should own the feature, or whether a new one is justified. Do NOT depend on removed legacy docs such as `DOMAINS/`. If `.docs/` is missing or incomplete, fall back gracefully to direct repository inspection.

### Phase 2: Tactical Delegation (Scoping & Planning)
- `[ ]` **Step 3:** Invoke the `brainstorming` skill to map out edge cases, UX flows, and failure modes for this enhancement.
- `[ ]` **Step 4:** Invoke the `writing-plans` skill to create a step-by-step implementation plan (saving to `docs/spark/plans/`). The plan MUST adhere to the standards found in Phase 1.

### Phase 3: Execution
- `[ ]` **Step 5:** Invoke the `executing-plans` skill to write the code.
- `[ ]` *(Optional)*: If the enhancement is massive (e.g., touching frontend UI, backend API, and database migrations simultaneously), invoke `dispatching-parallel-agents` to delegate the sub-tasks to specialized subagents.
