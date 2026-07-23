# Reusable UI And Behavior

## Design System Extraction

Extract architecture, not arbitrary styling:

- Design System Strategy
- Component Hierarchy
- Component Ownership
- Design Tokens
- Spacing Strategy
- Typography Strategy
- Theme Strategy
- Layout Strategy
- Responsive Strategy
- Accessibility Strategy
- Interaction Pattern
- Visual Composition Pattern

Stay technology-agnostic unless the approved template source is technology-specific.

## Reusable Component Extraction

Capture:

- primitive presentation units
- composed presentation units
- feature components
- page templates
- application views
- shared reusable unit root
- feature-owned reusable unit root
- layout unit root
- page template root
- naming patterns
- dependency rules
- behavior contracts owned by each unit
- required states exposed by each unit
- copy-safe dependency closure
- minimum example files that may be generated
- anti-patterns generated examples must avoid

Use generic terms such as presentation unit, layout unit, application view, form pattern, data display pattern, feedback pattern, and navigation pattern.

## Behavior Contract Extraction

Extract behavior contracts from Stable Memory and Knowledge Rules without turning them into business logic.

Examples:

- action controls require confirmation and loading state
- data-display units require loading, empty, error, and pagination states
- list pages require distinct filter/search and result sections
- reusable units must not import feature-owned business types
- views must not bypass state/application layers

Project confirmed behavior into:

- `CODE_STRUCTURE.md` for ownership and dependency rules
- `TEMPLATE_WORKFLOW.md` for generated behavior flow
- `TESTING_STRUCTURE.md` for required behavior tests
- `GENERATION_RULES.md` for executable `behavior_contracts` and validation checks

If a behavior is only a developer preference and not in Knowledge Rules, mark it `Needs Review`.

## Anti-Patterns

Reusable anti-patterns may include:

- View -> API
- Store -> UI
- Business Logic -> Component
- Feature Utility -> Shared Utility
- Presentation Unit -> Transport Client
- Reusable Unit -> Business Workflow
- Shared Component -> Feature-Specific Domain Type
- Layout Unit -> Business Rule
- Duplicated Interaction Pattern -> No Shared Abstraction
- Circular Dependency
- Large Components
- Large Services
- Shared Mutable State
- Hardcoded Configuration

Keep anti-patterns reusable engineering guidance, not project gossip.
