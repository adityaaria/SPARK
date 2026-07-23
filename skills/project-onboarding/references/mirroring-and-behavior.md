# Mirroring And Behavior

## Business-Neutral Mirroring

Use this when the developer wants a new project that mirrors reusable engineering structure while replacing business domain/process.

Preserve:

- architecture
- folder/file skeletons
- reusable presentation architecture
- validation placement
- testing strategy
- extension rules
- behavior contracts approved by the template
- page archetypes approved by the template

Replace or parameterize:

- source business workflows
- entities/resources/routes
- roles, permissions, labels, seed data
- hardcoded business constants
- copy and business terminology

Validate source business leakage before readiness.

## Behavior Contracts

For every `behavior_contract`, resolve:

- target page archetype, reusable unit, layer, or action type
- owning generated/copied unit
- required states such as loading, empty, error, disabled, confirmation, pagination, validation
- generated files that expose/consume those states
- tests or validation checks required by template
- violations that block generation or become `Needs Review`

Do not satisfy behavior contracts with one-off page code when the template defines a reusable owning unit.

## Page Archetypes

For every `page_archetype`, resolve:

- required sections
- required reusable units
- required behavior contracts
- copy/stub decisions per section
- placeholder replacement
- target business variables
- source business leakage checks

## Design System Resolution

Validate:

- design-system package
- UI library
- styling framework
- theme strategy
- component layering
- reusable UI structure
- layout strategy
- token/theming strategy if available

Do not force Vue, React, Tailwind, shadcn, Material UI, Vuetify, or any framework/library unless the template explicitly requires it.

## SPARK Readiness Validation

After generation and scanning, report readiness for:

- `project-scanner`
- `template-generator`
- `bug-fix`
- `enhancement`
- `audit`
- `new-page`
- `selenium-e2e`

Each status is `Ready`, `Needs Review`, or `Blocked`, with a reason for non-ready items.
