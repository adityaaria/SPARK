# Optional Integrations

SPARK core skills remain independent from external tools. An optional external knowledge adapter skill may exist for projects that explicitly enable or request it.

## Routing Rule

Before using a project-specific external adapter, confirm explicit activation through one of these signals:

- the user asks to use that integration
- the project contains a matching `.spark/integrations/<name>.json` marker with `"enabled": true`

If neither signal exists, do not inspect external-tool folders or reinterpret ordinary project folders as integration artifacts.

## Handoff Rule

An adapter produces neutral context for another SPARK skill. The receiving skill keeps its normal contract:

- stable memory is still written only through `project-scanner`
- rules are still approved through `knowledge-rules`
- templates are still produced through `template-generator`
- generated projects still flow through `project-onboarding`

Optional adapters must be read-only unless the user explicitly asks for a tool-specific action.
