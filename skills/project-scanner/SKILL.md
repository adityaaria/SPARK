---
name: project-scanner
description: Use when analyzing an undocumented, legacy, or new project repository to build or refresh stable project memory from real files.
---

# Project Scanner

## Overview

Use this skill to turn a repository into stable project memory for later skills. It is a **Stable Project Memory Builder**, not an intelligence artifact builder.

This skill is **polyglot**, **framework-agnostic**, **workspace-aware**, and **evidence-driven**. Its job is to understand a real repository from files, then persist only durable knowledge into the 10-file `.docs/` contract.

**Announce at start:**

> spark detection 💥 Using project-scanner to build project memory

**Save findings to:** the `.docs/` directory.

You must physically create this directory and write the output files to disk using your available tools. Never only print the generated memory to the conversation.

**Not to be confused with `docs/spark/plans/`:** `.docs/` stores stable project memory (durable facts about the repo). `docs/spark/plans/` (used by `spark:writing-plans`) stores per-feature work plans. These are separate folders with separate purposes — do not mix their contents.

---

# Project Memory Contract

This skill builds reusable stable project memory for every other SPARK skill.

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

- repository purpose inference
- primary user inference
- risk snapshots
- impact analysis
- tech debt snapshots
- severity labels
- task recommendations
- next actions
- legacy trap inventories

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

# Thinking Rules

Apply these reasoning rules before and during scanning:

- evidence overrides assumption
- unknown is better than incorrect
- source code overrides README
- implementation overrides comments
- runtime configuration overrides prose documentation
- repository structure overrides folder-name guesswork
- multiple independent evidence anchors override a single isolated clue
- majority implementation may define a convention only when conflicting variants are explicitly documented
- isolated implementations do not redefine project-wide conventions
- if a boundary or relationship is ambiguous, record it under **Gaps / Unknowns**

These rules improve scanner quality, but they do **not** expand what may be persisted.

---

# Evidence Requirements

Every memory document must be based on real file evidence.

Each document must include:

- Last Scanned
- Confidence
- Evidence (real file paths)
- Gaps / Unknowns

Never infer information that cannot be proven or responsibly derived from files.

If something cannot be verified, record it under **Gaps / Unknowns** instead of making assumptions.

If documentation conflicts with implementation, prefer implementation and mark the affected claim as **Documentation Conflict**.

If a capability truly does not exist for a project root, do not fabricate content. Use an explicit **Not Applicable** section with:

- the conclusion (`Not Applicable`)
- the supporting evidence
- any remaining gaps if the absence is only partially proven

This applies especially to:

- `API_CONTRACT.md` for projects with no externally exposed API surface
- `DATABASE_CATALOG.md` for projects with no persistence layer

---

# Confidence Engine

Replace generic High / Medium / Low confidence with these labels:

- `Confirmed from Code`
- `Inferred from Code Structure`
- `Documentation Conflict`
- `Unverified Pattern`
- `Insufficient Evidence`
- `AI-Risk`
- `Not Applicable`

Use them precisely:

| Confidence | Meaning |
|---|---|
| `Confirmed from Code` | Directly proven by source, config, schema, tests, or executable project files |
| `Inferred from Code Structure` | Strongly supported by converging implementation patterns, but not explicitly declared |
| `Documentation Conflict` | Documentation claims something the implementation does not clearly support |
| `Unverified Pattern` | Pattern appears in limited places and should not yet be treated as repository-wide fact |
| `Insufficient Evidence` | Available files do not support a reliable conclusion |
| `AI-Risk` | Common agent assumption trap; warn in final response only, not stable memory |
| `Not Applicable` | Capability does not exist for this project root based on evidence |

Every stable memory document still needs a **Confidence** field. Use the dominant label for the document summary, and use more specific labels inline where needed.

---

# Evidence Scoring

Do not conclude from one clue when stronger evidence is available. Build conclusions from weighted evidence.

## Evidence Priority

Prefer evidence in roughly this order:

1. executable source code and entrypoints
2. runtime configuration and dependency manifests
3. schema, migration, DTO, and interface definitions
4. tests that prove intended behavior
5. generated contracts such as OpenAPI
6. repository documentation
7. comments and TODO text

## Scoring Heuristics

