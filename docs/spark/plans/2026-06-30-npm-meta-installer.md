# NPM Meta-Installer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user run `npx spark install` once, have the CLI detect or ask for the active harness, and install the correct SPARK adapter for that harness.

**Architecture:** The npm package becomes a thin orchestrator. Shared behavior stays in the existing skills and harness references, while a new CLI layer handles detection, selection, adapter dispatch, and verification. Each harness gets an adapter with the same install contract so the implementation stays isolated and testable.

**Tech Stack:** Node.js built-ins only (`fs`, `path`, `os`, `readline/promises`, `child_process`, `url`), existing repo manifests and skill references, `node --test` for installer tests, npm packaging metadata in `package.json`.

## Global Constraints

- `npx spark install` is the primary entrypoint.
- The CLI may auto-detect the harness, but it must prompt when detection is ambiguous.
- Supported harnesses in this release: Claude Code, Cursor, Antigravity, GitHub Copilot CLI, OpenCode, Gemini CLI, and Pi.
- The installer must not rewrite skill bodies to fit one harness.
- The installer must not silently edit arbitrary user-global config outside the harness's own install mechanism.
- The installer must remain zero-dependency unless a dependency is required for the CLI itself and materially reduces risk.

---

### Task 1: Package entrypoint and CLI scaffold

**Files:**
- Modify: `package.json`
- Create: `bin/spark.js`
- Create: `src/cli/index.js`
- Create: `src/cli/parse-args.js`
- Create: `src/cli/output.js`
- Create: `src/installer/errors.js`
- Test: `tests/npm-installer/cli.test.mjs`

**Interfaces:**
- Consumes: `process.argv`, `process.env`, and the repo root artifacts already committed in this repository.
- Produces: a runnable `spark` bin that supports `install`, `--dry-run`, `--yes`, `--verbose`, and `--harness <name>`.

- [ ] **Step 1: Write the failing CLI tests**

Add tests that assert:

- `node bin/spark.js --help` prints the install command and supported flags.
- `node bin/spark.js install --dry-run --harness codex` reaches the CLI path without touching the filesystem.
- `package.json` declares a `bin` entry for `spark`.
- `package.json` keeps the package publishable by including only the installer-relevant assets.

Run:

```bash
node --test tests/npm-installer/cli.test.mjs
```

Expected: fail until the CLI scaffold and package metadata exist.

- [ ] **Step 2: Implement the minimal CLI scaffold**

Create the executable wrapper and CLI modules so the command can parse arguments and print structured status lines.

Expected shape:

```js
// bin/spark.js
#!/usr/bin/env node
import { run } from '../src/cli/index.js';
run(process.argv.slice(2), process.env).catch((err) => {
  process.stderr.write(`${err.message}\n`);
  process.exitCode = 1;
});
```

Keep the first implementation narrow: parse args, print help, and route `install` into a placeholder command path.

- [ ] **Step 3: Run the CLI tests and verify the package shape**

Run:

```bash
node --test tests/npm-installer/cli.test.mjs
npm pack --dry-run
```

Expected: the CLI tests pass, and `npm pack --dry-run` shows only the intended publish artifacts.

- [ ] **Step 4: Commit the scaffold**

Commit the CLI bootstrap and package metadata once the tests pass.

---

### Task 2: Harness detection and selection flow

**Files:**
- Create: `src/installer/detect.js`
- Create: `src/installer/registry.js`
- Create: `src/cli/prompt.js`
- Create: `src/cli/install.js`
- Test: `tests/npm-installer/detect.test.mjs`

**Interfaces:**
- Consumes: environment variables, `PATH`, and the adapter registry.
- Produces: a ranked harness candidate list, a single selected adapter, or a prompt-driven user choice.

- [ ] **Step 1: Write the failing detection tests**

Add tests that cover:

- exact `--harness` override wins over detection
- a high-confidence environment match returns one adapter
- multiple weak candidates trigger a prompt
- no candidates returns a short error that names the supported harnesses

Run:

```bash
node --test tests/npm-installer/detect.test.mjs
```

Expected: fail until detection and prompting exist.

