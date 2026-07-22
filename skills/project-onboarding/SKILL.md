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
Business-Neutral Mirroring Resolution
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
* do not stop at parent folders when the template defines deeper folder or file skeletons
* generate projects safely
* apply placeholders consistently
* rename files and folders where required
* generate standard folders, standard files, and reusable units when the template explicitly defines them
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

### 4. Business-Neutral Mirroring

Use this mode when the developer wants a new project that mirrors an existing project's reusable engineering structure while replacing the source business process or domain.

In this mode:

* preserve the approved template's architecture, folder skeleton, file skeleton, reusable presentation architecture, validation placement, testing strategy, and extension rules
* replace target domain, resource, route, workflow, role, permission, label, and entity variables according to `GENERATION_RULES.md`
* do not preserve source business workflows, entities, endpoints, copy, seed data, or hardcoded business constants unless explicitly requested and supported by the template
* validate source business leakage before reporting readiness

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
4. relevant supporting `.template` files required for folder skeletons, file skeletons, structure, routing, API, database, deployment, reusable units, and UI conventions

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
* target domain, resource, workflow, role, permission, or entity names if required by a mirroring template

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
<target_domain>
<target_feature_area>
<target_business_flow>
<target_resource_name>
<target_entity_names>
<target_role_names>
<source_business_terms_to_replace>
<shared_reusable_unit_root>
<feature_reusable_unit_root>
<layout_unit_root>
<page_template_root>
```

Apply resolved values consistently to:

* project folder name
* package or module naming
* configuration files
* metadata files
* route prefixes
* domain/resource/entity names
* reusable unit names and paths
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

## Business-Neutral Mirroring Resolution

If the template defines domain replacement rules, source business terms, reusable skeletons, or source business leakage checks, resolve them before creating the generation plan.

Validate:

* source business concepts that must be replaced
* target business process or domain variables
* route/resource/entity/role/permission replacement values
* reusable engineering structure to mirror
* reusable presentation, layout, page template, and shared utility structure to generate
* business-specific files that must not be copied
* source business leakage checks to run after generation

Rules:

* mirror engineering structure, not source business meaning
* preserve placement and boundaries, not old domain behavior
* preserve validation and API patterns, not old request/response resources
* preserve reusable presentation architecture, not source feature copy or labels
* if a required target business variable is missing, ask only for that variable

## Operational Generation Rules

Treat `GENERATION_RULES.md` as the executable contract for project generation. When present, load and apply these sections before falling back to prose in other `.template` files:

* `folders_to_create`
* `files_to_generate`
* `reusable_units_to_generate`
* `starter_feature_contracts`
* `copy_policy`
* domain replacement rules
* source business leakage checks

Supported generation strategies:

* `empty` — create the file only when an empty file is meaningful for the project/toolchain
* `stub` — create a minimal business-neutral implementation with placeholders defined by the template
* `copy_from_template_source` — copy only files classified as business-neutral reusable infrastructure by `copy_policy`
* `needs_review` — do not generate; report exactly what is missing or unsafe

If a modern template does not contain these operational sections but `FOLDER_STRUCTURE.md` and `FILE_STRUCTURE.md` define clear required skeletons, build a conservative generation plan from those files and mark the generated skeleton source as `Needs Review: inferred from descriptive template files`. Do not infer implementation bodies from prose.

If neither operational sections nor clear descriptive skeletons exist, stop before generation and ask the developer to rerun `template-generator` with a more complete template.

## Generation Plan

Before creating or modifying files, internally produce a safe generation plan covering:

* target path
* onboarding mode
* template source
* loaded blueprint files
* resolved variables
* missing variables
* design-system decisions
* mirroring decisions
* files and folders to copy
* standard folders to create
* standard files to generate
* reusable units to generate
* example files allowed by the template
* starter feature contracts to generate
* copy/stub/omit decisions from `copy_policy`
* files and folders to rename
* files to update
* source business leakage checks
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
Resolve Business-Neutral Mirroring
↓
Validate Target Directory
↓
Create Safe Generation Plan
↓
Copy Template Skeleton
↓
Generate Standard Folder Skeleton
↓
Generate Standard File Skeleton
↓
Generate Reusable Units
↓
Generate Starter Feature Contracts
↓
Apply Placeholders
↓
Rename Files/Folders
↓
Update Metadata
↓
Validate Source Business Leakage
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
* skip standard folder, file, or reusable-unit generation when `GENERATION_RULES.md` explicitly defines it
* copy source business behavior into a different target domain without explicit template support

Always:

* follow `GENERATION_RULES.md`
* preserve template engineering contracts
* preserve architecture conventions
* preserve design-system abstraction
* preserve reusable presentation and component boundaries
* generate every folder, file, and reusable unit explicitly required by `GENERATION_RULES.md`
* apply `copy_policy` before copying any file from an approved baseline repository or local template source
* report any standard skeleton or reusable unit skipped as `Needs Review` or `Blocked`
* report changed files
* report skipped steps
* report failed commands
* run `project-scanner` after successful project creation

## Required Output

Generated project should contain:

```txt
<new-project>/
├── source files
├── standard folders from the template
├── standard files from the template
├── reusable units if defined by the template
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

Standard Skeleton
- folders generated
- files generated
- generation strategies used
- skipped skeleton items and reasons

Reusable Architecture
- presentation units generated or skipped
- layout units generated or skipped
- page templates generated or skipped
- shared utilities generated or skipped
- feature-owned reusable units generated or skipped
- copy/stub/blueprint-only decisions

Starter Features
- feature contracts generated or skipped
- CRUD/workflow files generated
- route/state/service/API/DTO/test skeleton status

Business-Neutral Mirroring
- source business terms replaced
- target domain/resource/workflow values
- source business leakage checks

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
* [ ] Load operational generation sections when present.
* [ ] Read `TEMPLATE_PROFILE.md`.
* [ ] Read `TEMPLATE_WORKFLOW.md`.
* [ ] Load required supporting blueprint files.
* [ ] Map developer requirements to the template.
* [ ] Resolve required variables.
* [ ] Resolve design-system requirements before planning generation.
* [ ] Resolve business-neutral mirroring requirements when present.
* [ ] Validate target directory.
* [ ] Build an internal safe generation plan.
* [ ] Create new project safely.
* [ ] Generate standard folder skeletons required by the template.
* [ ] Generate standard file skeletons required by the template.
* [ ] Generate reusable units required by the template.
* [ ] Apply copy/stub/omit decisions before copying template-source files.
* [ ] Generate starter feature contracts required by the template.
* [ ] Apply placeholder replacement.
* [ ] Rename files and folders.
* [ ] Update project metadata.
* [ ] Validate source business leakage when mirroring.
* [ ] Run validation commands when available.
* [ ] Run `project-scanner` to generate `.docs/`.
* [ ] Produce the SPARK readiness report.
* [ ] Report final result clearly.
