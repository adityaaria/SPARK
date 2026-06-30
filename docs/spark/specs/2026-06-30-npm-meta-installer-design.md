# NPM Meta-Installer Design

**Goal:** Add a single npm-driven installer entrypoint so a user can run `npx spark install`, have the tool detect or ask for the active harness, and then install the correct SPARK adapter for that harness.

## Problem

Today, installation is split across harness-specific docs and install paths. That is workable for maintainers, but it is not a good first-run experience for a user who just wants to install SPARK once and let the tool adapt to the harness they are using.

The desired behavior is:

1. User runs one CLI command.
2. The CLI figures out which harness is in use, or asks if detection is ambiguous.
3. The CLI installs the correct adapter for that harness.
4. The installed harness then loads SPARK with the correct bootstrap and tool mapping.

This must stay aligned with the repo's existing rule that harness-specific behavior belongs in harness-specific adapters, not in rewritten skill bodies.

## Scope

In scope:

- A new npm CLI entrypoint.
- Interactive harness selection when detection is uncertain.
- Auto-detection when the current environment is clear enough to trust.
- Harness-specific adapters for:
  - Claude Code
  - Cursor
  - Antigravity
  - GitHub Copilot CLI
  - OpenCode
  - Gemini CLI
  - Pi
- Install-time verification and clear failure modes.

Out of scope:

- Rewriting skill content to fit one runtime.
- Replacing the repo's existing native install docs.
- Adding new third-party dependencies unless they are required for the CLI itself and materially reduce risk.
- Silent edits to user-global config outside the harness's own install mechanism.

## Proposed Architecture

The npm package becomes an orchestrator, not the source of truth. The shared source of truth remains:

- `skills/` for behavior
- `skills/using-spark/references/*-tools.md` for per-harness tool mapping
- existing harness manifests and bootstrap code for each adapter

The new CLI layer is responsible for:

1. Detecting likely harness environment from installed binaries and local config hints.
2. Choosing an adapter or prompting the user.
3. Running the adapter's install action.
4. Verifying the install outcome.

Each adapter is a small object with the same contract:

- `id`
- `label`
- `detect()`
- `install()`
- `verify()`
- `explain()`

That keeps harness-specific logic isolated and makes it possible to add a new harness without changing the CLI flow.

## CLI UX

Primary command:

```bash
npx spark install
```

Expected flow:

1. CLI prints that it is checking the environment.
2. CLI detects one of the supported harnesses, if possible.
3. If detection is confident, it installs without extra questions.
4. If more than one harness is plausible, it prompts the user to choose one.
5. CLI runs the selected adapter.
6. CLI prints what was installed and how to verify it.

Useful flags:

- `--harness <name>` forces a specific adapter.
- `--dry-run` prints the selected adapter and the actions it would take without changing anything.
- `--yes` skips confirmation prompts after detection.
- `--verbose` prints detection signals and install steps.

## Detection Strategy

Detection should prefer strong signals and avoid guessing when the evidence is weak.

Strong signals:

- harness-specific environment variables
- harness-specific config files in the current session environment
- installed harness binaries on `PATH`
- known plugin/extension roots for the current harness

Weak signals:

- repository names
- generic environment hints
- anything that could match multiple harnesses

Detection output should be a ranked list, not a single boolean. The CLI then uses:

- a single high-confidence match, or
- a prompt when multiple candidates score similarly, or
- an explicit `--harness` override.

If no harness is detectable, the CLI must not invent one. It should prompt for selection or fail with a short, actionable explanation.

## Adapter Responsibilities

Each adapter owns the harness-specific install path and verification logic.

Minimum adapter responsibilities:

- locate the correct harness install mechanism
- install or register the committed SPARK package/artifacts through that mechanism
- ensure the harness can discover `skills/`
- ensure the harness loads `using-spark` at session start, or via the harness's equivalent bootstrap path
- use the correct tool mapping reference for that harness

Adapters may differ in how they install:

- Some can invoke an official CLI or marketplace install command.
- Some may need to write harness-owned config.
- Some may need to update an extension declaration and restart the harness.

The CLI is allowed to orchestrate those actions, but it must not silently edit arbitrary user config files that are not part of the harness's own install surface.

## Data Flow

The install flow is:

1. CLI reads repo metadata and adapter definitions.
2. CLI detects the harness or asks the user to choose.
3. CLI resolves the adapter's source files:
   - shared `skills/`
   - harness-specific manifests
   - harness-specific tool mapping reference
4. CLI runs the adapter install action.
5. CLI runs adapter verification.
6. CLI prints the installed harness name, the installed source path or target, and the recommended next command to confirm the bootstrap loaded.

This keeps the installer deterministic and makes the installed state explainable.

## Error Handling

The CLI should fail loudly and specifically for these cases:

- Unsupported harness name.
- Multiple plausible harnesses with no user selection.
- Required harness binary missing from `PATH`.
- Marketplace or install command not available.
- Permission denied while writing the harness-owned install target.
- Network failure during an install step that depends on the network.
- Partial install that cannot be verified.

Error messages should include:

- the harness that failed
- the action that failed
- the likely cause
- the next thing the user should do

If an install step partially succeeds, the adapter should either clean up its own changes or leave a clearly described state that can be retried idempotently.

## Testing

Testing should focus on deterministic adapter selection and command generation first.

Unit tests:

- harness detection priority and tie-breaking
- `--harness` override behavior
- adapter registry completeness
- per-adapter install command generation
- dry-run output

Integration tests:

- at least one harness install path executed end-to-end in a test fixture
- one ambiguous-detection case that forces a prompt
- one failure case for a missing harness binary

The tests should verify that the installer reuses the committed repo artifacts rather than inventing a new skill format.

## Risks

- Some harnesses expose a marketplace flow rather than a fully scriptable CLI flow. The adapter model needs to allow a best-effort command plus a clear fallback when a harness cannot be fully automated.
- Auto-detection can be wrong if it relies on weak signals. The design therefore treats detection as advisory, not authoritative.
- A universal installer can become a pile of one-off exceptions if adapter boundaries are not kept strict. The adapter contract is there to prevent that drift.

## Definition of Done

This design is complete when:

- `npx spark install` exists as the primary entrypoint.
- The CLI can select all supported harnesses either automatically or by prompt.
- Each supported harness has a dedicated adapter.
- The installer does not rewrite skill bodies.
- The install flow is verifiable and idempotent enough to retry safely.
- The user can install SPARK through one CLI without reading separate harness docs first.
