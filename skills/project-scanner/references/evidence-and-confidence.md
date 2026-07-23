# Evidence And Confidence

## Thinking Rules

- evidence overrides assumption
- unknown is better than incorrect
- source code overrides README
- implementation overrides comments
- runtime configuration overrides prose documentation
- repository structure overrides folder-name guesswork
- multiple independent evidence anchors override a single isolated clue
- majority implementation may define a convention only when conflicting variants are explicitly documented
- isolated implementations do not redefine project-wide conventions

## Evidence Priority

Prefer evidence in this order:

1. executable source code and entrypoints
2. runtime configuration and dependency manifests
3. schema, migration, DTO, and interface definitions
4. tests that prove intended behavior
5. generated contracts such as OpenAPI
6. repository documentation
7. comments and TODO text

## Confidence Labels

Use these labels instead of High/Medium/Low:

- `Confirmed from Code` — directly proven by source, config, schema, tests, or executable files
- `Inferred from Code Structure` — strongly supported by converging implementation patterns
- `Documentation Conflict` — prose claims something implementation does not support
- `Unverified Pattern` — appears in limited places and should not be treated as project-wide
- `Insufficient Evidence` — files do not support a reliable conclusion
- `AI-Risk` — common agent assumption trap; final response only, not stable memory
- `Not Applicable` — capability does not exist based on broad evidence

## Absence Claims

Absent imports, routes, schemas, migrations, or manifests can support `Not Applicable` only when the search scope is broad enough. If absence is only partially proven, record the remaining gap.
