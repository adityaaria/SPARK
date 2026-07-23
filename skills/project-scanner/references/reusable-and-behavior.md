# Reusable And Behavior Discovery

## Knowledge Expansion

For every feature, domain, workflow, API, database entity, module, package, or architecture node, expand only evidenced dimensions:

- purpose, business objective, primary actor
- pages or entry surfaces
- components, stores, services, APIs, DTOs
- validation, configuration, dependencies
- related features/domains and workflow position
- permissions, extension points, testing coverage
- standard folders and files
- reusable presentation/layout units
- reusable behavior patterns
- visual composition patterns
- copy-safe reusable unit candidates
- page archetypes and required sections
- component state contracts such as loading, empty, error, disabled, confirmation, pagination, validation
- ownership boundaries and business-specific names to replace during mirroring

Omit unsupported dimensions or record them under `Gaps / Unknowns`.

## Standard Skeleton Discovery

When repeated structure is evidenced, record:

- required folders and evidence
- optional folders and creation condition
- required files per project/module/feature/route/API/model/test/presentation unit
- file naming and extension patterns
- scaffold-like files safe for downstream examples
- files/folders that must not be mirrored blindly

Classify generation safety:

- `Copy-safe` — business-neutral, dependency-compatible, evidenced reusable infrastructure
- `Stub-safe` — reusable shape, but implementation body contains target-specific behavior
- `Blueprint-only` — document as rule/pattern; implementation depends on target requirements
- `Business-specific` — replace, rename, or omit during business-neutral mirroring
- `Needs Review` — not enough evidence

## Behavior Pattern Discovery

Record stable repeated behavior as descriptive memory, not as rules.

Examples:

- submit/destructive actions require confirmation
- action controls expose loading or disabled state
- data-display units expose loading, empty, error, pagination
- CRUD/list pages separate filter/search from result display
- create/edit flows share a mode-aware page or form
- dialogs/drawers/overlays use a shared shell and lifecycle
- views call state/application layers instead of transport clients
- validation runs before persistence or transport submission

For every behavior pattern, record:

- where it is implemented
- which reusable unit owns it
- which feature code supplies inputs
- which state names are business-neutral
- which labels, payloads, fields, or workflows are business-specific
- whether it is `Reusable Engineering Pattern`, `Reusable Presentation Pattern`, `Boundary Anti-Pattern`, or `Business-Specific Workflow`
- whether it should be proposed to `knowledge-rules`

## Copy-Safe Reusable Unit Criteria

Mark a unit `Copy-safe` only when evidence shows:

- it is business-neutral or safely parameterizable
- direct dependencies are available, documented, or also classified for copy/stub
- it does not import feature-owned services, stores, DTOs, domain constants, or transport clients
- styling/visual behavior belongs to the design-system contract, not a one-off feature
- target location and extension rule are clear

If any condition fails, use `Stub-safe`, `Blueprint-only`, `Business-specific`, or `Needs Review`.

## Mirroring Classifications

Classify facts for downstream `template-generator` and `project-onboarding`:

- `Reusable Engineering Pattern`
- `Standard Skeleton`
- `Reusable Presentation Pattern`
- `Reusable Behavior Pattern`
- `Copy-Safe Unit Candidate`
- `Boundary Anti-Pattern`
- `Implementation Evidence`
- `Framework Dependency`
- `Replaceable Dependency`
- `Business-Specific Concept`
- `Business-Specific Workflow`
- `Business-Specific Terminology`
