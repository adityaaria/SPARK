# Template Generator Input And Output

## Inputs

Read `.docs/` first. Expected memory set:

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

If multiple `.docs` directories exist, identify the intended project root and use only that memory set. Do not merge memories unless explicitly requested.

Then read `docs/spark/rules/KNOWLEDGE_RULES.md` if it exists. Rules are approved constraints, not descriptive memory. Use them to strengthen behavior contracts, anti-patterns, validation checks, and generated starter examples.

Do not invent rules when `KNOWLEDGE_RULES.md` is absent.

## Outputs

Generate exactly:

```txt
.template/
├── TEMPLATE_PROFILE.md
├── TEMPLATE_WORKFLOW.md
├── FOLDER_STRUCTURE.md
├── FILE_STRUCTURE.md
├── CODE_STRUCTURE.md
├── ROUTING_STRUCTURE.md
├── API_STRUCTURE.md
├── DATABASE_STRUCTURE.md
├── TESTING_STRUCTURE.md
└── GENERATION_RULES.md
```

File ownership:

- `TEMPLATE_PROFILE.md` — purpose, supported project type, stack/dependencies, architecture summary, intended/unsupported uses
- `TEMPLATE_WORKFLOW.md` — generation flow, mirroring flow, folder/file creation, reusable unit creation, feature/route/API/testing extension flows
- `FOLDER_STRUCTURE.md` — root/source/feature/shared/config/test/generated/reusable/layout/page-template folders
- `FILE_STRUCTURE.md` — required/optional/example files, naming rules, placeholder extensions, copy-vs-stub notes
- `CODE_STRUCTURE.md` — layering, reusable presentation contract, business logic placement, validation/type/error/utility patterns, anti-patterns
- `ROUTING_STRUCTURE.md` — route file location, naming, lazy loading, guards, menu/navigation relationship
- `API_STRUCTURE.md` — client/endpoint/DTO/error/auth/environment/integration boundaries
- `DATABASE_STRUCTURE.md` — persistence structure, or `Not Applicable`
- `TESTING_STRUCTURE.md` — framework, test folder layout, behavior tests, generated-skeleton tests, commands
- `GENERATION_RULES.md` — executable instructions for `project-onboarding`
