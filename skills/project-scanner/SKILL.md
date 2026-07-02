---
name: project-scanner
description: Use when analyzing an undocumented, legacy, or new project repository to build or refresh stable project memory from real files.
---

# Project Scanner

## Overview

Use this skill to turn a repository into stable project memory for later skills. You must rely on file reading and listing tools rather than making assumptions. Traverse the repository using file evidence to extract durable facts from the real codebase.

This skill is **polyglot**, **framework-agnostic**, and **evidence-driven**. It applies to any programming language, framework, or architecture.

**Announce at start:**

> spark detection 💥 Using project-scanner to build project memory

**Save findings to:** the `.docs/` directory.

You must physically create this directory and write the output files to disk using your available tools. Never only print the generated memory to the conversation.

---

# Project Memory Contract

This skill is a **Project Memory Builder**, **not** an intelligence artifact builder.

Its responsibility is to build stable project memory that can be reused by every other SPARK skill.

## Write Stable Memory Only

Persist only durable project knowledge such as:

- technology stack
- project structure
- workspace map
- architecture graph
- feature map
- API contract
- database catalog
- business flow
- domain map
- existing testing strategy

## Never Persist Temporary Intelligence

Never save temporary analytical conclusions into `.docs/`, including:

- risk snapshots
- impact analysis
- tech debt snapshots
- severity labels
- task recommendations
- next actions

If temporary findings are discovered during scanning, report them only in the final agent response under:

- Temporary Findings
- Risks
- Recommended Next Actions

Do **not** save those findings as permanent memory.

---

# Required Output Files

Each valid project root must contain exactly these stable memory files.

