---
name: project-scanner
description: Use when analyzing an undocumented, legacy, or new project repository to build or refresh stable project memory from real files.
---

# Project Scanner

## Overview

Use this skill to turn a repository into stable project memory for later skills.

This skill is a **Stable Project Memory Builder**, not an intelligence artifact builder. It is polyglot, framework-agnostic, workspace-aware, and evidence-driven.

**Announce at start:**

> spark detection 💥 Using project-scanner to build project memory

**Save findings to:** `.docs/`.

You must physically create `.docs/` and write memory files to disk. Never only print generated memory in chat.

## Reference Routing

Read the relevant references before scanning:

- Always read `references/memory-contract.md`.
- Read `references/evidence-and-confidence.md` before evaluating facts, conflicts, or absence.
- Read `references/discovery-workflow.md` before repository exploration.
- Read `references/reusable-and-behavior.md` when the project has frontend/UI, CLI screens, document templates, generated skeletons, reusable components, or mirroring/template goals.

Do not load unrelated references if the project surface does not need them.

## Core Contract

Persist only durable project knowledge:

- technology stack
- project structure and workspace map
- architecture graph
- feature map
- API contract
- database catalog
- business flow
- domain map
- testing strategy
- standard folder/file skeletons
- reusable presentation architecture
- stable boundary anti-patterns

Never persist temporary intelligence in `.docs`, including:

- risk snapshots
- impact analysis
- tech debt snapshots
- task recommendations
- severity labels
- legacy trap inventories
- broad cleanup/refactor wishlists

Report temporary findings only in the final response under `Temporary Findings`, `Risks`, or `Recommended Next Actions`.

## Required Output

Each valid project root must contain exactly:

```txt
.docs/
├── PROJECT_SCAN.md
├── PROJECT_PROFILE.md
├── ARCHITECTURE_GRAPH.md
├── WORKSPACE_MAP.md
├── FEATURE_MAP.md
├── API_CONTRACT.md
├── DATABASE_CATALOG.md
├── BUSINESS_FLOW.md
├── DOMAIN_MAP.md
└── TESTING_STRATEGY.md
```

Do not create permanent intelligence artifacts such as `TECH_DEBT.md`, `RISK_ANALYSIS.md`, `IMPACT_INDEX.md`, `ANALYSIS_SUMMARY.md`, or `STANDARDS.md`.

## Memory Placement

Place reusable component, behavior, layout, visual, and standard skeleton knowledge inside the same 10-file contract:

- `PROJECT_PROFILE.md` — technology stack, UI/presentation summary, design-system strategy, behavior-pattern summary, standard skeleton summary
- `ARCHITECTURE_GRAPH.md` — architecture nodes, presentation/component layers, dependency direction, behavior ownership, boundary anti-patterns
- `WORKSPACE_MAP.md` — shared, feature-owned, layout, generated, test, config, reusable implementation, and copy-safety boundaries
- `FEATURE_MAP.md` — feature-to-view/page/component composition, page archetypes, required sections, state handling, feature-owned reusable units
- `DOMAIN_MAP.md` — business-specific terms, entities, workflows, roles, labels, and concepts that must not become universal template concepts
- `BUSINESS_FLOW.md` — source business workflows that downstream mirroring must replace or explicitly preserve
- `TESTING_STRATEGY.md` — component, view, layout, module, generated-skeleton, reusable behavior, and page-archetype testing conventions

Do not turn observed behavior into a prescriptive rule inside `.docs`. If the developer wants behavior enforced, propose it through `spark:knowledge-rules`.

## Execution Flow

1. Identify project roots and workspace boundaries.
2. Read relevant references from `references/`.
3. Explore repository evidence in priority order.
4. Build one internal repository model.
5. Expand durable facts into reusable project knowledge.
6. Classify confidence and generation safety.
7. Write the exact 10 `.docs` files for each valid project root.
8. Report temporary findings separately from stable memory.

## Non-Negotiables

- Source code and runtime config override README/prose.
- Evidence overrides assumptions.
- Unknown is better than incorrect.
- Isolated implementations do not define project-wide conventions.
- Multi-project workspace memory stays isolated per project root.
- Business-specific concepts remain replaceable inputs for downstream mirroring.
- Copy-safe classification requires strict evidence; do not mark code `Copy-safe` by default.

## Checklist

- [ ] Announce skill usage.
- [ ] Read `references/memory-contract.md`.
- [ ] Read `references/evidence-and-confidence.md`.
- [ ] Read `references/discovery-workflow.md`.
- [ ] Read `references/reusable-and-behavior.md` if reusable UI, behavior, skeleton, or mirroring knowledge is relevant.
- [ ] Detect valid project root(s).
- [ ] Build one internal model per project root.
- [ ] Write exactly the 10 `.docs` files per valid project root.
- [ ] Keep temporary intelligence out of `.docs`.
- [ ] Include evidence, confidence, and gaps/unknowns in every memory document.
- [ ] Report final scan result clearly.
