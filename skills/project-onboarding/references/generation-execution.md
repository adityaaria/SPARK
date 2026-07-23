# Generation Execution

## Operational Sections

Treat `GENERATION_RULES.md` as executable. Apply these sections before prose fallbacks:

- `folders_to_create`
- `files_to_generate`
- `reusable_units_to_generate`
- `behavior_contracts`
- `page_archetypes`
- `starter_feature_contracts`
- `copy_policy`
- domain replacement rules
- source business leakage checks

Supported generation strategies:

- `empty` — create only when an empty file is meaningful
- `stub` — create minimal business-neutral implementation with template placeholders
- `copy_from_template_source` — copy only files classified as business-neutral reusable infrastructure by `copy_policy`
- `needs_review` — do not generate; report what is missing or unsafe

Behavior contracts do not permit invented implementation. They require onboarding to wire, copy, stub, or validate behavior that the template defines.

## Generation Plan

Before modifying files, internally plan:

- target path and onboarding mode
- template source and loaded blueprint files
- resolved/missing variables
- design-system decisions
- mirroring decisions
- files/folders to copy, create, rename, update
- standard folders/files
- reusable units
- behavior contracts
- page archetypes
- starter feature contracts
- copy/stub/omit decisions
- source business leakage checks
- commands and validation checks
- expected `project-scanner` step

Do not persist this plan as a new artifact.

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
Resolve Design System / Behavior / Mirroring
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
Apply Behavior Contracts
↓
Generate Page Archetypes
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

## Required Output In Project

Generated project should contain:

```txt
<new-project>/
├── source files
├── standard folders from the template
├── standard files from the template
├── reusable units if defined
├── behavior-backed starter pages if defined
├── config files
├── README.md
├── .env.example if applicable
└── .docs/
```

`.docs/` must come from `project-scanner` after generation.

## Validation

Run validation commands only if defined by the template or clearly supported:

- install
- lint
- typecheck
- test
- build
- format check

Document skipped validation and failed commands. Do not silently continue past failures.