- [ ] **Step 2: Implement ranked detection**

Implement a detector that scores evidence instead of returning a boolean.

Recommended signal order:

1. harness-specific environment variables
2. harness-specific config files in the current environment
3. harness binaries on `PATH`
4. known plugin or extension roots

The registry should expose a stable adapter name for each harness so the CLI can print a direct choice list:

```text
Codex / Cursor / Antigravity / Copilot / OpenCode / Gemini / Pi
```

- [ ] **Step 3: Implement interactive fallback**

If detection does not produce one clear answer, prompt the user to choose a harness.

The prompt should be text-only and deterministic:

- show the ranked candidates
- allow explicit selection by number or name
- allow aborting cleanly

- [ ] **Step 4: Run detection tests and one dry-run prompt path**

Run:

```bash
node --test tests/npm-installer/detect.test.mjs
node bin/spark.js install --dry-run
```

Expected: the detector tests pass, and dry-run output shows either the selected harness or the prompt path.

- [ ] **Step 5: Commit detection and selection**

Commit the ranked detection logic and the prompt fallback together so the install command can make a real decision.

---

### Task 3: Shell-hook adapters for Claude Code, Codex, Cursor, and Copilot

**Files:**
- Create: `src/installer/adapters/shell-hook.js`
- Create: `src/installer/adapters/claude-code.js`
- Create: `src/installer/adapters/codex.js`
- Create: `src/installer/adapters/cursor.js`
- Create: `src/installer/adapters/copilot.js`
- Create: `tests/npm-installer/shell-hook-adapters.test.mjs`

**Interfaces:**
- Consumes: the committed plugin manifests and hook scripts already in the repo.
- Produces: harness-specific install actions that register the plugin and bootstrap with the correct session-start hook.

- [ ] **Step 1: Write the failing adapter tests**

Add tests that assert each shell-hook adapter exposes:

- a stable `id`
- a readable `label`
- a deterministic install plan
- a verification command or verification target

Run:

```bash
node --test tests/npm-installer/shell-hook-adapters.test.mjs
```

Expected: fail until the adapter layer exists.

- [ ] **Step 2: Implement the shared shell-hook adapter helper**

Factor the common behavior for shell-hook harnesses into one helper that knows how to:

- point at the correct committed plugin manifest
- point at the matching hook config
- explain the bootstrap path
- report the post-install verification step

The helper should not hardcode harness-specific copy outside the adapter inputs.

- [ ] **Step 3: Implement Claude Code, Codex, Cursor, and Copilot adapters**

Wire each adapter to the correct committed artifacts:

- Claude Code: `.claude-plugin/`
- Codex: `.codex-plugin/`
- Cursor: `.cursor-plugin/`
- Copilot CLI: `skills/using-spark/references/copilot-tools.md` plus the harness-native install surface documented in the repo

Each adapter should emit a concrete install action and a concrete verification action instead of a vague recommendation.

- [ ] **Step 4: Run adapter tests and a dry-run install**

Run:

```bash
node --test tests/npm-installer/shell-hook-adapters.test.mjs
node bin/spark.js install --dry-run --harness codex
```

Expected: the shared helper covers the shell-hook family, and the dry-run output names the selected adapter and target manifest.

- [ ] **Step 5: Commit the shell-hook family**

Commit the shared helper and the four adapters together so the family stays consistent.

---

### Task 4: Extension and context-file adapters for OpenCode, Pi, Gemini, and Antigravity

**Files:**
- Create: `src/installer/adapters/opencode.js`
- Create: `src/installer/adapters/pi.js`
- Create: `src/installer/adapters/gemini.js`
- Create: `src/installer/adapters/antigravity.js`
- Create: `src/installer/adapters/extension-style.js`
- Create: `tests/npm-installer/extension-adapters.test.mjs`

**Interfaces:**
- Consumes: the committed OpenCode plugin, Pi extension, Gemini extension metadata, and the Antigravity tool-mapping reference.
- Produces: install actions that respect each harness's native install surface and bootstrap mechanism.

- [ ] **Step 1: Write the failing extension-style adapter tests**

