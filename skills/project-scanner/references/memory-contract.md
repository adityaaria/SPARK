# Project Scanner Memory Contract

## Stable Memory Only

Persist durable project knowledge only. Stable memory includes architecture, structure, APIs, database/persistence, features, domains, business flows, tests, reusable presentation architecture, standard skeletons, and stable boundary anti-patterns.

Temporary analysis such as risk snapshots, severity labels, impact analysis, recommendations, tech-debt inventories, and task plans must stay out of `.docs`.

## Required Files

Each project root gets exactly:

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

Use explicit `Not Applicable` sections when a capability does not exist, especially for `API_CONTRACT.md` and `DATABASE_CATALOG.md`.

## Required Document Metadata

Every memory file must include:

- `Last Scanned`
- `Confidence`
- `Evidence`
- `Gaps / Unknowns`

Evidence must use real file paths. If documentation conflicts with implementation, prefer implementation and mark the claim as `Documentation Conflict`.

## Multi-Project Workspaces

If multiple independent projects exist:

- identify each valid project root independently
- verify each root using its own evidence
- generate one `.docs` directory inside each valid root
- never merge frontend/backend or sibling project memory unless explicitly requested

Cross-project relationships require explicit file evidence or explicit developer instruction.
