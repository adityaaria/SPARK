---
name: project-onboarding
description: Use when generating a new project from an approved template blueprint or local template directory.
---

# Project Onboarding

## Overview

Use this skill to generate or prepare a project from an approved reusable template blueprint.

This skill is a **Project Onboarding Orchestrator**. It turns a developer request into a validated generated project handoff. It does not invent project structure, create templates, normalize templates, scan source repositories as a substitute for template inputs, or replace `template-generator` or `project-scanner`.

It may consume an approved custom template directory when the developer provides one. A custom template is still a template source and must provide the required template contract.

**Announce at start:**

> spark onboarding 🚀 Using project-onboarding to generate project from template

## Required References

Before generation, you MUST read every reference file in this skill:

- MUST read `references/template-resolution.md`.
- MUST read `references/generation-execution.md`.
- MUST read `references/mirroring-and-behavior.md`.

Do not skip required references because the template looks small, backend-only, frontend-only, familiar, or simple. If a reference section does not apply, record it as not applicable after reading it.

## Core Contract

Always:

- use approved `.template/`, template directory, custom template directory, approved baseline repository, or approved local template directory inputs
- preserve template engineering contracts
- apply placeholders consistently
- rename files/folders where required
- generate standard folders, standard files, reusable units, behavior contracts, page archetypes, and starter features when explicitly defined
- apply `copy_policy` before copying files
- run validation commands when defined or clearly supported
- run `project-scanner` after successful project creation
- generate `.docs/` only through `project-scanner`
- report generated, skipped, failed, and `Needs Review` items clearly

Never:

- overwrite existing projects without explicit confirmation
- delete existing files without explicit confirmation
- generate from incomplete templates
- mix templates unless explicitly instructed
- install unverified dependencies
- invent missing conventions
- bypass design-system or behavior requirements
- copy source business behavior into a different target domain without explicit template support

## Required Template Minimum

The template must include at minimum:

```txt
TEMPLATE_PROFILE.md
TEMPLATE_WORKFLOW.md
GENERATION_RULES.md
```

If these are missing, stop and ask the developer to run `template-generator` first or provide a complete approved custom template.

## High-Level Flow

```txt
Developer Request
↓
Onboarding Mode Detection
↓
Template Resolution
↓
Blueprint Loading
↓
Requirement Mapping
↓
Variable Resolution
↓
Design System / Behavior / Mirroring Resolution
↓
Generation Plan
↓
Safe Project Generation
↓
Validation
↓
project-scanner
↓
SPARK Readiness Report
```

The only durable output is the generated project and its `.docs/` folder after `project-scanner` succeeds. Do not create new permanent artifacts outside that scope.

## Onboarding Modes

- **New Project From Template** — use the approved template blueprint as source of truth.
- **Existing Project Onboarding** — do not overwrite by default; validate readiness and recommend `project-scanner` if `.docs` is missing/stale.
- **Workspace Onboarding** — identify each project boundary independently; do not merge sibling memory unless requested.
- **Business-Neutral Mirroring** — mirror reusable engineering structure while replacing source business process/domain.

## Final Response Shape

After onboarding, include:

- Project Created: name, path, template, mode
- Resolved Variables
- Missing / Needs Review
- Generated Files
- Standard Skeleton
- Reusable Architecture
- Behavior Contracts
- Page Archetypes
- Starter Features
- Business-Neutral Mirroring
- Design System
- Validation
- Project Memory
- SPARK Readiness Report
- Next Steps

## Checklist

- [ ] Announce skill usage.
- [ ] Read `references/template-resolution.md`.
- [ ] Read `references/generation-execution.md`.
- [ ] Read `references/mirroring-and-behavior.md`.
- [ ] Detect onboarding mode.
- [ ] Resolve approved template source.
- [ ] Load `GENERATION_RULES.md`, `TEMPLATE_PROFILE.md`, and `TEMPLATE_WORKFLOW.md`.
- [ ] Resolve variables, design system, behavior contracts, page archetypes, and mirroring requirements required by the template.
- [ ] Build an internal safe generation plan.
- [ ] Generate/copy/stub only what the template explicitly permits.
- [ ] Validate source business leakage when mirroring.
- [ ] Run validation commands when available.
- [ ] Run `project-scanner` after successful project creation.
- [ ] Produce SPARK readiness report.
