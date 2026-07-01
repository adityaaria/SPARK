---
name: project-scanner
description: Use when analyzing an undocumented, legacy, or new project repository to extract its architectural and operational DNA.
---

# Project Scanner

## Overview

Use this skill to scan and document a codebase's architecture, operational rules, and hidden legacy traps. You must rely on file reading and listing tools rather than making assumptions. Traverse the root directory and key source directories to extract the project's DNA. This skill is polyglot—it applies to any tech stack (e.g., TypeScript, Go, Python, Java, PHP, Rust).

**Announce at start:** "spark detection 💥 Using project-scanner to analyze repository DNA"

**Save findings to:** The `.docs/` directory. **You must physically create this directory and save the files to disk using your tools. Do NOT just print the output to the user.** 

## Multi-Project Workspaces (CRITICAL)
If the workspace contains multiple independent projects or repositories (e.g., a `frontend` folder and a `backend` folder), you MUST generate a separate `.docs/` directory inside EACH project's root folder (e.g., `frontend/.docs/`, `backend/.docs/`). Do NOT combine them into a single global `.docs/` or dump everything into just one project's folder. Treat each independent project as its own ecosystem that requires its own documentation.

For large projects, break down the documentation logically (e.g., `.docs/PROJECT_SCAN.md`, `.docs/API_CONTRACT.md`, `.docs/DOMAINS/`) instead of creating one massive monolithic file.

## Handling Massive Codebases (Subagent Delegation)
If the repository is extremely large and analyzing all four pillars sequentially risks exceeding context limits or taking too long:
- Invoke the `dispatching-parallel-agents` skill.
- Delegate specific analytical tasks to specialized subagents in parallel (e.g., Subagent A extracts the API Contract, Subagent B extracts the Business Flow).
- Compile their findings into the final `.docs/` reports.

## Target Extraction Artifacts

Your final analysis must thoroughly document these five pillars:

### 1. ARCHITECTURE GRAPH (MERMAID)
You MUST generate a high-level visual representation of the project's architecture using Mermaid.js syntax.
- **Format:** Use a standard ````mermaid` code block.
- **Contents:** Map out the relationships between the Client (Frontend), Gateway, Services, and Database/Storage.
- **Syntax rules:** You may use standard flowchart arrows (`-->`, `-.->`, `==>`), but ensure the graph represents the actual architecture of the scanned codebase, not a generic template.

### 2. API CONTRACT
Identify how the application communicates internally and externally.
- **Priority Target:** Actively search for Swagger (`swagger.yaml`, `swagger.json`) or OpenAPI specifications. These are the single source of truth for the API contract.
- **Secondary Targets:** Discover REST/GraphQL endpoints, gRPC protos, ORM schemas, Data Transfer Objects (DTOs), and core data models.
- **Legacy Traps:** Flag any endpoints that violate current conventions or bypass standard authentication/validation layers.

### 3. WORKFLOW
Identify how the project is built, run, tested, and deployed.
- **Targets:** CI/CD pipelines (e.g., `.github/workflows`, `.gitlab-ci.yml`), build scripts (Makefiles, Gradle, NPM scripts), Dockerfiles, and deployment scripts.
- **Testing:** Identify the test framework, strategy (Unit, Integration, E2E), and explicitly highlight critical areas that lack test coverage.

### 4. BUSINESS FLOW & DOMAINS
Identify the core business logic and user journeys.
- **Targets:** Core domains, domain services, use cases, and state machines.
- **Domain Mapping:** Draft a list of business domains (e.g., Auth, Checkout, Inventory). Note their complexity, risk level, and the specific modules/packages that own them. Avoid forcing a domain split if the project is small.

### 5. STANDARDS & ANTI-PATTERNS
Identify conventions, rules, and technical debt enforced or found in the codebase.
- **Targets:** Code styling conventions, linting rules, architectural patterns (e.g., MVC, Hexagonal, Clean Architecture).
- **Anti-Pattern Detection (CRITICAL):** Actively search for and document legacy traps:
  - Business logic leaked into controllers, presentation, or routing layers.
  - Inconsistent database queries (e.g., raw queries mixed with ORM) or N+1 query problems.
  - Misleading naming (e.g., `Utils` files containing heavy domain logic).
  - Hardcoded external URLs, API keys, or magic numbers.
  - Bypass comments (e.g., `@ts-ignore`, `// HACK`, `// FIXME`, `#nosec`) without explanations.
  - Duplicated logic across modules.

## Execution Checklist

- `[ ]` **Step 1:** Announce skill usage exactly as required.
- `[ ]` **Step 2:** Identify if the workspace contains multiple independent projects (e.g., frontend vs backend). If so, plan to scan and generate `.docs/` for EACH project separately.
- `[ ]` **Step 3:** Scan root configuration files and prioritize searching for Swagger/OpenAPI specifications.
- `[ ]` **Step 4:** Scan source directory structures and generate a ````mermaid` architecture graph detailing the core components and their relationships.
- `[ ]` **Step 5:** Analyze testing frameworks, CI/CD workflows, and actively hunt for anti-patterns and legacy traps.
- `[ ]` **Step 6 (CRITICAL):** You MUST use your file-writing tools to physically create the `.docs/` directory (inside each project root if multi-repo) and save the markdown files (e.g. `PROJECT_SCAN.md`, `API_CONTRACT.md`) into it. DO NOT just print the summary into the chat! You must physically write the files to disk.