- one strong code anchor beats multiple weak prose anchors
- converging evidence from different layers increases confidence
- repeated implementation patterns across modules increase confidence
- a single outlier lowers confidence for project-wide claims
- absent imports, absent routes, absent schemas, or absent migrations can support `Not Applicable`, but only when the search scope is broad enough

If confidence depends on contested or sparse evidence, downgrade it instead of forcing certainty.

---

# Repository Understanding

Before generating stable memory, understand the repository internally. This phase builds a **Unified Internal Repository Model** that exists only during scanning and does **not** create new permanent artifacts.

Infer, when supported by evidence:

- application purpose
- primary users
- architecture style
- execution model
- engineering philosophy
- extension strategy
- ownership boundaries
- major capabilities

Use these internal conclusions only to sharpen:

- feature grouping
- domain boundaries
- architecture summaries
- convention detection
- workspace separation
- recursive discovery
- semantic relationships
- stable memory consistency

The Unified Internal Repository Model is the shared reasoning layer for the scan. It is temporary, never persisted, and must not appear as a new artifact in `.docs/`.

Do **not** persist the repository-understanding summary as its own memory file.

---

# Repository Validation

Before writing memory, validate the boundaries that control what belongs in each document.

Validate:

- workspace boundary
- project boundary
- module boundary
- feature boundary
- persistence boundary
- interface boundary

If a boundary is ambiguous:

- do not guess
- do not merge unrelated areas
- record the ambiguity under **Gaps / Unknowns**
- lower confidence accordingly

Boundary validation protects the Stable Memory Contract from fabricated structure.

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

Framework detection is metadata only. It may enrich the documentation but must never become the primary mechanism for determining project structure or memory.

## Single Project

Treat the current root as a project only when sufficient evidence indicates it is a complete software project.

Evidence may include:

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

# Discovery Workflow

Explore the repository in an order that maximizes reliable evidence.

1. root dependency and build manifests
2. top-level directory layout
3. primary entrypoints and runtime bootstrap
4. module or package barrels, indexes, or registration files
5. entity, schema, model, DTO, and migration definitions
6. API surface definitions and route registrations
7. configuration, environment, and deployment files
8. tests that reveal intended behavior
9. targeted searches for repeated conventions and exceptions

Prefer reading the implementation path before trusting summaries about it.

---

# Unified Internal Repository Model

Repository Understanding must build one shared internal model of the repository before stable memory is projected.

This model remains internal to the scan and is never persisted.

It may internally represent repository knowledge such as:

- workspace
- project
- module
- package
- folder
- feature
- business capability
- domain
- workflow
- page
- component
- store
- service
- API
- DTO
- entity
- repository
- migration
- configuration
- environment
- test
- build
- infrastructure
- integration
- external service
- permission
- validation
- state
- event
- extension point
- convention

The exact implementation is not prescribed. What matters is one consistent internal model reused by the entire scan.

---

# Knowledge Expansion

After repository discovery, expand each discovered artifact into reusable project knowledge before writing stable memory.

The scanner must move beyond "what exists" and, where evidence supports it, explain:

- what it is
- why it exists
- who uses it
- where it is used
- what depends on it
- what it depends on
- how it is extended
- how it is configured
- how it is validated
- how it is tested
- how it participates in business workflows
- how it participates in architecture

Only include expanded knowledge that is supported by repository evidence.

## Knowledge Enrichment Rules

Whenever the scanner discovers a feature, domain, workflow, API surface, database entity, module, package, or architecture node, expand it using the strongest available evidence.

Possible expansion dimensions include:

- purpose
- business objective
- business value
- primary actor
- pages or entry surfaces
- components
- stores
- services
- API
- DTOs
- validation
- configuration
- dependencies
- related features
- related domains
- workflow position
- permission model
- extension points
- testing coverage

If a dimension cannot be supported from files, omit it or record it under **Gaps / Unknowns**. Never fill expansion sections with generic filler.

---

# Relationship Model

Derive a temporary **Relationship Model** from the Unified Internal Repository Model. Use semantic relationships instead of vague references whenever evidence supports them.

Prefer relationships such as:

- contains
- implements
- owns
- extends
- uses
- depends_on
- calls
- creates
- updates
- validates
- maps_to
- publishes
- consumes
- belongs_to
- configures
- protects
- initializes

Examples:

