# Generation Contracts

`GENERATION_RULES.md` must be specific enough for `project-onboarding` to execute without guessing.

## Required Sections When Evidenced

### `folders_to_create`

For each folder:

- `path`
- `required`
- `condition`
- `purpose`
- `owner_layer`
- `source_memory`
- `needs_review`

### `files_to_generate`

For each file:

- `path`
- `required`
- `condition`
- `generation_strategy`: `empty`, `stub`, `copy_from_template_source`, or `needs_review`
- `responsibility`
- `allowed_content`: `business-neutral only`, `placeholderized domain example`, or `copied approved reusable infrastructure`
- `dependencies`
- `placeholders`
- `source_memory`
- `needs_review`

### `reusable_units_to_generate`

For each reusable presentation, layout, interaction, utility, or infrastructure unit:

- `unit_name`
- `layer`
- `target_path`
- `generation_strategy`
- `copy_safety`: `Copy-safe`, `Stub-safe`, `Blueprint-only`, `Business-specific`, or `Needs Review`
- `responsibility`
- `must_not_depend_on`
- `placeholders`
- `source_memory`
- `needs_review`

### `behavior_contracts`

For each reusable behavior:

- `contract_name`
- `source`: `knowledge-rule`, `stable-memory`, or `developer-request`
- `severity`: `Must` or `Should`
- `applies_to`
- `required_states`
- `owning_unit`
- `consumer_responsibility`
- `generation_effect`
- `anti_patterns`
- `source_evidence`
- `needs_review`

### `page_archetypes`

For each repeatable page/workflow composition:

- `archetype_name`
- `feature_kind`
- `required_sections`
- `required_reusable_units`
- `required_behavior_contracts`
- `state_contract`
- `routing_contract`
- `data_contract`
- `test_contract`
- `copy_or_stub_strategy`
- `business_variables_to_replace`
- `source_evidence`
- `needs_review`

### `starter_feature_contracts`

For each repeatable starter feature:

- `feature_kind`
- `required_folders`
- `required_files`
- `optional_files`
- `route_contract`
- `state_contract`
- `service_contract`
- `api_or_interface_contract`
- `dto_or_schema_contract`
- `validation_contract`
- `test_contract`
- `reusable_units_used`
- `behavior_contracts_used`
- `page_archetype`
- `business_variables_to_replace`

### `copy_policy`

Classify source files/folders as:

- `copy`: business-neutral reusable infrastructure
- `stub`: reusable shape with target-specific implementation
- `parameterize`: safe only after placeholder replacement
- `omit`: source business behavior or unsafe implementation leakage
- `needs_review`: not enough evidence

`copy_policy` is mandatory when using an approved baseline repository or local template directory.
