# Template Resolution

## Accepted Template Sources

Template source may be:

```txt
.template/
templates/<template-name>/
custom template directory
approved baseline repository
approved local template directory
```

The minimum required files are:

```txt
TEMPLATE_PROFILE.md
TEMPLATE_WORKFLOW.md
GENERATION_RULES.md
```

If missing, stop and ask for `template-generator` or a complete approved custom template.

## Input Priority

Resolve inputs in this order:

1. developer request
2. `.template/GENERATION_RULES.md`
3. `.template/TEMPLATE_PROFILE.md`
4. `.template/TEMPLATE_WORKFLOW.md`
5. other `.template` files
6. custom-template supporting files when provided
7. existing workspace files only if clarification is required
8. explicit user confirmation

Do not ask for information already available in the developer request or template files.

## Blueprint Loading

Load:

1. `GENERATION_RULES.md`
2. `TEMPLATE_PROFILE.md`
3. `TEMPLATE_WORKFLOW.md`
4. supporting template files for folder/file skeletons, structure, routing, API, database, deployment, reusable units, UI conventions
5. supporting custom-template files for behavior contracts, page archetypes, visual contracts, copy-safe units, organization/team policy

The blueprint is the engineering contract. Preserve it instead of replacing it with assumptions.

## Variable Mapping

Resolve placeholders before planning generation. Common variables:

```txt
<project_name>
<project-name>
<ProjectName>
<feature_area>
<route_base_path>
<remote_name>
<package_manager>
<runtime>
<backend_service_names>
<design_system_package>
<ui_library>
<styling_framework>
<theme_strategy>
<component_layering_enabled>
<target_domain>
<target_feature_area>
<target_business_flow>
<target_resource_name>
<target_entity_names>
<target_role_names>
<source_business_terms_to_replace>
<shared_reusable_unit_root>
<feature_reusable_unit_root>
<layout_unit_root>
<page_template_root>
```

Apply resolved values to folder names, package/module naming, config files, route prefixes, domain/resource/entity names, reusable unit names and paths, environment examples, and generated docs.
