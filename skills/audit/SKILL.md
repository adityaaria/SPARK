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
- `[ ]` **Step 2:** Identify the exact boundaries of the code to be audited (e.g., a specific Pull Request, a newly written module, or a suspected legacy file).

### Phase 2: Tactical Delegation (Review)
- `[ ]` **Step 3:** Invoke the `receiving-code-review` (or `requesting-code-review` depending on your role) skill to structure your feedback.
- `[ ]` **Step 4:** Compare the target code strictly against the documented architecture, contracts, domains, testing strategy, and proven conventions from Phase 1. Actively flag any re-introduction of:
  - Business logic leaks.
  - Raw SQL/ORM mixing or N+1 queries.
  - Undocumented bypass comments (`@ts-ignore`, `// HACK`).

### Phase 3: Reporting
- `[ ]` **Step 5:** Output an Audit Report summarizing the violations. If the code is clean, explicitly state that it complies with the project memory and proven repository conventions in `.docs/`.
