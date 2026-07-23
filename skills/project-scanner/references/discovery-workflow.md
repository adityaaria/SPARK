# Discovery Workflow

## Project Root Detection

Treat a root as a project only when enough evidence indicates a complete software project:

- dependency/build manifest
- runtime configuration
- source directory
- application entrypoint
- testing configuration
- deployment configuration

Use multiple independent evidence anchors whenever possible.

## Exploration Order

Explore in this order:

1. root dependency and build manifests
2. top-level directory layout
3. primary entrypoints and runtime bootstrap
4. module/package barrels, indexes, or registration files
5. entity, schema, model, DTO, and migration definitions
6. API surfaces and route registrations
7. configuration, environment, and deployment files
8. tests that reveal intended behavior
9. targeted searches for repeated conventions and exceptions
10. targeted searches for reusable presentation, layout, component, module, and generated-file skeleton patterns
11. targeted searches for business-specific terms that would leak if mirrored into a different domain
12. targeted searches for repeated behavior patterns such as submit confirmation, loading state, empty state, error state, pagination, filter/table composition, modal/drawer flow, and page-state transitions

Prefer reading implementation paths before trusting summaries.

## Internal Repository Model

Build one internal model before writing memory. It may represent:

- workspace, project, package, module, folder
- feature, domain, workflow, business capability
- page, component, presentation unit, layout unit, page template
- store, service, API, DTO, entity, repository, migration
- configuration, environment, build, infrastructure, integration
- permission, validation, state, event, extension point
- convention, business-specific term, boundary anti-pattern
- behavior contract candidate, visual pattern candidate, copy-safe unit candidate

The model is temporary and must not be persisted as its own artifact.

## Relationship Model

Use semantic relationships when evidenced:

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