Add tests that assert:

- OpenCode uses the committed plugin package shape and `config`/message transform path.
- Pi uses the committed extension plus its session-start/session-compact bootstrap path.
- Gemini uses `gemini-extension.json` and `GEMINI.md` as the extension-declared context file.
- Antigravity uses the repo install flow and the `antigravity-tools.md` mapping reference.

Run:

```bash
node --test tests/npm-installer/extension-adapters.test.mjs
```

Expected: fail until the extension-style adapters exist.

- [ ] **Step 2: Implement the shared extension-style helper**

Factor the adapter code that installs a harness through its extension/plugin surface so each adapter can focus on:

- where the harness loads bootstrap text from
- how the harness discovers skills
- what verification step proves the install worked

The helper should keep the committed repo files as the source of truth.

- [ ] **Step 3: Implement OpenCode, Pi, Gemini, and Antigravity adapters**

Wire each adapter to its committed artifacts:

- OpenCode: `.opencode/` and `.opencode/plugins/spark.js`
- Pi: `.pi/extensions/spark.ts`
- Gemini: `gemini-extension.json` and `GEMINI.md`
- Antigravity: the existing repo plugin install flow plus `skills/using-spark/references/antigravity-tools.md`

Each adapter should return a clear verification string or command, such as a log check, a session-start proof, or an install-target confirmation.

- [ ] **Step 4: Run adapter tests and one real package verification**

Run:

```bash
node --test tests/npm-installer/extension-adapters.test.mjs
npm pack --dry-run
```

Expected: the extension-style adapters pass, and the npm package still includes every required artifact.

- [ ] **Step 5: Commit the extension-style family**

Commit the helper and the four adapters together so the extension and context-file shapes stay aligned.

---

### Task 5: Documentation, smoke tests, and install guidance

**Files:**
- Modify: `README.md`
- Modify: `docs/README.opencode.md`
- Modify: `docs/README.kimi.md`
- Modify: `docs/porting-to-a-new-harness.md`
- Modify: `.version-bump.json` only if the new package layout requires it
- Create: `tests/npm-installer/install-smoke.test.mjs`

**Interfaces:**
- Consumes: the final CLI behavior and adapter registry.
- Produces: user-facing install instructions, a smoke test that exercises the CLI flow, and a documented support story for npm installation.

- [ ] **Step 1: Write the failing smoke test**

Add a smoke test that runs the CLI in dry-run mode and asserts it prints:

- the selected harness or prompt
- the adapter label
- the verification step

Run:

```bash
node --test tests/npm-installer/install-smoke.test.mjs
```

Expected: fail until the CLI flow is wired end to end.

- [ ] **Step 2: Update the README install path**

Add a short top-level section that tells users:

```bash
npx spark install
```

and explains that the CLI will either auto-detect or ask for the harness.

Keep the existing harness-specific docs, but make them secondary to the npm entrypoint.

- [ ] **Step 3: Update harness docs to point at the npm front door**

Add short references in the harness docs that point back to the npm installer, while keeping their native install instructions available for users who prefer them.

That keeps the existing per-harness documentation useful without making the user hunt for the first step.

- [ ] **Step 4: Run the full installer test slice**

Run:

```bash
node --test tests/npm-installer/*.test.mjs
npm pack --dry-run
```

Expected: all installer tests pass, and the package contents are still correct.

- [ ] **Step 5: Commit the docs and smoke test**

Commit the docs update only after the CLI and adapter tests are green, so the documentation reflects the actual installer behavior.

---

## Execution Order

1. Package entrypoint and CLI scaffold.
2. Harness detection and selection flow.
3. Shell-hook adapters.
4. Extension and context-file adapters.
5. Docs and smoke tests.

## Review Notes

- The highest risk is adapter behavior drift between harnesses. Keep the shared helper code small and let the harness-specific adapters own only the install surface that is truly different.
- The most likely failure mode is overconfident detection. Favor prompting over guessing.
- If any harness cannot be installed non-interactively through its own official surface, call that out explicitly in the adapter verification step instead of hiding it.