```text
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

Never generate permanent intelligence artifacts such as:

- TECH_DEBT.md
- RISK_ANALYSIS.md
- IMPACT_INDEX.md
- ANALYSIS_SUMMARY.md

The stable memory contract is limited to these 10 files only. Do not create `STANDARDS.md` or any other extra memory file outside this contract.

---

# Evidence Requirements

Every memory document must be based on real file evidence.

Each document must include:

- Last Scanned
- Confidence (High / Medium / Low)
- Evidence (real file paths)
- Gaps / Unknowns

Never infer information that cannot be proven from files.

If something cannot be verified, record it under **Gaps / Unknowns** instead of making assumptions.

When a capability truly does not exist for a project root, do not fabricate content. Use an explicit **Not Applicable** section with:

- the conclusion (`Not Applicable`)
- the supporting evidence
- any remaining gaps if the absence is only partially proven

This applies especially to:

- `API_CONTRACT.md` for projects with no externally exposed API surface
- `DATABASE_CATALOG.md` for projects with no persistence layer

---

# Refresh and Reconciliation Rules

When `.docs/` already exists, this skill must refresh it instead of layering new memory on top of stale artifacts.

On every scan for a valid project root:

- rewrite all 10 stable memory files from current repository evidence
- preserve the 10-file contract exactly
- remove stale legacy artifacts in `.docs/` that are outside the contract
- remove stale intelligence artifacts such as `TECH_DEBT.md`, `RISK_ANALYSIS.md`, `IMPACT_INDEX.md`, `ANALYSIS_SUMMARY.md`, and `STANDARDS.md`
- never leave both old and new memory shapes side by side

If the agent cannot safely reconcile `.docs/` because of filesystem problems or conflicting developer instructions, it must say so explicitly in the final response.

---

# Project Discovery Strategy

Before generating project memory, determine the project boundary using file evidence.

## Evidence First

Project boundaries must always be determined from real repository evidence.

Never determine project boundaries from folder names alone.

Framework detection is metadata only.

Framework detection may enrich the documentation but must never become the primary mechanism for determining project structure or memory.

## Single Project

Treat the current root as a project only when sufficient evidence indicates it is a complete software project.

Evidence may include (but is not limited to):

- build configuration
- package or dependency manifests
- runtime configuration
- source directories
- application entrypoints
- testing configuration
- deployment configuration

Use multiple independent pieces of evidence whenever possible.

## Multi-Project Workspace

If multiple independent projects exist:

- identify each valid project root independently
- verify each project using its own evidence
- generate one `.docs/` directory inside each valid project root
- never merge memory between independent projects
- treat every project as its own memory boundary

Project memory must remain isolated between independent projects.

Cross-project relationships should only be established when supported by explicit file evidence or explicit developer instructions.

---

# Stable Memory Scope

## PROJECT_SCAN

Repository summary, detected project type, scan scope, detected project roots, and primary evidence anchors.

---

## PROJECT_PROFILE

Technology stack, runtime, package managers, build tools, frameworks, execution entrypoints, and operational overview.

This file is also the home for stable project-wide engineering conventions such as:

- architectural style
- layering conventions
- linting conventions
- formatting conventions
- package or dependency organization conventions

---

## ARCHITECTURE_GRAPH

High-level Mermaid architecture graph derived from real relationships found in the repository.

---

## WORKSPACE_MAP

Directory-level map showing the overall project organization and project boundaries.

This file is also the home for stable repository organization conventions such as:

- root-level layout
- workspace boundaries
- package or app placement
- shared directory patterns

---

## FEATURE_MAP

Stable mapping between user-facing or system-facing features and the modules, packages, and files that implement them.

---

## API_CONTRACT

Document externally exposed interfaces.

Priority:

1. OpenAPI / Swagger
2. REST
3. GraphQL
4. gRPC
5. DTOs
6. Schemas
7. Core API models

If no externally exposed API surface exists, `API_CONTRACT.md` must contain a **Not Applicable** section with supporting evidence.

---

## DATABASE_CATALOG

Database technologies, schemas, entities, models, migrations, repositories, and storage boundaries.

If no persistence layer exists, `DATABASE_CATALOG.md` must contain a **Not Applicable** section with supporting evidence.

---

## BUSINESS_FLOW

Stable business workflows, use cases, state transitions, and business processes that can be proven from source code.

---

## DOMAIN_MAP

Logical domains, bounded contexts, responsibilities, ownership boundaries, and domain relationships.

Avoid forcing unnecessary domain decomposition for small projects.

---

## TESTING_STRATEGY

Existing testing frameworks, project test layout, available test commands, testing conventions, and supported testing approaches.

This file is the home for stable testing conventions. Do not duplicate them into another standards document.

---

# Handling Massive Codebases

If sequential analysis risks exceeding context limits or becoming inefficient:

- invoke the `dispatching-parallel-agents` skill
- delegate independent memory areas to specialized subagents
- merge the verified results into the final project memory
- ensure every subagent also follows the Evidence Requirements

---

# Extraction Targets

The scanner builds project memory only from verifiable repository evidence.

## Architecture

Generate a Mermaid architecture graph based on real relationships between components, services, packages, infrastructure, and storage.

## API

Identify communication contracts.

Priority:

- OpenAPI / Swagger
- REST
- GraphQL
- gRPC
- DTOs
- Schemas
- Interface definitions

## Database

Identify storage technologies, schemas, entities, repositories, migrations, and persistence boundaries.

## Workflow

Identify how the project is:

- built
- configured
- executed
- tested
- deployed

using only repository evidence.

## Business

Identify stable business capabilities including:

- business domains
- use cases
- business services
- state transitions
- feature ownership

## Standards

Capture stable engineering conventions such as:

- architectural style
- layering conventions
- linting
- formatting
- testing conventions
- repository organization

Persist them only into their designated stable memory files:

- project-wide engineering conventions -> `PROJECT_PROFILE.md`
- repository organization conventions -> `WORKSPACE_MAP.md`
- testing conventions -> `TESTING_STRATEGY.md`

Do not create `STANDARDS.md`. Do not bury these conventions arbitrarily in unrelated files.

Never persist temporary judgments or recommendations.

---

# Execution Checklist

- [ ] Announce skill usage exactly as required.
- [ ] Determine project boundaries using repository evidence.
- [ ] Identify every valid project root.
- [ ] Create one `.docs/` directory inside each valid project root.
- [ ] If `.docs/` already exists, refresh it by rewriting the 10 contract files and pruning stale legacy artifacts.
- [ ] Scan configuration, source, workflow, testing, API, and persistence artifacts.
- [ ] Generate exactly the ten stable memory documents.
- [ ] Use explicit `Not Applicable` sections with evidence for missing API or database layers instead of fabricating content.
- [ ] Include Last Scanned, Confidence, Evidence, and Gaps / Unknowns in every document.
- [ ] Never persist temporary intelligence artifacts.
- [ ] Present temporary findings, risks, and recommendations only in the final agent response.
