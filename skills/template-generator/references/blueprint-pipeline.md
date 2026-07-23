# Blueprint Pipeline

## Pipeline

```txt
Stable Memory -> Discovery -> Rule Overlay -> Validation -> Generalization
-> Architecture Abstraction -> Decision -> Variability -> Blueprint
-> Projection -> Template Files
```

The blueprint is internal and temporary.

## Discovery

From Stable Memory only, discover:

- architecture layers
- folder/file conventions
- routing, API, persistence, testing patterns
- validation placement
- configuration and integration boundaries
- design-system and component hierarchy
- extension points
- standard skeletons
- anti-patterns
- evolution rules

## Rule Overlay

When Knowledge Rules exist, approved `Must` and `Should` entries become prescriptive constraints. Keep rule intent separate from implementation detail: a rule may require confirmation or loading state; the template decides which reusable unit or page archetype implements it.

## Validation

A pattern is reusable only when stable memory supports it and it is not merely business-specific, optional, replaceable, or one-off implementation leakage. Insufficient evidence becomes `Needs Review`.

## Generalization

Strip business specifics, keep structure:

- `<SourceDomain>Profile.<view_ext>` -> `<FeatureName>Profile.<view_ext>`
- `GET /<source-resource>` -> `GET /<resource>`
- `<SourceDomain>Module.<module_ext>` -> `<FeatureName>Module.<module_ext>`

Generalize names, not architecture. Never preserve source feature names, endpoints, org rules, labels, roles, or workflows as universal patterns.

## Technology Classification

Classify evidenced technologies as:

- Architecture
- Convention
- Implementation
- Replaceable Dependency
- Framework Dependency
- Optional Dependency
- Project-specific Dependency
- Business-specific Dependency

Implementation can be required by a specific template, but never becomes a SPARK-wide rule.

## Blueprint Validation

Before writing `.template`, verify:

- business terminology is placeholderized or marked `Needs Review`
- project-specific endpoints/features do not leak
- design system remains business-neutral
- component ownership is preserved
- folder/file skeletons are detailed when evidenced
- reusable presentation generation rules exist when memory supports them
- behavior contracts exist when Knowledge Rules define reusable behavior
- page archetypes exist when memory/rules prove repeatable page composition
- copy/stub/omit decisions have evidence
- `GENERATION_RULES.md` has operational sections when onboarding needs them