- feature -> belongs_to -> domain
- feature -> implemented_by -> component
- store -> uses -> service
- service -> calls -> API
- API -> consumes -> DTO
- workflow -> uses -> feature
- permission -> protects -> feature
- configuration -> configures -> API
- validation -> protects -> workflow

Avoid generic wording like "related" when a stronger evidence-backed semantic relationship exists.

---

# Recursive Discovery

Discovery must continue through evidence-backed relationships instead of stopping at one level.

When an artifact is found, continue discovering connected artifacts until no additional evidence-backed relationship exists.

Examples:

- feature -> store -> service -> API -> DTO -> validation -> workflow -> testing -> configuration -> domain -> architecture
- workflow -> state -> validation -> permission -> API -> domain
- entity -> repository -> service -> feature -> testing

Recursive discovery must remain evidence-driven. Stop when the next hop is unsupported or ambiguous.

---

# Traceability Model

Derive a temporary **Traceability Model** from the Unified Internal Repository Model and the Relationship Model.

Use it to answer, when supported by evidence:

- who owns an artifact
- who uses an artifact
- what depends on it
- what it depends on
- what business capability it supports
- where it appears in the workflow
- how it connects to testing, configuration, and integration boundaries

This model improves consistency and downstream reuse, but it is never persisted as its own artifact.

---

# Impact Model

Derive a temporary **Impact Model** from the Unified Internal Repository Model, Relationship Model, and Traceability Model.

Use it internally to understand change propagation such as:

- feature -> affected API
- feature -> affected workflow
- feature -> affected domain
- feature -> affected validation
- feature -> affected testing
- feature -> affected configuration
- feature -> affected integration

Do not persist this model. Use it only to improve stable memory accuracy, completeness, and downstream usefulness.

---

# Stable Memory Projection

The 10 `.docs` files are projections of one shared internal model.

This means:

- documents do not independently rediscover repository facts
- documents project stable knowledge from the same internal reasoning layer
- terminology, ownership, and relationships stay consistent across files
- no extra intelligence artifact is created or persisted

The projection must increase consistency and traceability without increasing output just for length.

---

# Knowledge Validation

Before memory generation, validate that the expanded and connected knowledge is still evidence-driven and contract-safe.

Check:

- expansion depth does not introduce unsupported assumptions
- projected sections reference real repository relationships
- every rich section still has evidence and confidence
- isolated one-line inventories are expanded when evidence exists
- duplicated text across documents is reduced in favor of complementary coverage
- document depth increases clarity, traceability, reusability, maintainability, evidence quality, and consistency
- one consistent internal model is being projected across the 10 stable memory files

Richer knowledge is required. Longer prose without better evidence is not.

---

# Convention Discovery

Actively discover stable engineering conventions from repeated evidence. Document them only when supported by files.

Look for:

- folder convention
- dependency direction
- layering
- validation patterns
- DTO patterns
- error handling patterns
- configuration strategy
- testing conventions
- extension points

Rules:

- repeated patterns across modules may become stable memory
- isolated or contradictory patterns remain `Unverified Pattern` or go to **Gaps / Unknowns**
- conventions belong only in their designated stable memory files, not in a separate standards artifact

---

# Relationship Discovery

Actively discover the relationships that explain how the repository actually works.

Look for:

- dependency graph
- request flow
- state flow
- validation flow
- configuration flow
- ownership boundaries
- service interaction
- module interaction
- feature interaction

Only persist relationships that can be supported by imports, registrations, wiring, schemas, routes, tests, or other real repository evidence.

---

# Legacy Discovery

Actively search for temporary intelligence that improves scan quality but must **not** be persisted to `.docs/`.

Look for:

- dead code
- duplicate logic
- large controller
- large service
- TODO
- FIXME
- technical debt markers
- deprecated implementation
- raw SQL
- magic numbers
- temporary bypass
- unused module

These findings may sharpen confidence, reveal exceptions, or explain inconsistencies. Report them only in the final agent response as temporary intelligence.

Do **not** convert them into permanent memory files or stable repository facts unless a durable convention can be proven independently.

---

# Stable Memory Scope

## PROJECT_SCAN

Repository summary, detected project type, scan scope, detected project roots, and primary evidence anchors.

## PROJECT_PROFILE

Technology stack, runtime, package managers, build tools, frameworks, execution entrypoints, and operational overview.

This file is also the home for stable project-wide engineering conventions such as:

