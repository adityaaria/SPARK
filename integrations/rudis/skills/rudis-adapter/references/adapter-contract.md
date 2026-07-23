# Rudis Adapter Contract

## Inputs

Default marker:

```json
{
  "enabled": true,
  "mode": "read-only",
  "constitution": ".rudis/memory/constitution.md",
  "specs": "specs",
  "adapter": ".agents/skills/rudis-adapter"
}
```

Read only files that exist. Missing files are gaps, not failures.

Primary inputs:

- `.rudis/memory/constitution.md` - project principles and governance constraints
- `specs/<feature>/spec.md` - feature requirements and business flow context
- `specs/<feature>/plan.md` - technical intent, architecture decisions, constraints
- `specs/<feature>/tasks.md` - implementation task context
- `specs/<feature>/research.md` - design decision support
- `specs/<feature>/data-model.md` - domain/entity model support
- `specs/<feature>/quickstart.md` - verification and usage scenarios

## Output Shape

Return a concise neutral block titled **External Knowledge Adapter Context**:

```markdown
## External Knowledge Adapter Context

Source: Rudis
Mode: read-only
Marker: .spark/integrations/rudis.json

### Project Principles
- [principle or constraint] (source: .rudis/memory/constitution.md)

### Feature Context
- [feature requirement or flow] (source: specs/<feature>/spec.md)

### Technical Intent
- [architecture or implementation constraint] (source: specs/<feature>/plan.md)

### Task Context
- [task guidance, if relevant] (source: specs/<feature>/tasks.md)

### Gaps
- [missing artifact, conflict, or unknown]
```

## Skill Handoff

- `project-scanner`: use the context as evidence. Source code and runtime config still override Rudis artifacts. Write only SPARK's exact `.docs/` contract.
- `knowledge-rules`: treat project principles as candidate rules. Present each candidate for developer approval before writing `docs/spark/rules/KNOWLEDGE_RULES.md`.
- `template-generator`: use feature context and technical intent as supporting evidence only after `.docs/` and approved rules are loaded.
- `project-onboarding`: use feature context as target-domain input only when the template already permits that mapping.

## Boundaries

- Do not load this adapter for users who did not enable or request it.
- Do not make any SPARK core skill mention Rudis-specific paths.
- Do not persist adapter output as a standalone permanent memory file.
- Do not treat task lists as stable architecture memory.
- Do not overwrite SPARK-generated memory with external documents.
