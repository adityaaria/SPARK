---
name: project-onboarding
description: Use when generating a new project from an approved template blueprint or local template directory.
---

# Project Onboarding

## Overview

Use this skill to generate or prepare a project from an approved reusable template blueprint.

This skill remains responsible for safe project onboarding from `.template/` inputs. It does **not** invent project structure, create templates, normalize templates, or replace `template-generator` or `project-scanner`.

Treat this skill as a **Project Onboarding Orchestrator** that turns a developer request into a validated project handoff.

**Announce at start:**

> spark onboarding 🚀 Using project-onboarding to generate project from template

## Responsibility

This skill is a **Project Onboarding / Project Generator**.

It converts:

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
Design System Resolution
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

It must not:

* create templates
* rewrite template conventions
* scan source repositories as a substitute for template inputs
* act as a second `template-generator`
* act as a second `project-scanner`

## Core Contract

Always preserve these behaviors:

* use approved `.template/` inputs
* do not invent project structure
* generate projects safely
* apply placeholders consistently
* rename files and folders where required
* run validation commands when defined or clearly supported
* run `project-scanner` after successful project creation
* generate `.docs/` only through `project-scanner`
* report final result clearly

The only durable output is the generated project and its `.docs/` folder after `project-scanner` succeeds. Do not create new permanent artifacts outside that scope.

## Onboarding Modes

Detect onboarding mode before taking action.

### 1. New Project From Template

Use the approved `.template/` blueprint as the source of truth for project creation.

### 2. Existing Project Onboarding

If the target project already exists:

* do not overwrite without explicit confirmation
* do not regenerate from template by default
* validate readiness
* recommend running `project-scanner` if `.docs/` is missing or stale

### 3. Workspace Onboarding

If a multi-project workspace is detected:

* identify each project boundary separately
* validate each boundary independently
* do not merge frontend/backend or sibling projects unless explicitly requested

## Input Priority

Resolve inputs in this order:

1. developer request
2. `.template/GENERATION_RULES.md`
3. `.template/TEMPLATE_PROFILE.md`
4. `.template/TEMPLATE_WORKFLOW.md`
5. other `.template` files
6. existing workspace files only if clarification is required
7. explicit user confirmation

Do not ask for information already available in the developer request or the template files.

## Accepted Template Sources

Template source may be:

```txt
.template/
templates/<template-name>/
approved baseline repository
approved local template directory
```

The template must include at minimum:

```txt
TEMPLATE_PROFILE.md
TEMPLATE_WORKFLOW.md
GENERATION_RULES.md
```

If these are missing, stop and ask the developer to run `template-generator` first.

## Blueprint Loading

After template resolution, load the blueprint in this order:

1. `GENERATION_RULES.md`
2. `TEMPLATE_PROFILE.md`
3. `TEMPLATE_WORKFLOW.md`
4. relevant supporting `.template` files required for structure, routing, API, database, deployment, and UI conventions

The blueprint is the engineering contract for generation. Preserve its conventions instead of replacing them with assumptions.

## Requirement Mapping

Map the developer request onto the template contract before generation.

Resolve:

* project name
* target directory
* project type
* package manager
* runtime requirements
* environment name if applicable
* feature or route naming inputs if required by the template
* service/module naming inputs if required by the template

If a required input is missing, ask only for the missing critical variable.

## Variable Mapping

Resolve placeholders from `GENERATION_RULES.md` before planning file generation.

Common variables include:

```txt
<project_name>
<project-name>
<ProjectName>
<feature_area>
<route_base_path>
<remote_name>
<package_manager>
<runtime>
<backend_service_names>
<design_system_package>
<ui_library>
<styling_framework>
<theme_strategy>
<component_layering_enabled>
```

Apply resolved values consistently to:

* project folder name
* package or module naming
* configuration files
* metadata files
* route prefixes
* environment examples
* generated documentation references

If a required variable cannot be resolved from the template or request, stop and ask only for that variable.

## Design System Resolution

Resolve design-system requirements before creating the generation plan.

Validate:

* design system package
* UI library
* styling framework
* theme strategy
* component layering
* reusable UI structure
* layout strategy
* token or theming strategy if available

Rules:

* do not force Vue, React, Tailwind, shadcn, Material UI, Vuetify, or any framework/library unless the template explicitly requires it
* preserve design-system abstraction documented by the template
* if design-system evidence is incomplete, mark the item as `Needs Review`

## Generation Plan

Before creating or modifying files, internally produce a safe generation plan covering:

* target path
* onboarding mode
* template source
* loaded blueprint files
* resolved variables
* missing variables
* design-system decisions
* files and folders to copy
* files and folders to rename
* files to update
* commands to run
* validation checks
* expected `project-scanner` step

Do not persist this plan as a new project artifact.

## Safe Generation Flow

```txt
Resolve Onboarding Mode
↓
Resolve Approved Template
↓
Load Blueprint Files
↓
Map Requirements
↓
Resolve Variables
↓
Resolve Design System
↓
Validate Target Directory
↓
Create Safe Generation Plan
↓
Copy Template Skeleton
↓
Apply Placeholders
↓
Rename Files/Folders
↓
Update Metadata
↓
Run Validation Commands
↓
Run project-scanner
↓
Report Readiness
```

If any destructive action is required, ask for explicit confirmation before proceeding.

## Safety Rules

Never:

* overwrite an existing project without explicit confirmation
* delete existing files without explicit confirmation
* generate a project without an approved template
* generate from an incomplete template
* mix multiple templates unless explicitly instructed
* install unverified dependencies
* ignore failed commands
* invent missing template conventions
* bypass design-system requirements

Always:

* follow `GENERATION_RULES.md`
* preserve template engineering contracts
* preserve architecture conventions
* preserve design-system abstraction
* report changed files
* report skipped steps
* report failed commands
* run `project-scanner` after successful project creation

## Required Output

Generated project should contain:

```txt
<new-project>/
├── source files
├── config files
├── README.md
├── .env.example if applicable
└── .docs/
```

The `.docs/` folder must be generated by running `project-scanner` after project creation succeeds.

## Validation

Run validation commands only if they are defined by the template or clearly supported by the generated project.

Examples:

```txt
install
lint
typecheck
test
build
format check
```

If validation cannot run, document why. Do not silently continue past failed commands.

## SPARK Readiness Validation

After generation and scanning, validate readiness for:

* `project-scanner`
* `template-generator`
* `bug-fix`
* `enhancement`
* `audit`
* `new-page`
* `selenium-e2e`

Each status must be one of:

* `Ready`
* `Needs Review`
* `Blocked`

Include the reason for every non-`Ready` status.

## Final Response Format

After onboarding, respond with:

```txt
Project Created
- Name
- Path
- Template used
- Mode

Resolved Variables
- list resolved variables

Missing / Needs Review
- unresolved or uncertain items

Generated Files
- summary

Design System
- selected strategy
- unresolved design-system items

Validation
- commands run
- passed/failed/skipped

Project Memory
- .docs generated or not
- reason if not generated

SPARK Readiness Report
- project-scanner: Ready | Needs Review | Blocked
- template-generator: Ready | Needs Review | Blocked
- bug-fix: Ready | Needs Review | Blocked
- enhancement: Ready | Needs Review | Blocked
- audit: Ready | Needs Review | Blocked
- new-page: Ready | Needs Review | Blocked
- selenium-e2e: Ready | Needs Review | Blocked

Next Steps
- developer actions
```

## Execution Checklist

* [ ] Announce skill usage exactly as required.
* [ ] Detect onboarding mode.
* [ ] Resolve approved template source.
* [ ] Read `GENERATION_RULES.md`.
* [ ] Read `TEMPLATE_PROFILE.md`.
* [ ] Read `TEMPLATE_WORKFLOW.md`.
* [ ] Load required supporting blueprint files.
* [ ] Map developer requirements to the template.
* [ ] Resolve required variables.
* [ ] Resolve design-system requirements before planning generation.
* [ ] Validate target directory.
* [ ] Build an internal safe generation plan.
* [ ] Create new project safely.
* [ ] Apply placeholder replacement.
* [ ] Rename files and folders.
* [ ] Update project metadata.
* [ ] Run validation commands when available.
* [ ] Run `project-scanner` to generate `.docs/`.
* [ ] Produce the SPARK readiness report.
* [ ] Report final result clearly.