- architectural style
- layering conventions
- linting conventions
- formatting conventions
- package or dependency organization conventions

Expand this file with richer stable knowledge when supported by evidence:

- Project Overview
- Business Context
- Project Objectives
- Project Scope
- Technology Stack
- Frameworks
- Runtime
- Execution Model
- Deployment Strategy
- Configuration Strategy
- Architecture Style
- Package Structure
- Dependency Strategy
- Coding Convention
- Validation Convention
- Testing Convention
- Logging Convention
- Security Convention
- Performance Considerations
- Scalability Considerations
- Integration Points
- Third-party Dependencies
- Known Constraints

## ARCHITECTURE_GRAPH

High-level Mermaid architecture graph derived from real relationships found in the repository.

In addition to Mermaid, explain when evidence supports it:

- Architecture Style
- Major Components
- Interaction Flow
- Communication Pattern
- Dependency Direction
- Infrastructure Boundary
- Integration Points
- Extension Points

## WORKSPACE_MAP

Directory-level map showing the overall project organization and project boundaries.

This file is also the home for stable repository organization conventions such as:

- root-level layout
- workspace boundaries
- package or app placement
- shared directory patterns

Expand this file with:

- Workspace Purpose
- Project Structure
- Folder Responsibilities
- Module Ownership
- Shared Libraries
- Boundary Definitions
- Cross-project Relationships
- Repository Organization
- Build Organization

## FEATURE_MAP

Stable mapping between user-facing or system-facing features and the modules, packages, and files that implement them.

Each feature should include whatever is supported by evidence:

- Purpose
- Business Objective
- Primary Actor
- Business Value
- Pages
- Components
- Stores
- Services
- API
- DTO
- Validation
- Configuration
- Dependencies
- Related Features
- Related Domains
- Workflow
- Permission
- Extension Points
- Testing

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

Each endpoint group should include whenever evidence supports it:

- Purpose
- Business Context
- Authentication
- Authorization
- Request DTO
- Response DTO
- Validation
- Business Rules
- Error Responses
- Related Features
- Related Domains
- Related Services
- Related Stores
- Related Workflow

## DATABASE_CATALOG

Database technologies, schemas, entities, models, migrations, repositories, and storage boundaries.

If no persistence layer exists, `DATABASE_CATALOG.md` must contain a **Not Applicable** section with supporting evidence.

If applicable, include:

- Technology
- Connection Strategy
- Schema
- Entities
- Relationships
- Repositories
- Migrations
- Constraints
- Indexes
- Transactions
- Ownership
- Consumers
- Related Domains

## BUSINESS_FLOW

Stable business workflows, use cases, state transitions, and business processes that can be proven from source code.

Each workflow should include whenever evidence supports it:

- Workflow Name
- Business Goal
- Trigger
- Primary Actor
- Preconditions
- Main Flow
- Alternative Flow
- Exception Flow
- Decision Points
- Validation Rules
- State Transition
- API Sequence
- Data Flow
- Post Conditions
- Related Features
- Related Domains

## DOMAIN_MAP

Logical domains, bounded contexts, responsibilities, ownership boundaries, and domain relationships.

Avoid forcing unnecessary domain decomposition for small projects.

Each domain should include whenever evidence supports it:

- Purpose
- Responsibilities
- Business Rules
- Owned Features
- Owned APIs
- Owned DTOs
- Owned Stores
- Owned Services
- Owned Components
- Owned Configuration
- Inbound Dependencies
- Outbound Dependencies
- Related Domains
- State Ownership
- Ownership Boundary
- Extension Points

## TESTING_STRATEGY

Existing testing frameworks, project test layout, available test commands, testing conventions, and supported testing approaches.

This file is the home for stable testing conventions. Do not duplicate them into another standards document.

Expand with:

- Testing Pyramid
- Testing Scope
- Testing Frameworks
- Coverage Strategy
- Test Structure
- Naming Convention
- Mock Strategy
- Fixtures
- Coverage Gaps
- CI Integration

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

# Cross Document Consistency

All generated documents must remain internally consistent.

Examples:

- feature names must match across `FEATURE_MAP.md`, `BUSINESS_FLOW.md`, `DOMAIN_MAP.md`, `API_CONTRACT.md`, and `ARCHITECTURE_GRAPH.md`
- ownership boundaries must not contradict workspace or domain boundaries
- API group names, DTO names, and service names should align across files when they refer to the same implementation

Never describe the same concept differently across documents unless the repository itself encodes a documented exception.

---

# Duplicate Prevention

Each document owns specific knowledge. Avoid repeating identical information across files.

Use this rule:

- explain a concept fully in its natural home
- reference related concepts in other files through connected descriptions
- repeat only the minimum needed for local clarity

The 10 memory files should form one connected knowledge system, not 10 copies of the same inventory.

---

# File Ownership Contract

Each knowledge type belongs to one primary document projection.

- `PROJECT_PROFILE.md` owns technology, runtime, architecture style, configuration, convention, dependencies, deployment, and integration context
- `FEATURE_MAP.md` owns feature, business objective, actor, workflow reference, dependencies, permission, and extension context
- `DOMAIN_MAP.md` owns domain, responsibilities, boundaries, and ownership context
- `BUSINESS_FLOW.md` owns workflow, decision points, state transitions, and business sequence context
- `API_CONTRACT.md` owns API, DTO, authentication, authorization, and validation context
- `DATABASE_CATALOG.md` owns persistence, entity, repository, migration, and relationship context
- `WORKSPACE_MAP.md` owns repository structure, folder responsibility, and workspace organization context
- `ARCHITECTURE_GRAPH.md` owns architecture, communication, dependency graph, and infrastructure context
- `TESTING_STRATEGY.md` owns testing strategy, coverage, mocks, fixtures, and CI context

Avoid ownership overlap. When a concept must appear in multiple projections, explain it fully in its owning document and reference it concisely elsewhere.

---

# Memory Completeness Validation

Before finishing generation, verify that the enriched memory is complete enough to be reused by future SPARK skills.

At minimum, confirm:

- every feature has Purpose, Dependencies, Workflow, Domain, API, and Evidence when those dimensions exist in the repository
- every domain has Responsibilities, Owned Features, Relationships, and Evidence
- every workflow has Trigger, Flow, Decision Points, Related Features, and Evidence
- every architecture node has Purpose, Interactions, Dependencies, and Evidence
- every projection is consistent with the same Unified Internal Repository Model

If the repository does not support one of these dimensions, record that limitation under **Gaps / Unknowns** instead of inventing it.

---

# Self Validation

Before considering the scan complete, validate the generated memory against the contract.

Check all of the following:

- no placeholder text
- no generic filler
- no unsupported claim
- every stable claim has evidence
- every document has a confidence label
- every unresolved ambiguity appears under **Gaps / Unknowns**
- temporary intelligence is not persisted
- the output is exactly the 10-file Stable Memory Contract
- cross-document naming is consistent
- each document is rich enough to explain how the project works, not just what files exist
- all documents read as projections of one consistent internal model

If any check fails, fix it before completing the scan.

---

# Execution Checklist

- [ ] Announce skill usage exactly as required.
- [ ] Apply the Thinking Rules before scanning.
- [ ] Determine workspace and project boundaries using repository evidence.
- [ ] Run Repository Understanding and build one Unified Internal Repository Model without persisting it as a new artifact.
- [ ] Validate workspace, project, module, feature, persistence, and interface boundaries.
- [ ] Identify every valid project root.
- [ ] Create one `.docs/` directory inside each valid project root.
- [ ] If `.docs/` already exists, refresh it by rewriting the 10 contract files and pruning stale legacy artifacts.
- [ ] Scan configuration, source, workflow, testing, API, and persistence artifacts.
- [ ] Derive the Relationship Model, Traceability Model, and Impact Model from the shared internal model.
- [ ] Use recursive discovery to follow evidence-backed relationships until they terminate naturally.
- [ ] Discover stable conventions and real relationships from repeated evidence.
- [ ] Project stable knowledge from the shared internal model into the 10 stable memory files.
- [ ] Generate exactly the ten stable memory documents.
- [ ] Use explicit `Not Applicable` sections with evidence for missing API or database layers instead of fabricating content.
- [ ] Include Last Scanned, Confidence, Evidence, and Gaps / Unknowns in every document.
- [ ] Keep legacy traps, risks, and recommendations out of `.docs/`.
- [ ] Run Self Validation before finishing.
- [ ] Present temporary findings, risks, and recommendations only in the final agent response.
