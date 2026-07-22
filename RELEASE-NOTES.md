# SPARK Release Notes

## v6.3.1 (2026-07-23)

### New: Business-Neutral Mirroring across project-scanner, template-generator, and project-onboarding

A new end-to-end path for developers who want a new project to reuse an existing project's reusable engineering structure — folder/file skeletons, reusable presentation architecture, routing/API/validation/testing patterns — while replacing its business domain, entities, and workflows.

- **`project-scanner` gains Standard Skeleton Discovery, Reusable Presentation Architecture, and Business-Neutral Mirroring Inputs sections.** It now records required/optional folders and files per module/feature/route/presentation unit, classifies each as `Copy-safe`, `Stub-safe`, `Blueprint-only`, or `Business-specific`, and tags discovered facts (`Reusable Engineering Pattern`, `Standard Skeleton`, `Business-Specific Concept`, etc.) so downstream skills know what may be mirrored versus what must be replaced. Stable anti-pattern boundaries (invalid dependency direction, misplaced business logic, unsafe shared-state ownership) are now allowed in `.docs/` when evidenced, fitting inside the existing 10-file contract — no new memory file was added.
- **`template-generator` gains a "Business-Neutral Mirroring Blueprint" and "Standard Skeleton Projection" section**, plus a required, machine-readable shape for `GENERATION_RULES.md`: `folders_to_create`, `files_to_generate` (with `generation_strategy`: `empty`/`stub`/`copy_from_template_source`/`needs_review`), `reusable_units_to_generate` (with `copy_safety`), `starter_feature_contracts` for repeatable CRUD/workflow patterns, and `copy_policy` for classifying template-source files as `copy`/`stub`/`parameterize`/`omit`/`needs_review`. This makes generation rules operational instead of descriptive prose that `project-onboarding` had to interpret.
- **`project-onboarding` gains a "Business-Neutral Mirroring" resolution step**, run after Design System Resolution and before the Generation Plan: preserves the approved template's architecture, skeleton, and conventions while replacing domain/resource/route/workflow/role/permission/label/entity variables per `GENERATION_RULES.md`. It now also generates standard folders, standard files, reusable units, and starter feature contracts explicitly defined by the template (rather than stopping at parent folders), and validates source business leakage before reporting readiness.

## v6.3.0 (2026-07-21)

### Not Visible to End Users: template-generator Consolidation

`skills/template-generator/SKILL.md` cut from 2301 to 1716 words (25%) by merging 8 overlapping pipeline sections (Pattern Discovery through Template Projection, plus duplicate Responsibility/Blueprint-First Pipeline diagrams) into one `Pattern-to-Blueprint Pipeline` section, and trimming `Execution Checklist` from 15 restated items to 10 high-level final-gate checks. All technical substance (discovery signals, generalization examples, decision contracts, variability classes) preserved — only repeated framing removed. Frontmatter description rewritten to a pure trigger condition. No change to the 10-file `.docs/` input contract or the 10-file `.template/` output contract — file names, count, and order identical before/after.

### New: Knowledge Rules

A new prescriptive layer for explicit coding-standard rules, sitting alongside (not inside) `.docs/`.

- **New skill `knowledge-rules`** builds and maintains `docs/spark/rules/KNOWLEDGE_RULES.md` — a `RULE-xxx` formatted file of `Must`/`Should` rules, either auto-detected from consistent, evidenced patterns in the repo (confirmed with you before anything is written) or added manually in plain language ("no `watch`", "no `any` type", "no hardcoded values"). Refreshing this file can only add/update auto-detected entries — it will never delete or overwrite a manual one.
- **Hybrid enforcement**: when a rule has a native equivalent in the project's existing linter (ESLint, Ruff, RuboCop, etc.), the skill offers to wire it in as `Enforced-Via: linter:<tool>:<rule-id>` so CI catches it too — always with an explicit per-change confirmation before touching any linter config file. Rules without a mechanical equivalent stay `agent-review` and are just as fully enforced.
- **`audit`, `bug-fix`, and `enhancement`** now read `KNOWLEDGE_RULES.md` in their Context Grounding phase, alongside `.docs/` — `Must` rules are hard constraints, `Should` rules are strong preferences, both flagged with the rule's own Rationale and Fix Guidance text.
- **Dashboard `/api/tree` no longer guesses anti-patterns from folder names.** The old hardcoded `controller`/`utils`/`helper`/`api` name-matching (a source of false positives — a well-designed `AuthController/` was flagged purely for its name) is gone. It now matches against your actual Knowledge Rules' `Detection` patterns, on both file names and small file contents, and reports the rule's real Rationale/Fix Guidance as the reason. If you haven't set up any Knowledge Rules yet, the dashboard shows no anti-patterns at all — a `rulesConfigured: false` flag — rather than a guess that might be wrong.
- **New dashboard tab, "Rules"**, backed by new `GET/POST/DELETE /api/rules` endpoints: view all rules with severity/source/enforcement badges, add a manual rule through a form, and delete manual rules (deleting an auto-detected rule is blocked — re-run `knowledge-rules` to refresh those instead).

### New: Plans & Progress Dashboard

A new dashboard tab surfaces `writing-plans` plans and `subagent-driven-development` progress without needing a terminal.

- **New endpoints `GET /api/plans` and `GET /api/plans/:filename`** list every plan in `docs/spark/plans/` (title, date, feature name, task count) and return one plan's parsed `Task N:` list. An empty or missing `docs/spark/plans/` returns `{ plans: [] }`, not an error — most projects haven't run `writing-plans` yet.
- **New endpoint `GET /api/progress`** reads `.spark/sdd/progress.md` and parses its `Task N: complete (...)` lines; any line that doesn't match that shape is still returned verbatim (`{ raw }`) so nothing is silently dropped, and the full raw ledger is always included as a fallback.
- **New dashboard tab, "Plans & Progress"**: pick a plan on the left, see its tasks with ✅/⬜ status on the right, plus the raw active-session ledger alongside it.
- **`subagent-driven-development`'s ledger now records which plan it tracks.** A new ledger writes `Plan: <path>` as its first line. The dashboard uses this to correlate a ledger to the exact plan it belongs to — confident status when it matches the open plan, "no active session for this plan" when it names a *different* plan (so a stale ledger from another feature can't paint the wrong plan's tasks as done), and the original number-only guess (with a disclaimer) when an older ledger has no `Plan:` line at all.

### Fixed: Architecture Graph Rendering

The "🕸 Architecture Graph" dashboard tab now renders with real Mermaid.js instead of a hand-rolled regex parser.

- **Subgraphs render as clusters again.** The old parser discarded every `subgraph`/`end` line outright, flattening any intentional grouping `project-scanner` put in `ARCHITECTURE_GRAPH.md` (e.g. infrastructure or workspace boundaries) into one flat graph. Mermaid.js handles subgraphs, and any other Mermaid diagram type, natively.
- **Trade-off:** rendering is now a static SVG laid out by Mermaid, not a physics-based graph you can drag nodes around in. Pan/zoom is preserved via `svg-pan-zoom`.
- Multiple `mermaid` blocks across `.docs/*.md` each render into their own labeled card; a per-diagram parse failure shows an error for just that diagram, not the whole tab; results are cached for the session so switching tabs doesn't re-render.
- `vis-network` is no longer loaded — it was only ever used by this one function.

### New: Automatic Project Memory Refresh

Two new layers keep `.docs/` from going stale, plus an optional CI template for a scheduled safety net in your own project's repo.

- **`project-scanner` gains Delta Scan Mode** — a lighter refresh, used by automated callers (not by a developer directly asking for a scan), that re-verifies only the `.docs/*.md` claims whose Evidence touches files changed since the last scan, leaving the rest of each file untouched. A touched file's `Last Scanned` bumps to today even if only one claim in it changed; an untouched file's date is left alone, so staleness views stay honest about what was actually re-verified.
- **`audit`, `bug-fix`, and `enhancement` gain a staleness gate.** During Context Grounding, if `.docs/PROJECT_SCAN.md`'s `Last Scanned` is more than 20 commits or 30 days old, the skill runs a Delta Scan before continuing, announced in one line, without waiting for confirmation (it's a memory read+update, not a code change). Projects with fresh memory see no behavior change. *(The 20-commit / 30-day threshold is intentionally identical to the new Memory Health dashboard's staleness badge below — change one, change both.)*
- **New doc, [docs/auto-refresh-project-memory.md](docs/auto-refresh-project-memory.md)**, includes a copy-paste GitHub Actions template for projects that want a scheduled Delta Scan even when nobody's actively using SPARK — opens a PR for review, never commits directly, and is not itself part of SPARK (install it in your own project's repo, not this one).

### New: Memory Health Dashboard

A new tab aggregates what's otherwise only visible by reading through `.docs/*.md` by hand.

- **New endpoint `GET /api/memory-health`** reads every `.docs/*.md` file and extracts, tolerantly (project-scanner's contract fixes field *names*, not exact formatting): the `Last Scanned` date, a count of each of the 7 Confidence labels found, and the bullets under a `Gaps / Unknowns` heading. Per-file score is `Confirmed from Code` count ÷ total confidence labels found; a file with no recognizable confidence labels gets `insufficientData: true` instead of a misleading score. `commitsSinceLastScan` comes from `git rev-list`, gracefully `null` outside a git repo. No `.docs/` → `{ files: [], overallScore: null, totalGaps: 0 }`, not an error.
- **New dashboard tab, "Memory Health"**: overall score badge (green/yellow/red), a per-file table with a Last Scanned/commits-since/confidence-distribution/score row each — flagged with a re-scan badge past the same 20-commit / 30-day threshold as the staleness gate above — and an aggregated, read-only list of every `Gaps / Unknowns` bullet across all files, grouped by source file.
- **Known limitation, by design:** this is a text heuristic over a field contract that only fixes names, not exact formatting — scores are estimates, not precise measurements, and can be misleading in edge cases (e.g. a legitimately `Not Applicable` file scores the same as a low-confidence one, since the formula only rewards `Confirmed from Code`).

### Changed: API Exporter Output Format

The "API Exporter" tab's Postman collection export now matches a real-world collection shape (auth + saved examples) instead of a generic guess.

- **Positive/Negative examples now live as saved responses on one request**, not as three separate sub-requests (200/400/401) in a folder. Each exported endpoint is a single item with `response: [Positive, Negative]` attached — matching how Postman's own "Save as Example" feature structures a collection.
- **New "Request Config" panel** lets you set an Auth type (None / Basic / Bearer) and free-form custom headers (one per line, `Header-Name: value`) before exporting — applied to every request in the collection. Nothing is hardcoded to a specific API's auth scheme or header set.
- **Negative example body changed** to `{ "code": 401, "message": "..." }`, replacing the previous `{ success: false, error: {...} }` shape.
- **Item names are now descriptive** (e.g. "Get Gold Deposit List" for `GET /gold-deposit/list`), derived from the method and path, instead of the literal `METHOD /path` string.
- A `variable` array is now included at the collection level (`baseUrl`, plus `token` when Bearer auth is selected).
- **Follow-up: mock data and auth now come from `.docs/API_CONTRACT.md` itself, not path-keyword guessing.** Endpoints are parsed as structured groups (Purpose, Authentication/Authorization, Request/Response DTO, Error Responses — same tolerant text-heuristic approach as Memory Health, since project-scanner fixes field names, not exact formatting). Mock values are generated per DTO field from its own name/type (`namaNasabah` → a name, `nilaiTitipan` → a currency string, `tanggalPengajuan` → a date) — field names are never renamed or translated. An endpoint with an undocumented DTO gets an honest `{ "note": "... tidak terdokumentasi ..." }` instead of a misleadingly specific fake value.
- **Auth and custom headers are now derived per-endpoint from documented Authentication/Authorization text** (Basic/Bearer detected from wording, custom headers like `x-branch-id` become Postman variables like `{{branchId}}` — never hardcoded values). The Request Config panel from the previous change becomes the fallback for endpoints with no documented auth, rather than a blanket override.
- **Multiple documented error codes now produce multiple response entries** (e.g. "Negative - Unauthorized (401)" and "Negative - Not Found (404)" as separate saved examples), instead of collapsing to one generic "Negative". An endpoint with zero documented errors exports with only a "Positive" example — no invented error response.
- A disclaimer now sits above the endpoint list in the API Exporter tab, explaining that mock quality depends on how complete `.docs/API_CONTRACT.md` is.

### Changed: Dashboard Reskin — Kanban Wall, Whiteboard, Security Gate

Pure visual/label reskin of three existing tabs into a "workspace" metaphor. No new data sources, no endpoint changes, no character/isometric illustration — flat cards and outline-style badges, consistent with the dashboard's existing dark/bordered look.

- **"Plans & Progress" is now "Kanban wall"**, and its task list is now a 3-column board (Belum dikerjakan / Sedang berjalan / Selesai) instead of a flat list. The middle column is always empty with an honest note — the ledger format has no explicit "in progress" state, so nothing is invented for it. Same plan↔ledger correlation logic as before (exact match, known-other-plan, or number-only fallback with disclaimer) — only the layout changed.
- **"Architecture Graph" is now "Whiteboard"**, same Mermaid rendering as before. When Memory Health data exists for `ARCHITECTURE_GRAPH.md`, a small badge shows its dominant Confidence label ("Confirmed" in green, "Perlu ditinjau" in amber for Unverified Pattern/Insufficient Evidence). No badge at all — not a guessed one — when Memory Health has no data for that file, or its dominant label doesn't map to a clear good/bad signal.
- **New "Security gate" badge**, always visible in the header regardless of tab: counts tasks in the actively-tracked plan not yet marked complete in `.spark/sdd/progress.md` (`N pending`, amber; "Semua bersih", green, at zero). No active session shows a distinct neutral "Tidak ada sesi aktif" — deliberately not the same as `0 pending`, since those are different facts.

No changes to the `.docs/` 10-file contract, `project-scanner`'s default full-scan behavior or legacy-trap handling (still conversational, never persisted), the `docs/spark/plans/` naming convention, the core `Task N: complete (...)` ledger line format, or any existing dashboard endpoint's response shape (including `/api/docs`, refactored internally to share its file-reading with `/api/memory-health` but otherwise unchanged).

## v6.2.0 (2026-07-21)

Internal audit pass across skill descriptions, the `using-spark` bootstrap, and workflow routing. No file, folder, or `.docs/`/`docs/spark/plans/` contract changes — existing project memory and plans keep working as-is.

### Visible Changes

- **New required verification gate before completing work.** `executing-plans`, `subagent-driven-development`, `enhancement`, and `finishing-a-development-branch` now explicitly invoke `spark:verification-before-completion` before presenting merge/PR options or claiming a feature done. Previously this gate was only wired into `systematic-debugging`'s bug-fixing path — the other workflows relied on a thinner inline "verify tests pass" reminder. If you're used to those workflows completing the moment tests are green, expect one extra explicit verification step before the completion menu appears. Micro-tested under time pressure with no observed regression in either the old or new wording.

### Not Visible to End Users

- **Trimmed skill descriptions** (`brainstorming`, `finishing-a-development-branch`, `using-git-worktrees`, `audit`, `bug-fix`, `enhancement`, `verification-before-completion`) to trigger-only conditions, per the project's own Skill Discovery Optimization guidance — no workflow summaries left in any `description` field. Affects skill discovery only, not stored output.
- **`using-spark/SKILL.md` cut from 943 to ~600 words** (frequently-loaded bootstrap) while keeping the flowchart, red flags, and routing rules intact. Micro-tested against the original wording under a casual "just a quick look" pressure scenario — both versions triggered skill invocation identically across all reps.
- **Added routing disambiguation** for `using-spark`'s "Skill Priority" section: `bug-fix` vs `systematic-debugging`, `enhancement` vs `brainstorming`, and `audit` vs `requesting-code-review`, all keyed on whether `.docs/` project memory exists.
- **Cross-referenced the two `docs` folders.** `project-scanner` and `writing-plans` now each note the difference between `.docs/` (stable project memory) and `docs/spark/plans/` (per-feature plans) — no renames, no path changes.

## v6.0.3 (2026-06-18)

### Subagent-Driven Development

- **SDD scratch files moved out of `.git/`.** Claude Code treats `.git/` as a protected path and denies agent writes there, so an implementer subagent writing its report into `.git/sdd/` got blocked mid-run. Task briefs, implementer reports, review diffs, and the progress ledger now live in a self-ignoring `.spark/sdd/` directory in the working tree — kept out of `git status` and out of commits, and resolved per worktree by a shared `sdd-workspace` helper. One caveat: because the workspace is git-ignored working-tree scratch, `git clean -fdx` will delete the progress ledger; recover from `git log` if that happens. (#1780)

## v6.0.2 (2026-06-16)

### Install Fixes

- **We no longer ship the `evals` submodule.** It broke plugin installs for some users, so the eval harness now lives in its own repo, separate from the published plugin. (#1778, #1774)

## v6.0.1 (2026-06-16)

### Codex Fixes

- **Version display in the brainstorm companion** — packaged Codex plugins ship without a root `package.json`, so the visual companion reported its version as "unknown". `readSPARKVersion()` now falls back to `.codex-plugin/plugin.json` when `package.json` is absent.
- **Cleaner Codex plugin sync** — the sync-to-codex script now excludes `.gitmodules` and `.pre-commit-config.yaml`, keeping repo metadata out of the packaged Codex plugin.

## v6.0.0 (2026-06-16)

SPARK 6.0 is a big release. The headline is a rewrite of how `subagent-driven-development` reviews each task — cheaper, stricter, and harder to game. 

While these numbers won't hold on every harness and for every workload, in our evals, Claude Code and Codex produce similar high-quality results roughly twice as fast and while spending almost 50% fewer tokens.

It also adds three new harnesses (Kimi Code, Pi, and Antigravity), gives the brainstorming visual companion a better security model, and rewrites a number of skills' tool calls to be significantly more vendor-neutral.

### Visible Changes

- **The two per-task reviewer prompts became one.** `spec-reviewer-prompt.md` and `code-quality-reviewer-prompt.md` are gone, replaced by a single `task-reviewer-prompt.md`. If you dispatch the old files directly, switch to the new one.
- **The legacy global worktree directory is gone.** `using-git-worktrees` and `finishing-a-development-branch` no longer use `~/.config/spark/worktrees/`. Worktrees now land in the project — an existing `.worktrees/` or `worktrees/` if you have one, otherwise a fresh `.worktrees/` — unless you say otherwise.

### New Harness Support

SPARK now runs on three more harnesses. Each ships its own bootstrap, a tool-mapping reference, and tests, and each gets its own install section in the README.

- **Kimi Code** — a plugin manifest, install docs, and manifest tests; install from Kimi's marketplace or straight from the repo. (initial manifest by @qer)
- **Pi** — a session-start extension that registers the skills and injects the `using-spark` bootstrap. Pi has native skills, so it needs no compatibility shim.
- **Antigravity (`agy`)** — installs the plugin directly and bootstraps from the first message; verified end-to-end against the standard "make a react todo list" acceptance test.

### Subagent-Driven Development

A long run of cost-and-quality experiments on real projects reshaped how the controller reviews each task. The old flow ran two reviewers per task and leaned on the controller's judgment for model choice and severity, and both turned out to be expensive and easy to game. The new flow runs one reviewer per task, hands work off as files instead of pasted text, and takes several judgment calls away from the controller.

- **One reviewer per task, two verdicts.** A single `task-reviewer-prompt.md` reads the task's diff once and returns both a spec-compliance verdict and a quality verdict, so one fix pass clears both. A new "can't verify from the diff" verdict flags requirements that live in untouched code, for the controller to check itself. (#1538, #1543)
- **One broad review at the end.** The run finishes with a single whole-branch review on the most capable model, instead of re-reviewing everything task by task.
- **Plans get a pre-flight read.** Before the first task, the controller checks the plan for internal conflicts — and for anything the plan asks for that a reviewer would flag as a defect — and raises it all at once, rather than stumbling into it mid-run.
- **Diffs and task text move as files.** A pasted diff parks itself permanently in the most expensive context, and a reviewer without one rebuilds it by hand — the single biggest reviewer cost. Two new scripts, `task-brief` and `review-package`, write the task text and the review diff to files for the subagent to read.
- **Every dispatch states its model.** Left to choose, controllers stopped naming a model at all — and an unnamed model quietly inherits the session's most expensive one, so one run put all 26 of its reviewers on the top tier. The templates now require a model, with guidance that reaches for cheaper tiers when the work allows.
- **The controller can't tell a reviewer what to ignore.** Real runs caught controllers coaching reviewers to skip a finding or call it "Minor at most," and the flaw shipped. Suppressing findings and pre-rating severity are now banned outright, and a defect the plan itself mandates gets reported for you to decide on rather than waved through.
- **Reviewers are read-only and skeptical of rationales.** Review no longer touches the working tree or branch — a reviewer running `git checkout` had been orphaning later commits — and an implementer's "I left this unabstracted on purpose" no longer talks a reviewer out of a real finding.
- **Stronger evidence and reporting.** Reviewers back each answer with a file and line, the implementer's report moves to a file and carries red/green evidence when TDD applies, and a progress ledger lets a controller that loses its context resume instead of redoing finished work. (#994)

### Writing Plans

Plans now carry the structure the controller and reviewers used to re-derive on every dispatch.

- **A Global Constraints block** lists the rules that bind every task — version floors, dependency limits, naming and copy, exact values — copied in verbatim, so they actually reach the implementers and reviewers downstream.
- **A per-task Interfaces block** names exactly what each task consumes and produces, so an implementer who sees only its own task still knows its neighbors' contracts.
- **Right-sizing guidance** keeps a task at the size that earns its own test cycle and a reviewer's pass, folding setup, config, and docs into the task that needs them. In testing, a plan written this way needed one round of fixes where the control needed two to four — and the control shipped a real bug.

### Brainstorming Visual Companion

The visual companion is a small web server the agent opens alongside the conversation. It had no authentication at all, so on a shared or remote machine anyone who could reach the port could read your brainstorm — or inject events the agent treats as your input. This release gives it a real security model and makes it survive restarts and dropped connections.

- **A per-session key now guards everything.** The agent's URL carries a one-time key, the browser tucks it into a tab-scoped cookie, and every request and WebSocket connection has to present it. This closes the door to stray local tabs and routable remote hosts alike, including the DNS-rebinding case an origin allowlist can't catch. (Closes #1014)
- **The file server stays in its sandbox.** It refuses symlinks, dotfiles, and any path that climbs out of the content directory, ignores macOS resource-fork files, and sends the usual no-store and deny-framing headers. Files that hold the session key are written owner-only.
- **The companion is offered only when it helps.** The skill raises it the first time a question would read better shown than told, as its own message, and lets a decline stand. Accepting opens your browser to the first screen. (Closes #755)
- **It survives restarts and flaky connections.** Given a project directory, the server keeps the same port and key across restarts, so an open tab simply reconnects. The page reconnects on its own, shows a live status pill, and raises a "paused" overlay while the server is down.
- **Longer idle life, safer shutdown.** The idle timeout went from 30 minutes to 4 hours, and `stop-server.sh` now confirms it owns the right process before signaling, so it never kills an unrelated `node` after a reboot. (#1703)
- **Windows launch hardening** — consolidated shell detection, and Windows now relies on the idle timeout for shutdown, since Node can't track POSIX process ownership across MSYS2.


### Existing Harness Updates

- **Codex** now bootstraps through its own SessionStart hook rather than shared wiring, and the Codex App gained an install section and fuller tool docs (web search, `AGENTS.md`, personal skills). (#1540)
- **OpenCode** got an action-based tool mapping across its plugin, install doc, and README, plus a bootstrap-caching test.
- **Cursor**'s manifest dropped its `agents` and `commands` entries, since those directories no longer exist.

### One Set of Skills, Every Harness

The skills used to speak Claude Code's dialect — "use the Task tool," "put it in CLAUDE.md." This release rewrites that vocabulary in terms of what you're actually doing ("dispatch a subagent," "your instructions file") and adds a per-harness reference that maps each action to the right tool, checked against each runtime. Prose that named "Claude" now says "your agent."

- **A tool reference per harness** at `skills/using-spark/references/`, covering Claude Code, Codex, Copilot, Gemini, Pi, and Antigravity.
- **`finishing-a-development-branch` went forge-neutral** — it no longer hardcodes `gh pr create`, so agents push with whatever forge tooling they have. (#1609)
- **One rename:** "Claude Search Optimization" is now "Skill Discovery Optimization," since the technique isn't Claude-specific.

### Writing Skills

Two additions for skill authors.

- **Match the Form to the Failure** — a short table for picking the right kind of guidance. A flat "don't do X" works for discipline slips but backfires when the problem is the *shape* of an output, where a worked example does better. The table, and a tighter scope on the existing rationalization section, steer authors to the form that actually helps.
- **Micro-Test Wording** — a cheap way to check a phrasing before committing to it: sample it a handful of times against a no-guidance control and read every result by hand, treating run-to-run variance as a warning sign.

### Testing

Skill-behavior testing moved out of `tests/` into a new `evals/` submodule built on "drill," which runs real Claude Code, Codex, and Gemini sessions and judges them with an LLM. Several in-tree bash suites retired once a stricter drill scenario covered them; the few with no equivalent stayed. From here on, `tests/` holds plugin-code tests and `evals/` holds skill-behavior tests, and `docs/testing.md` explains the split. New backends reach Antigravity, Pi, and more models, and new shell-lint and pre-commit checks guard the harness. (#1541)

### Bug Fixes

- **systematic-debugging no longer forces every session into extended thinking.** One bullet held the exact keyword Claude Code scans for, quietly tripping the switch on every session that loaded the skill. A hyphen breaks the keyword; the text still reads. (#1283, by @Nick Galatis)
- **The Windows SessionStart hook stopped printing a write error every session** — each `printf` now routes through `cat` to absorb the broken pipe, and the output is otherwise unchanged. (#1612, reported by @silvertakana)
- **Windows foreground mode** tracks the right process and clears its owner PID on MSYS2. (by @nestorluiscamachopaz)
- **The `using-spark` bootstrap** no longer lists "debugging" as a skill that doesn't exist. (reported by @mhat)
- **The TDD skill** links the testing anti-patterns reference. (#1532, #1529; link fix #1474 by @Stable Genius)
- **`using-git-worktrees`** fixes its step numbering and drops stale Cursor references. (#1522, and by @fuleinist)
- **The Codex review skill** swaps a private in-joke for plain guidance. (#1531)

### Documentation & Contributor Guidelines

- **A guide to porting SPARK to a new harness** (`docs/porting-to-a-new-harness.md`) lays out the three pieces every integration needs and the one rule that makes or breaks it: load the bootstrap at session start.
- **Every PR and issue now discloses how it was made** — model, harness, version, and installed plugins, or a note that it was written by hand. We weigh a contribution differently depending on what produced it. PRs also target `dev`, not `main`. The PR template, all three issue templates, and a new platform-support template carry this.

### Contributors

Thanks to @mattvanhorn, @nawfal, @Nick Galatis, @silvertakana, @nestorluiscamachopaz, @qer, @mhat, @Stable Genius, @fuleinist, @dev_Hakaze, @robotsnh, Rahul, and @arittr.

## v5.1.0 (2026-04-30)

### Removals

- **Legacy slash commands removed** — `/brainstorm`, `/execute-plan`, and `/write-plan` are gone. They were deprecated stubs that did nothing but tell the user to invoke the corresponding skill. Invoke `spark:brainstorming`, `spark:executing-plans`, and `spark:writing-plans` directly instead. (#1188)
- **`spark:code-reviewer` named agent removed** — the agent was the plugin's only named agent and was used by exactly two skills, while every other reviewer/implementer subagent in the repo dispatches `general-purpose` with a prompt template alongside its skill. The agent's persona and checklist have been merged into `skills/requesting-code-review/code-reviewer.md` as a self-contained Task-dispatch template. Anyone dispatching `Task (spark:code-reviewer)` should switch to `Task (general-purpose)` with the prompt template instead. (PR #1299)
- **Integration sections removed from skills** — these were a legacy of the time before agents had native skills systems and didn't help with steering.

### Worktree Skills Rewrite

`using-git-worktrees` and `finishing-a-development-branch` now detect when the agent is already running inside an isolated worktree and prefer the harness's native worktree controls before falling back to `git worktree`. Behavior was TDD-validated and cross-platform-checked across five harnesses. (PRI-974, PR #1121)

- **Environment detection** — both skills check `GIT_DIR != GIT_COMMON` before doing anything; if already in a linked worktree, creation is skipped entirely. A submodule guard prevents false detection.
- **Consent before creating worktrees** — `using-git-worktrees` no longer creates worktrees implicitly; the skill asks the user first. Fixes #991 (subagent-driven-development was auto-creating worktrees without consent).
- **Native tool preference (Step 1a)** — when the harness exposes its own worktree tool (e.g. Codex), the skill defers to it. The user's stated preference is respected when expressed.
- **Provenance-based cleanup** — `finishing-a-development-branch` only cleans up worktrees inside `.worktrees/` (created by spark); anything outside is left alone. Fixes #940 (Option 2 was incorrectly cleaning up worktrees), #999 (merge-then-remove ordering), and #238 (`cd` to repo root before `git worktree remove`).
- **Detached HEAD handling** — the finishing menu collapses to two options when there is no branch to merge from.
- **Hardcoded `/Users/jesse` paths** in skill examples replaced with generic placeholders. (#858, PR #1122)

### Contributor Guidelines for AI Agents

Two new sections at the top of `CLAUDE.md` (symlinked to `AGENTS.md`) speak directly to AI agents. An audit of the last 100 closed PRs against this repo showed a 94% rejection rate driven by AI-generated slop: agents that didn't read the PR template, opened duplicates, fabricated problem descriptions, or pushed fork- or domain-specific changes upstream.

- **Pre-submission checklist** — read the PR template, search for existing PRs, verify a real problem exists, confirm the change belongs in core, and show the human partner the complete diff before submitting.
- **What we will not accept** — third-party dependencies, "compliance" rewrites of skill content, project-specific configuration, bulk PRs, speculative fixes, domain-specific skills, fork-specific changes, fabricated content, and bundled unrelated changes.
- **New harness PRs require a session transcript** — most past new-harness integrations copied skill files or wrapped with `npx skills` instead of loading the `using-spark` bootstrap at session start. The acceptance test ("Let's make a react todo list" must auto-trigger `brainstorming` in a clean session) and a complete transcript are now required.

### Codex Plugin Mirror Tooling

New `sync-to-codex-plugin` script mirrors spark into the OpenAI Codex plugin marketplace as `prime-radiant-inc/openai-codex-plugins`. Path/user-agnostic so any team member can run it. (PR #1165)

- Clones the fork fresh into a temp directory per run, regenerates overlays inline, and opens a PR; auto-detects upstream from the script's own location and preflights `rsync`/`git`/`gh auth`/`python3`.
- `--bootstrap` flag for first-time setup; `EXCLUDES` patterns anchored to source root; `assets/` excluded.
- Mirrors `CODE_OF_CONDUCT.md`; drops the `agents/openai.yaml` overlay.
- Seeds `interface.defaultPrompt` in the mirrored `plugin.json`. (PR #1180 by @arittr)
- Codex plugin files are committed to the source repo so the sync script uses canonical versions; Codex marketplace metadata is preserved.

### OpenCode

- **Bootstrap content cached at module level** — `getBootstrapContent()` was calling `fs.existsSync` + `fs.readFileSync` + frontmatter regex on every agent step (the `experimental.chat.messages.transform` hook fires on every step in OpenCode's agent loop). Now read once, cached for the session lifetime, with a null sentinel for the missing-file case. 15 regression tests cover cache behavior, fs call counts, the injection guard, the missing-file sentinel, and cache reset. (Fixes #1202)
- **Integration tests modernized**.
- **Install caveats clarified** in the README.

### Code Review Consolidation

`requesting-code-review` is now self-contained: the persona, checklist, and dispatch template live in `skills/requesting-code-review/code-reviewer.md` and the skill dispatches `Task (general-purpose)` directly. (PR #1299)

- **Single source of truth** — the persona/checklist that previously lived in both `agents/code-reviewer.md` and the skill's placeholder template (and drifted independently) is now one file.
- **`subagent-driven-development` follows suit** — its `code-quality-reviewer-prompt.md` now dispatches `Task (general-purpose)` instead of the named agent.
- **Behavioral test added** — `tests/claude-code/test-requesting-code-review.sh` plants real bugs (SQL injection, plaintext password handling, credential logging) into a tiny project and asserts the dispatched reviewer flags every planted issue at Critical/Important severity and refuses to approve the diff.

> Note: `tests/claude-code/test-requesting-code-review.sh` and `tests/claude-code/test-document-review-system.sh` (mentioned later in this document) were lifted into drill scenarios on 2026-05-06 and removed from `tests/`. See `evals/scenarios/code-review-catches-planted-bugs.yaml` and `evals/scenarios/spec-reviewer-catches-planted-flaws.yaml`. The references above and below are preserved as dated artifacts of the work this section describes.
- **Codex and Copilot workaround docs trimmed** — the "Named agent dispatch" sections in `references/codex-tools.md` and `references/copilot-tools.md` documented how to flatten a named agent into a generic dispatch. With no named agents shipping, the workaround is unnecessary; both sections were dropped.

### Subagent-Driven Development

- **No more pause every 3 tasks** — the "review after each batch (3 tasks)" cadence in `requesting-code-review` (originally for `executing-plans`) was leaking into `subagent-driven-development`. Replaced with "each task or at natural checkpoints" plus an explicit continuous-execution directive.
- **SDD integration test now runs its assertions** — three independent bugs caused the test to silently bail before printing any verification results: an unresolved `..` segment in the working-dir path, a `set -euo pipefail` interaction with `find | sort | head -1` (SIGPIPE on the producer killed the script), and a missing `--plugin-dir` on the `claude -p` invocation that caused the test to load the installed plugin instead of the working tree. All three fixed; six verification tests now actually run against a real end-to-end SDD run.

### Cursor

- **Windows SessionStart hook** routed through `run-hook.cmd` instead of invoking the extensionless `session-start` script directly. Fixes Windows opening the file in an editor instead of running it. Also removed an accidental UTF-8 BOM from `hooks-cursor.json`.

### Gemini CLI

- **Subagent dispatch mapping** — Gemini's `Task` dispatch now maps to `@agent-name` / `@generalist`, with parallel subagent dispatch documented for independent tasks.

### Skills

- **Terminology cleanups** across skill content.

### Documentation & Install

- **Factory Droid installation instructions** added to README.
- **Quickstart install links** in README. (PR #1293 by @arittr)
- **Codex plugin install guidance** updated. (PR #1288 by @arittr)
- **Codex `wait` mapping corrected** to `wait_agent` in the tools reference.
- **Install order reorganized**; Codex install instructions cleaned up.
- **Removed vestigial `CHANGELOG.md`** in favor of `RELEASE-NOTES.md` as the single source. (PR #1163 by @shaanmajid)
- **Discord invite link** fixed; release announcements link and a detailed Discord description added to the Community section.

### Community

- @shaanmajid — vestigial `CHANGELOG.md` removal (PR #1163)
- @arittr — README quickstart install links (#1293), Codex plugin install guidance (#1288), `sync-to-codex-plugin` `interface.defaultPrompt` seed (#1180)

## v5.0.7 (2026-03-31)

### GitHub Copilot CLI Support

- **SessionStart context injection** — Copilot CLI v1.0.11 added support for `additionalContext` in sessionStart hook output. The session-start hook now detects the `COPILOT_CLI` environment variable and emits the SDK-standard `{ "additionalContext": "..." }` format, giving Copilot CLI users the full spark bootstrap at session start. (Original fix by @culinablaz in PR #910)
- **Tool mapping** — added `references/copilot-tools.md` with the full Claude Code to Copilot CLI tool equivalence table
- **Skill and README updates** — added Copilot CLI to the `using-spark` skill's platform instructions and README installation section

### OpenCode Fixes

- **Skills path consistency** — the bootstrap text no longer advertises a misleading `configDir/skills/spark/` path that didn't match the runtime path. The agent should use the native `skill` tool, not navigate to files by path. Tests now use consistent paths derived from a single source of truth. (#847, #916)
- **Bootstrap as user message** — moved bootstrap injection from `experimental.chat.system.transform` to `experimental.chat.messages.transform`, prepending to the first user message instead of adding a system message. Avoids token bloat from system messages repeated every turn (#750) and fixes compatibility with Qwen and other models that break on multiple system messages (#894).

## v5.0.6 (2026-03-24)

### Inline Self-Review Replaces Subagent Review Loops

The subagent review loop (dispatching a fresh agent to review plans/specs) doubled execution time (~25 min overhead) without measurably improving plan quality. Regression testing across 5 versions with 5 trials each showed identical quality scores regardless of whether the review loop ran.

- **brainstorming** — replaced Spec Review Loop (subagent dispatch + 3-iteration cap) with inline Spec Self-Review checklist: placeholder scan, internal consistency, scope check, ambiguity check
- **writing-plans** — replaced Plan Review Loop (subagent dispatch + 3-iteration cap) with inline Self-Review checklist: spec coverage, placeholder scan, type consistency
- **writing-plans** — added explicit "No Placeholders" section defining plan failures (TBD, vague descriptions, undefined references, "similar to Task N")
- Self-review catches 3-5 real bugs per run in ~30s instead of ~25 min, with comparable defect rates to the subagent approach

### Brainstorm Server

- **Session directory restructured** — the brainstorm server session directory now contains two peer subdirectories: `content/` (HTML files served to the browser) and `state/` (events, server-info, pid, log). Previously, server state and user interaction data were stored alongside served content, making them accessible over HTTP. The `screen_dir` and `state_dir` paths are both included in the server-started JSON. (Reported by 吉田仁)

### Bug Fixes

- **Owner-PID lifecycle fixes** — the brainstorm server's owner-PID monitoring had two bugs causing false shutdowns within 60 seconds: (1) EPERM from cross-user PIDs (Tailscale SSH, etc.) was treated as "process dead", and (2) on WSL the grandparent PID resolves to a short-lived subprocess that exits before the first lifecycle check. Fixed by treating EPERM as "alive" and validating the owner PID at startup — if it's already dead, monitoring is disabled and the server relies on the 30-minute idle timeout. This also removes the Windows/MSYS2-specific carve-out from `start-server.sh` since the server now handles it generically. (#879)
- **writing-skills** — corrected false claim that SKILL.md frontmatter supports "only two fields"; now says "two required fields" and links to the agentskills.io specification for all supported fields (PR #882 by @arittr)

### Codex App Compatibility

- **codex-tools** — added named agent dispatch mapping documenting how to translate Claude Code's named agent types to Codex's `spawn_agent` with worker roles (PR #647 by @arittr)
- **codex-tools** — added environment detection and Codex App finishing sections for worktree-aware skills (by @arittr)
- **Design spec** — added Codex App compatibility design spec (PRI-823) covering read-only environment detection, worktree-safe skill behavior, and sandbox fallback patterns (by @arittr)

## v5.0.5 (2026-03-17)

### Bug Fixes

- **Brainstorm server ESM fix** — renamed `server.js` → `server.cjs` so the brainstorming server starts correctly on Node.js 22+ where the root `package.json` `"type": "module"` caused `require()` to fail. (PR #784 by @sarbojitrana, fixes #774, #780, #783)
- **Brainstorm owner-PID on Windows** — skip PID lifecycle monitoring on Windows/MSYS2 where the PID namespace is invisible to Node.js, preventing the server from self-terminating after 60 seconds. (#770, docs from PR #768 by @lucasyhzlu-debug)
- **stop-server.sh reliability** — verify the server process actually died before reporting success. SIGTERM + 2s wait + SIGKILL fallback. (#723)

### Changed

- **Execution handoff** — restore user choice between subagent-driven and inline execution after plan writing. Subagent-driven is recommended but no longer mandatory.

## v5.0.4 (2026-03-16)

### Review Loop Refinements

Dramatically reduces token usage and speeds up spec and plan reviews by eliminating unnecessary review passes and tightening reviewer focus.

- **Single whole-plan review** — plan reviewer now reviews the complete plan in one pass instead of chunk-by-chunk. Removed all chunk-related concepts (`## Chunk N:` headings, 1000-line chunk limits, per-chunk dispatch).
- **Raised the bar for blocking issues** — both spec and plan reviewer prompts now include a "Calibration" section: only flag issues that would cause real problems during implementation. Minor wording, stylistic preferences, and formatting quibbles should not block approval.
- **Reduced max review iterations** — from 5 to 3 for both spec and plan review loops. If the reviewer is calibrated correctly, 3 rounds is plenty.
- **Streamlined reviewer checklists** — spec reviewer trimmed from 7 categories to 5; plan reviewer from 7 to 4. Removed formatting-focused checks (task syntax, chunk size) in favor of substance (buildability, spec alignment).

### OpenCode

- **One-line plugin install** — OpenCode plugin now auto-registers the skills directory via a `config` hook. No symlinks or `skills.paths` config needed. Install is just adding one line to `opencode.json`. (PR #753)
- **Added `package.json`** so OpenCode can install spark as an npm package from git.

### Bug Fixes

- **Verify server actually stopped** — `stop-server.sh` now confirms the process is dead before reporting success. SIGTERM + 2s wait + SIGKILL fallback. Reports failure if the process survives. (PR #751)
- **Generic agent language** — brainstorm companion waiting page now says "the agent" instead of "Claude".

## v5.0.3 (2026-03-15)

### Cursor Support

- **Cursor hooks** — added `hooks/hooks-cursor.json` with Cursor's camelCase format (`sessionStart`, `version: 1`) and updated `.cursor-plugin/plugin.json` to reference it. Fixed platform detection in `session-start` to check `CURSOR_PLUGIN_ROOT` first (Cursor may also set `CLAUDE_PLUGIN_ROOT`). (Based on PR #709)

### Bug Fixes

- **Stop firing SessionStart hook on `--resume`** — the startup hook was re-injecting context on resumed sessions, which already have the context in their conversation history. The hook now fires only on `startup`, `clear`, and `compact`.
- **Bash 5.3+ hook hang** — replaced heredoc (`cat <<EOF`) with `printf` in `hooks/session-start`. Fixes indefinite hang on macOS with Homebrew bash 5.3+ caused by a bash regression with large variable expansion in heredocs. (#572, #571)
- **POSIX-safe hook script** — replaced `${BASH_SOURCE[0]:-$0}` with `$0` in `hooks/session-start`. Fixes "Bad substitution" error on Ubuntu/Debian where `/bin/sh` is dash. (#553)
- **Portable shebangs** — replaced `#!/bin/bash` with `#!/usr/bin/env bash` in all shell scripts. Fixes execution on NixOS, FreeBSD, and macOS with Homebrew bash where `/bin/bash` is outdated or missing. (#700)
- **Brainstorm server on Windows** — auto-detect Windows/Git Bash (`OSTYPE=msys*`, `MSYSTEM`) and switch to foreground mode, fixing silent server failure caused by `nohup`/`disown` process reaping. (#737)
- **Codex docs fix** — replaced deprecated `collab` flag with `multi_agent` in Codex documentation. (PR #749)

## v5.0.2 (2026-03-11)

### Zero-Dependency Brainstorm Server

**Removed all vendored node_modules — server.js is now fully self-contained**

- Replaced Express/Chokidar/WebSocket dependencies with zero-dependency Node.js server using built-in `http`, `fs`, and `crypto` modules
- Removed ~1,200 lines of vendored `node_modules/`, `package.json`, and `package-lock.json`
- Custom WebSocket protocol implementation (RFC 6455 framing, ping/pong, proper close handshake)
- Native `fs.watch()` file watching replaces Chokidar
- Full test suite: HTTP serving, WebSocket protocol, file watching, and integration tests

### Brainstorm Server Reliability

- **Auto-exit after 30 minutes idle** — server shuts down when no clients are connected, preventing orphaned processes
- **Owner process tracking** — server monitors the parent harness PID and exits when the owning session dies
- **Liveness check** — skill verifies server is responsive before reusing an existing instance
- **Encoding fix** — proper `<meta charset="utf-8">` on served HTML pages

### Subagent Context Isolation

- All delegation skills (brainstorming, dispatching-parallel-agents, requesting-code-review, subagent-driven-development, writing-plans) now include context isolation principle
- Subagents receive only the context they need, preventing context window pollution

## v5.0.1 (2026-03-10)

### Agentskills Compliance

**Brainstorm-server moved into skill directory**

- Moved `lib/brainstorm-server/` → `skills/brainstorming/scripts/` per the [agentskills.io](https://agentskills.io) specification
- All `${CLAUDE_PLUGIN_ROOT}/lib/brainstorm-server/` references replaced with relative `scripts/` paths
- Skills are now fully portable across platforms — no platform-specific env vars needed to locate scripts
- `lib/` directory removed (was the last remaining content)

### New Features

**Gemini CLI extension**

- Native Gemini CLI extension support via `gemini-extension.json` and `GEMINI.md` at repo root
- `GEMINI.md` @imports `using-spark` skill and tool mapping table at session start
- Gemini CLI tool mapping reference (`skills/using-spark/references/gemini-tools.md`) — translates Claude Code tool names (Read, Write, Edit, Bash, etc.) to Gemini CLI equivalents (read_file, write_file, replace, etc.)
- Documents Gemini CLI limitations: no subagent support, skills fall back to `executing-plans`
- Extension root at repo root for cross-platform compatibility (avoids Windows symlink issues)
- Install instructions added to README

### Improvements

**Multi-platform brainstorm server launch**

- Per-platform launch instructions in visual-companion.md: Claude Code (default mode), Codex (auto-foreground via `CODEX_CI`), Gemini CLI (`--foreground` with `is_background`), and fallback for other environments
- Server now writes startup JSON to `$SCREEN_DIR/.server-info` so agents can find the URL and port even when stdout is hidden by background execution

**Brainstorm server dependencies bundled**

- `node_modules` vendored into the repo so the brainstorm server works immediately on fresh plugin installs without requiring `npm` at runtime
- Removed `fsevents` from bundled deps (macOS-only native binary; chokidar falls back gracefully without it)
- Fallback auto-install via `npm install` if `node_modules` is missing

**OpenCode tool mapping fix**

- `TodoWrite` → `todowrite` (was incorrectly mapped to `update_plan`); verified against OpenCode source

### Bug Fixes

**Windows/Linux: single quotes break SessionStart hook** (#577, #529, #644, PR #585)

- Single quotes around `${CLAUDE_PLUGIN_ROOT}` in hooks.json fail on Windows (cmd.exe doesn't recognize single quotes as path delimiters) and on Linux (single quotes prevent variable expansion)
- Fix: replaced single quotes with escaped double quotes — works across macOS bash, Windows cmd.exe, Windows Git Bash, and Linux, with and without spaces in paths
- Verified on Windows 11 (NT 10.0.26200.0) with Claude Code 2.1.72 and Git for Windows

**Brainstorming spec review loop skipped** (#677)

- The spec review loop (dispatch spec-document-reviewer subagent, iterate until approved) existed in the prose "After the Design" section but was missing from the checklist and process flow diagram
- Since agents follow the diagram and checklist more reliably than prose, the spec review step was being skipped entirely
- Added step 7 (spec review loop) to the checklist and corresponding nodes to the dot graph
- Tested with `claude --plugin-dir` and `claude-session-driver`: worker now correctly dispatches the reviewer

**Cursor install command** (PR #676)

- Fixed Cursor install command in README: `/plugin-add` → `/add-plugin` (confirmed via Cursor 2.5 release announcement)

**User review gate in brainstorming** (#565)

- Added explicit user review step between spec completion and writing-plans handoff
- User must approve the spec before implementation planning begins
- Checklist, process flow, and prose updated with the new gate

**Session-start hook emits context only once per platform**

- Hook now detects whether it's running in Claude Code or another platform
- Emits `hookSpecificOutput` for Claude Code, `additional_context` for others — prevents double context injection

**Linting fix in token analysis script**

- `except:` → `except Exception:` in `tests/claude-code/analyze-token-usage.py`

### Maintenance

**Removed dead code**

- Deleted `lib/skills-core.js` and its test (`tests/opencode/test-skills-core.js`) — unused since February 2026
- Removed skills-core existence check from `tests/opencode/test-plugin-loading.sh`

### Community

- @karuturi — Claude Code official marketplace install instructions (PR #610)
- @mvanhorn — session-start hook dual-emit fix, OpenCode tool mapping fix
- @daniel-graham — linting fix for bare except
- PR #585 author — Windows/Linux hooks quoting fix

---

## v5.0.0 (2026-03-09)

### Breaking Changes

**Specs and plans directory restructured**

- Specs (brainstorming output) now save to `docs/spark/specs/YYYY-MM-DD-<topic>-design.md`
- Plans (writing-plans output) now save to `docs/spark/plans/YYYY-MM-DD-<feature-name>.md`
- User preferences for spec/plan locations override these defaults
- All internal skill references, test files, and example paths updated to match
- Migration: move existing files from `docs/plans/` to new locations if desired

**Subagent-driven development mandatory on capable harnesses**

Writing-plans no longer offers a choice between subagent-driven and executing-plans. On harnesses with subagent support (Claude Code, Codex), subagent-driven-development is required. Executing-plans is reserved for harnesses without subagent capability, and now tells the user that SPARK works better on a subagent-capable platform.

**Executing-plans no longer batches**

Removed the "execute 3 tasks then stop for review" pattern. Plans now execute continuously, stopping only for blockers.

**Slash commands deprecated**

`/brainstorm`, `/write-plan`, and `/execute-plan` now show deprecation notices pointing users to the corresponding skills. Commands will be removed in the next major release.

### New Features

**Visual brainstorming companion**

Optional browser-based companion for brainstorming sessions. When a topic would benefit from visuals, the brainstorming skill offers to show mockups, diagrams, comparisons, and other content in a browser window alongside terminal conversation.

- `lib/brainstorm-server/` — WebSocket server with browser helper library, session management scripts, and dark/light themed frame template ("SPARK Brainstorming" with GitHub link)
- `skills/brainstorming/visual-companion.md` — Progressive disclosure guide for server workflow, screen authoring, and feedback collection
- Brainstorming skill adds a visual companion decision point to its process flow: after exploring project context, the skill evaluates whether upcoming questions involve visual content and offers the companion in its own message
- Per-question decision: even after accepting, each question is evaluated for whether browser or terminal is more appropriate
- Integration tests in `tests/brainstorm-server/`

**Document review system**

Automated review loops for spec and plan documents using subagent dispatch:

- `skills/brainstorming/spec-document-reviewer-prompt.md` — Reviewer checks completeness, consistency, architecture, and YAGNI
- `skills/writing-plans/plan-document-reviewer-prompt.md` — Reviewer checks spec alignment, task decomposition, file structure, and file size
- Brainstorming dispatches spec reviewer after writing the design doc
- Writing-plans includes chunk-based plan review loop after each section
- Review loops repeat until approved or escalate after 5 iterations
- End-to-end tests in `tests/claude-code/test-document-review-system.sh`
- Design spec and implementation plan in `docs/spark/`

**Architecture guidance across the skill pipeline**

Design-for-isolation and file-size-awareness guidance added to brainstorming, writing-plans, and subagent-driven-development:

- **Brainstorming** — New sections: "Design for isolation and clarity" (clear boundaries, well-defined interfaces, independently testable units) and "Working in existing codebases" (follow existing patterns, targeted improvements only)
- **Writing-plans** — New "File Structure" section: map out files and responsibilities before defining tasks. New "Scope Check" backstop: catch multi-subsystem specs that should have been decomposed during brainstorming
- **SDD implementer** — New "Code Organization" section (follow plan's file structure, report concerns about growing files) and "When You're in Over Your Head" escalation guidance
- **SDD code quality reviewer** — Now checks architecture, unit decomposition, plan conformance, and file growth
- **Spec/plan reviewers** — Architecture and file size added to review criteria
- **Scope assessment** — Brainstorming now assesses whether a project is too large for a single spec. Multi-subsystem requests are flagged early and decomposed into sub-projects, each with its own spec → plan → implementation cycle

**Subagent-driven development improvements**

- **Model selection** — Guidance for choosing model capability by task type: cheap models for mechanical implementation, standard for integration, capable for architecture and review
- **Implementer status protocol** — Subagents now report DONE, DONE_WITH_CONCERNS, BLOCKED, or NEEDS_CONTEXT. Controller handles each status appropriately: re-dispatching with more context, upgrading model capability, breaking tasks apart, or escalating to human

### Improvements

**Instruction priority hierarchy**

Added explicit priority ordering to using-spark:

1. User's explicit instructions (CLAUDE.md, AGENTS.md, direct requests) — highest priority
2. SPARK skills — override default system behavior
3. Default system prompt — lowest priority

If CLAUDE.md or AGENTS.md says "don't use TDD" and a skill says "always use TDD," the user's instructions win.

**SUBAGENT-STOP gate**

Added `<SUBAGENT-STOP>` block to using-spark. Subagents dispatched for specific tasks now skip the skill instead of activating the 1% rule and invoking full skill workflows.

**Multi-platform improvements**

- Codex tool mapping moved to progressive disclosure reference file (`references/codex-tools.md`)
- Platform Adaptation pointer added so non-Claude-Code platforms can find tool equivalents
- Plan headers now address "agentic workers" instead of "Claude" specifically
- Collab feature requirement documented in `docs/README.codex.md`

**Writing-plans template updates**

- Plan steps now use checkbox syntax (`- [ ] **Step N:**`) for progress tracking
- Plan header references both subagent-driven-development and executing-plans with platform-aware routing

---

## v4.3.1 (2026-02-21)

### Added

**Cursor support**

SPARK now works with Cursor's plugin system. Includes a `.cursor-plugin/plugin.json` manifest and Cursor-specific installation instructions in the README. The SessionStart hook output now includes an `additional_context` field alongside the existing `hookSpecificOutput.additionalContext` for Cursor hook compatibility.

### Fixed

**Windows: Restored polyglot wrapper for reliable hook execution (#518, #504, #491, #487, #466, #440)**

Claude Code's `.sh` auto-detection on Windows was prepending `bash` to the hook command, breaking execution. The fix:

- Renamed `session-start.sh` to `session-start` (extensionless) so auto-detection doesn't interfere
- Restored `run-hook.cmd` polyglot wrapper with multi-location bash discovery (standard Git for Windows paths, then PATH fallback)
- Exits silently if no bash is found rather than erroring
- On Unix, the wrapper runs the script directly via `exec bash`
- Uses POSIX-safe `dirname "$0"` path resolution (works on dash/sh, not just bash)

This fixes SessionStart failures on Windows with spaces in paths, missing WSL, `set -euo pipefail` fragility on MSYS, and backslash mangling.

## v4.3.0 (2026-02-12)

This fix should dramatically improve spark skills compliance and should reduce the chances of Claude entering its native plan mode unintentionally.

### Changed

**Brainstorming skill now enforces its workflow instead of describing it**

Models were skipping the design phase and jumping straight to implementation skills like frontend-design, or collapsing the entire brainstorming process into a single text block. The skill now uses hard gates, a mandatory checklist, and a graphviz process flow to enforce compliance:

- `<HARD-GATE>`: no implementation skills, code, or scaffolding until design is presented and user approves
- Explicit checklist (6 items) that must be created as tasks and completed in order
- Graphviz process flow with `writing-plans` as the only valid terminal state
- Anti-pattern callout for "this is too simple to need a design" — the exact rationalization models use to skip the process
- Design section sizing based on section complexity, not project complexity

**Using-spark workflow graph intercepts EnterPlanMode**

Added an `EnterPlanMode` intercept to the skill flow graph. When the model is about to enter Claude's native plan mode, it checks whether brainstorming has happened and routes through the brainstorming skill instead. Plan mode is never entered.

### Fixed

**SessionStart hook now runs synchronously**

Changed `async: true` to `async: false` in hooks.json. When async, the hook could fail to complete before the model's first turn, meaning using-spark instructions weren't in context for the first message.

## v4.2.0 (2026-02-05)

### Breaking Changes

**Codex: Replaced bootstrap CLI with native skill discovery**

The `spark-codex` bootstrap CLI, Windows `.cmd` wrapper, and related bootstrap content file have been removed. Codex now uses native skill discovery via `~/.agents/skills/spark/` symlink, so the old `use_skill`/`find_skills` CLI tools are no longer needed.

Installation is now just clone + symlink (documented in INSTALL.md). No Node.js dependency required. The old `~/.codex/skills/` path is deprecated.

### Fixes

**Windows: Fixed Claude Code 2.1.x hook execution (#331)**

Claude Code 2.1.x changed how hooks execute on Windows: it now auto-detects `.sh` files in commands and prepends `bash`. This broke the polyglot wrapper pattern because `bash "run-hook.cmd" session-start.sh` tries to execute the `.cmd` file as a bash script.

Fix: hooks.json now calls session-start.sh directly. Claude Code 2.1.x handles the bash invocation automatically. Also added .gitattributes to enforce LF line endings for shell scripts (fixes CRLF issues on Windows checkout).

**Windows: SessionStart hook runs async to prevent terminal freeze (#404, #413, #414, #419)**

The synchronous SessionStart hook blocked the TUI from entering raw mode on Windows, freezing all keyboard input. Running the hook async prevents the freeze while still injecting spark context.

**Windows: Fixed O(n^2) `escape_for_json` performance**

The character-by-character loop using `${input:$i:1}` was O(n^2) in bash due to substring copy overhead. On Windows Git Bash this took 60+ seconds. Replaced with bash parameter substitution (`${s//old/new}`) which runs each pattern as a single C-level pass — 7x faster on macOS, dramatically faster on Windows.

**Codex: Fixed Windows/PowerShell invocation (#285, #243)**

- Windows doesn't respect shebangs, so directly invoking the extensionless `spark-codex` script triggered an "Open with" dialog. All invocations now prefixed with `node`.
- Fixed `~/` path expansion on Windows — PowerShell doesn't expand `~` when passed as an argument to `node`. Changed to `$HOME` which expands correctly in both bash and PowerShell.

**Codex: Fixed path resolution in installer**

Used `fileURLToPath()` instead of manual URL pathname parsing to correctly handle paths with spaces and special characters on all platforms.

**Codex: Fixed stale skills path in writing-skills**

Updated `~/.codex/skills/` reference (deprecated) to `~/.agents/skills/` for native discovery.

### Improvements

**Worktree isolation now required before implementation**

Added `using-git-worktrees` as a required skill for both `subagent-driven-development` and `executing-plans`. Implementation workflows now explicitly require setting up an isolated worktree before starting work, preventing accidental work directly on main.

**Main branch protection softened to require explicit consent**

Instead of prohibiting main branch work entirely, the skills now allow it with explicit user consent. More flexible while still ensuring users are aware of the implications.

**Simplified installation verification**

Removed `/help` command check and specific slash command list from verification steps. Skills are primarily invoked by describing what you want to do, not by running specific commands.

**Codex: Clarified subagent tool mapping in bootstrap**

Improved documentation of how Codex tools map to Claude Code equivalents for subagent workflows.

### Tests

- Added worktree requirement test for subagent-driven-development
- Added main branch red flag warning test
- Fixed case sensitivity in skill recognition test assertions

---

## v4.1.1 (2026-01-23)

### Fixes

**OpenCode: Standardized on `plugins/` directory per official docs (#343)**

OpenCode's official documentation uses `~/.config/opencode/plugins/` (plural). Our docs previously used `plugin/` (singular). While OpenCode accepts both forms, we've standardized on the official convention to avoid confusion.

Changes:
- Renamed `.opencode/plugin/` to `.opencode/plugins/` in repo structure
- Updated all installation docs (INSTALL.md, README.opencode.md) across all platforms
- Updated test scripts to match

**OpenCode: Fixed symlink instructions (#339, #342)**

- Added explicit `rm` before `ln -s` (fixes "file already exists" errors on reinstall)
- Added missing skills symlink step that was absent from INSTALL.md
- Updated from deprecated `use_skill`/`find_skills` to native `skill` tool references

---

## v4.1.0 (2026-01-23)

### Breaking Changes

**OpenCode: Switched to native skills system**

SPARK for OpenCode now uses OpenCode's native `skill` tool instead of custom `use_skill`/`find_skills` tools. This is a cleaner integration that works with OpenCode's built-in skill discovery.

**Migration required:** Skills must be symlinked to `~/.config/opencode/skills/spark/` (see updated installation docs).

### Fixes

**OpenCode: Fixed agent reset on session start (#226)**

The previous bootstrap injection method using `session.prompt({ noReply: true })` caused OpenCode to reset the selected agent to "build" on first message. Now uses `experimental.chat.system.transform` hook which modifies the system prompt directly without side effects.

**OpenCode: Fixed Windows installation (#232)**

- Removed dependency on `skills-core.js` (eliminates broken relative imports when file is copied instead of symlinked)
- Added comprehensive Windows installation docs for cmd.exe, PowerShell, and Git Bash
- Documented proper symlink vs junction usage for each platform

**Claude Code: Fixed Windows hook execution for Claude Code 2.1.x**

Claude Code 2.1.x changed how hooks execute on Windows: it now auto-detects `.sh` files in commands and prepends `bash `. This broke the polyglot wrapper pattern because `bash "run-hook.cmd" session-start.sh` tries to execute the .cmd file as a bash script.

Fix: hooks.json now calls session-start.sh directly. Claude Code 2.1.x handles the bash invocation automatically. Also added .gitattributes to enforce LF line endings for shell scripts (fixes CRLF issues on Windows checkout).

---

## v4.0.3 (2025-12-26)

### Improvements

**Strengthened using-spark skill for explicit skill requests**

Addressed a failure mode where Claude would skip invoking a skill even when the user explicitly requested it by name (e.g., "subagent-driven-development, please"). Claude would think "I know what that means" and start working directly instead of loading the skill.

Changes:
- Updated "The Rule" to say "Invoke relevant or requested skills" instead of "Check for skills" - emphasizing active invocation over passive checking
- Added "BEFORE any response or action" - the original wording only mentioned "response" but Claude would sometimes take action without responding first
- Added reassurance that invoking a wrong skill is okay - reduces hesitation
- Added new red flag: "I know what that means" → Knowing the concept ≠ using the skill

**Added explicit skill request tests**

New test suite in `tests/explicit-skill-requests/` that verifies Claude correctly invokes skills when users request them by name. Includes single-turn and multi-turn test scenarios.

## v4.0.2 (2025-12-23)

### Fixes

**Slash commands now user-only**

Added `disable-model-invocation: true` to all three slash commands (`/brainstorm`, `/execute-plan`, `/write-plan`). Claude can no longer invoke these commands via the Skill tool—they're restricted to manual user invocation only.

The underlying skills (`spark:brainstorming`, `spark:executing-plans`, `spark:writing-plans`) remain available for Claude to invoke autonomously. This change prevents confusion when Claude would invoke a command that just redirects to a skill anyway.

## v4.0.1 (2025-12-23)

### Fixes

**Clarified how to access skills in Claude Code**

Fixed a confusing pattern where Claude would invoke a skill via the Skill tool, then try to Read the skill file separately. The `using-spark` skill now explicitly states that the Skill tool loads skill content directly—no need to read files.

- Added "How to Access Skills" section to `using-spark`
- Changed "read the skill" → "invoke the skill" in instructions
- Updated slash commands to use fully qualified skill names (e.g., `spark:brainstorming`)

**Added GitHub thread reply guidance to receiving-code-review** (h/t @ralphbean)

Added a note about replying to inline review comments in the original thread rather than as top-level PR comments.

**Added automation-over-documentation guidance to writing-skills** (h/t @EthanJStark)

Added guidance that mechanical constraints should be automated, not documented—save skills for judgment calls.

## v4.0.0 (2025-12-17)

### New Features

**Two-stage code review in subagent-driven-development**

Subagent workflows now use two separate review stages after each task:

1. **Spec compliance review** - Skeptical reviewer verifies implementation matches spec exactly. Catches missing requirements AND over-building. Won't trust implementer's report—reads actual code.

2. **Code quality review** - Only runs after spec compliance passes. Reviews for clean code, test coverage, maintainability.

This catches the common failure mode where code is well-written but doesn't match what was requested. Reviews are loops, not one-shot: if reviewer finds issues, implementer fixes them, then reviewer checks again.

Other subagent workflow improvements:
- Controller provides full task text to workers (not file references)
- Workers can ask clarifying questions before AND during work
- Self-review checklist before reporting completion
- Plan read once at start, extracted to TodoWrite

New prompt templates in `skills/subagent-driven-development/`:
- `implementer-prompt.md` - Includes self-review checklist, encourages questions
- `spec-reviewer-prompt.md` - Skeptical verification against requirements
- `code-quality-reviewer-prompt.md` - Standard code review

**Debugging techniques consolidated with tools**

`systematic-debugging` now bundles supporting techniques and tools:
- `root-cause-tracing.md` - Trace bugs backward through call stack
- `defense-in-depth.md` - Add validation at multiple layers
- `condition-based-waiting.md` - Replace arbitrary timeouts with condition polling
- `find-polluter.sh` - Bisection script to find which test creates pollution
- `condition-based-waiting-example.ts` - Complete implementation from real debugging session

**Testing anti-patterns reference**

`test-driven-development` now includes `testing-anti-patterns.md` covering:
- Testing mock behavior instead of real behavior
- Adding test-only methods to production classes
- Mocking without understanding dependencies
- Incomplete mocks that hide structural assumptions

**Skill test infrastructure**

Three new test frameworks for validating skill behavior:

`tests/skill-triggering/` - Validates skills trigger from naive prompts without explicit naming. Tests 6 skills to ensure descriptions alone are sufficient.

`tests/claude-code/` - Integration tests using `claude -p` for headless testing. Verifies skill usage via session transcript (JSONL) analysis. Includes `analyze-token-usage.py` for cost tracking.

`tests/subagent-driven-dev/` - End-to-end workflow validation with two complete test projects:
- `go-fractals/` - CLI tool with Sierpinski/Mandelbrot (10 tasks)
- `svelte-todo/` - CRUD app with localStorage and Playwright (12 tasks)

### Major Changes

**DOT flowcharts as executable specifications**

Rewrote key skills using DOT/GraphViz flowcharts as the authoritative process definition. Prose becomes supporting content.

**The Description Trap** (documented in `writing-skills`): Discovered that skill descriptions override flowchart content when descriptions contain workflow summaries. Claude follows the short description instead of reading the detailed flowchart. Fix: descriptions must be trigger-only ("Use when X") with no process details.

**Skill priority in using-spark**

When multiple skills apply, process skills (brainstorming, debugging) now explicitly come before implementation skills. "Build X" triggers brainstorming first, then domain skills.

**brainstorming trigger strengthened**

Description changed to imperative: "You MUST use this before any creative work—creating features, building components, adding functionality, or modifying behavior."

### Breaking Changes

**Skill consolidation** - Six standalone skills merged:
- `root-cause-tracing`, `defense-in-depth`, `condition-based-waiting` → bundled in `systematic-debugging/`
- `testing-skills-with-subagents` → bundled in `writing-skills/`
- `testing-anti-patterns` → bundled in `test-driven-development/`
- `sharing-skills` removed (obsolete)

### Other Improvements

- **render-graphs.js** - Tool to extract DOT diagrams from skills and render to SVG
- **Rationalizations table** in using-spark - Scannable format including new entries: "I need more context first", "Let me explore first", "This feels productive"
- **docs/testing.md** - Guide to testing skills with Claude Code integration tests

---

## v3.6.2 (2025-12-03)

### Fixed

- **Linux Compatibility**: Fixed polyglot hook wrapper (`run-hook.cmd`) to use POSIX-compliant syntax
  - Replaced bash-specific `${BASH_SOURCE[0]:-$0}` with standard `$0` on line 16
  - Resolves "Bad substitution" error on Ubuntu/Debian systems where `/bin/sh` is dash
  - Fixes #141

---

## v3.5.1 (2025-11-24)

### Changed

- **OpenCode Bootstrap Refactor**: Switched from `chat.message` hook to `session.created` event for bootstrap injection
  - Bootstrap now injects at session creation via `session.prompt()` with `noReply: true`
  - Explicitly tells the model that using-spark is already loaded to prevent redundant skill loading
  - Consolidated bootstrap content generation into shared `getBootstrapContent()` helper
  - Cleaner single-implementation approach (removed fallback pattern)

---

## v3.5.0 (2025-11-23)

### Added

- **OpenCode Support**: Native JavaScript plugin for OpenCode.ai
  - Custom tools: `use_skill` and `find_skills`
  - Message insertion pattern for skill persistence across context compaction
  - Automatic context injection via chat.message hook
  - Auto re-injection on session.compacted events
  - Three-tier skill priority: project > personal > spark
  - Project-local skills support (`.opencode/skills/`)
  - Shared core module (`lib/skills-core.js`) for code reuse with Codex
  - Automated test suite with proper isolation (`tests/opencode/`)
  - Platform-specific documentation (`docs/README.opencode.md`, `docs/README.codex.md`)

### Changed

- **Refactored Codex Implementation**: Now uses shared `lib/skills-core.js` ES module
  - Eliminates code duplication between Codex and OpenCode
  - Single source of truth for skill discovery and parsing
  - Codex successfully loads ES modules via Node.js interop

- **Improved Documentation**: Rewrote README to explain problem/solution clearly
  - Removed duplicate sections and conflicting information
  - Added complete workflow description (brainstorm → plan → execute → finish)
  - Simplified platform installation instructions
  - Emphasized skill-checking protocol over automatic activation claims

---

## v3.4.1 (2025-10-31)

### Improvements

- Optimized spark bootstrap to eliminate redundant skill execution. The `using-spark` skill content is now provided directly in session context, with clear guidance to use the Skill tool only for other skills. This reduces overhead and prevents the confusing loop where agents would execute `using-spark` manually despite already having the content from session start.

## v3.4.0 (2025-10-30)

### Improvements

- Simplified `brainstorming` skill to return to original conversational vision. Removed heavyweight 6-phase process with formal checklists in favor of natural dialogue: ask questions one at a time, then present design in 200-300 word sections with validation. Keeps documentation and implementation handoff features.

## v3.3.1 (2025-10-28)

### Improvements

- Updated `brainstorming` skill to require autonomous recon before questioning, encourage recommendation-driven decisions, and prevent agents from delegating prioritization back to humans.
- Applied writing clarity improvements to `brainstorming` skill following Strunk's "Elements of Style" principles (omitted needless words, converted negative to positive form, improved parallel construction).

### Bug Fixes

- Clarified `writing-skills` guidance so it points to the correct agent-specific personal skill directories (`~/.claude/skills` for Claude Code, `~/.codex/skills` for Codex).

## v3.3.0 (2025-10-28)

### New Features

**Experimental Codex Support**
- Added unified `spark-codex` script with bootstrap/use-skill/find-skills commands
- Cross-platform Node.js implementation (works on Windows, macOS, Linux)
- Namespaced skills: `spark:skill-name` for spark skills, `skill-name` for personal
- Personal skills override spark skills when names match
- Clean skill display: shows name/description without raw frontmatter
- Helpful context: shows supporting files directory for each skill
- Tool mapping for Codex: TodoWrite→update_plan, subagents→manual fallback, etc.
- Bootstrap integration with minimal AGENTS.md for automatic startup
- Complete installation guide and bootstrap instructions specific to Codex

**Key differences from Claude Code integration:**
- Single unified script instead of separate tools
- Tool substitution system for Codex-specific equivalents
- Simplified subagent handling (manual work instead of delegation)
- Updated terminology: "SPARK skills" instead of "Core skills"

### Files Added
- `.codex/INSTALL.md` - Installation guide for Codex users
- `.codex/spark-bootstrap.md` - Bootstrap instructions with Codex adaptations
- `.codex/spark-codex` - Unified Node.js executable with all functionality

**Note:** Codex support is experimental. The integration provides core spark functionality but may require refinement based on user feedback.

## v3.2.3 (2025-10-23)

### Improvements

**Updated using-spark skill to use Skill tool instead of Read tool**
- Changed skill invocation instructions from Read tool to Skill tool
- Updated description: "using Read tool" → "using Skill tool"
- Updated step 3: "Use the Read tool" → "Use the Skill tool to read and run"
- Updated rationalization list: "Read the current version" → "Run the current version"

The Skill tool is the proper mechanism for invoking skills in Claude Code. This update corrects the bootstrap instructions to guide agents toward the correct tool.

### Files Changed
- Updated: `skills/using-spark/SKILL.md` - Changed tool references from Read to Skill

## v3.2.2 (2025-10-21)

### Improvements

**Strengthened using-spark skill against agent rationalization**
- Added EXTREMELY-IMPORTANT block with absolute language about mandatory skill checking
  - "If even 1% chance a skill applies, you MUST read it"
  - "You do not have a choice. You cannot rationalize your way out."
- Added MANDATORY FIRST RESPONSE PROTOCOL checklist
  - 5-step process agents must complete before any response
  - Explicit "responding without this = failure" consequence
- Added Common Rationalizations section with 8 specific evasion patterns
  - "This is just a simple question" → WRONG
  - "I can check files quickly" → WRONG
  - "Let me gather information first" → WRONG
  - Plus 5 more common patterns observed in agent behavior

These changes address observed agent behavior where they rationalize around skill usage despite clear instructions. The forceful language and pre-emptive counter-arguments aim to make non-compliance harder.

### Files Changed
- Updated: `skills/using-spark/SKILL.md` - Added three layers of enforcement to prevent skill-skipping rationalization

## v3.2.1 (2025-10-20)

### New Features

**Code reviewer agent now included in plugin**
- Added `spark:code-reviewer` agent to plugin's `agents/` directory
- Agent provides systematic code review against plans and coding standards
- Previously required users to have personal agent configuration
- All skill references updated to use namespaced `spark:code-reviewer`
- Fixes #55

### Files Changed
- New: `agents/code-reviewer.md` - Agent definition with review checklist and output format
- Updated: `skills/requesting-code-review/SKILL.md` - References to `spark:code-reviewer`
- Updated: `skills/subagent-driven-development/SKILL.md` - References to `spark:code-reviewer`

## v3.2.0 (2025-10-18)

### New Features

**Design documentation in brainstorming workflow**
- Added Phase 4: Design Documentation to brainstorming skill
- Design documents now written to `docs/plans/YYYY-MM-DD-<topic>-design.md` before implementation
- Restores functionality from original brainstorming command that was lost during skill conversion
- Documents written before worktree setup and implementation planning
- Tested with subagent to verify compliance under time pressure

### Breaking Changes

**Skill reference namespace standardization**
- All internal skill references now use `spark:` namespace prefix
- Updated format: `spark:test-driven-development` (previously just `test-driven-development`)
- Affects all REQUIRED SUB-SKILL, RECOMMENDED SUB-SKILL, and REQUIRED BACKGROUND references
- Aligns with how skills are invoked using the Skill tool
- Files updated: brainstorming, executing-plans, subagent-driven-development, systematic-debugging, testing-skills-with-subagents, writing-plans, writing-skills

### Improvements

**Design vs implementation plan naming**
- Design documents use `-design.md` suffix to prevent filename collisions
- Implementation plans continue using existing `YYYY-MM-DD-<feature-name>.md` format
- Both stored in `docs/plans/` directory with clear naming distinction

## v3.1.1 (2025-10-17)

### Bug Fixes

- **Fixed command syntax in README** (#44) - Updated all command references to use correct namespaced syntax (`/spark:brainstorm` instead of `/brainstorm`). Plugin-provided commands are automatically namespaced by Claude Code to avoid conflicts between plugins.

## v3.1.0 (2025-10-17)

### Breaking Changes

**Skill names standardized to lowercase**
- All skill frontmatter `name:` fields now use lowercase kebab-case matching directory names
- Examples: `brainstorming`, `test-driven-development`, `using-git-worktrees`
- All skill announcements and cross-references updated to lowercase format
- This ensures consistent naming across directory names, frontmatter, and documentation

### New Features

**Enhanced brainstorming skill**
- Added Quick Reference table showing phases, activities, and tool usage
- Added copyable workflow checklist for tracking progress
- Added decision flowchart for when to revisit earlier phases
- Added comprehensive AskUserQuestion tool guidance with concrete examples
- Added "Question Patterns" section explaining when to use structured vs open-ended questions
- Restructured Key Principles as scannable table

**Anthropic best practices integration**
- Added `skills/writing-skills/anthropic-best-practices.md` - Official Anthropic skill authoring guide
- Referenced in writing-skills SKILL.md for comprehensive guidance
- Provides patterns for progressive disclosure, workflows, and evaluation

### Improvements

**Skill cross-reference clarity**
- All skill references now use explicit requirement markers:
  - `**REQUIRED BACKGROUND:**` - Prerequisites you must understand
  - `**REQUIRED SUB-SKILL:**` - Skills that must be used in workflow
  - `**Complementary skills:**` - Optional but helpful related skills
- Removed old path format (`skills/collaboration/X` → just `X`)
- Updated Integration sections with categorized relationships (Required vs Complementary)
- Updated cross-reference documentation with best practices

**Alignment with Anthropic best practices**
- Fixed description grammar and voice (fully third-person)
- Added Quick Reference tables for scanning
- Added workflow checklists Claude can copy and track
- Appropriate use of flowcharts for non-obvious decision points
- Improved scannable table formats
- All skills well under 500-line recommendation

### Bug Fixes

- **Re-added missing command redirects** - Restored `commands/brainstorm.md` and `commands/write-plan.md` that were accidentally removed in v3.0 migration
- Fixed `defense-in-depth` name mismatch (was `Defense-in-Depth-Validation`)
- Fixed `receiving-code-review` name mismatch (was `Code-Review-Reception`)
- Fixed `commands/brainstorm.md` reference to correct skill name
- Removed references to non-existent related skills

### Documentation

**writing-skills improvements**
- Updated cross-referencing guidance with explicit requirement markers
- Added reference to Anthropic's official best practices
- Improved examples showing proper skill reference format

## v3.0.1 (2025-10-16)

### Changes

We now use Anthropic's first-party skills system!

## v2.0.2 (2025-10-12)

### Bug Fixes

- **Fixed false warning when local skills repo is ahead of upstream** - The initialization script was incorrectly warning "New skills available from upstream" when the local repository had commits ahead of upstream. The logic now correctly distinguishes between three git states: local behind (should update), local ahead (no warning), and diverged (should warn).

## v2.0.1 (2025-10-12)

### Bug Fixes

- **Fixed session-start hook execution in plugin context** (#8, PR #9) - The hook was failing silently with "Plugin hook error" preventing skills context from loading. Fixed by:
  - Using `${BASH_SOURCE[0]:-$0}` fallback when BASH_SOURCE is unbound in Claude Code's execution context
  - Adding `|| true` to handle empty grep results gracefully when filtering status flags

---

# SPARK v2.0.0 Release Notes

## Overview

SPARK v2.0 makes skills more accessible, maintainable, and community-driven through a major architectural shift.

The headline change is **skills repository separation**: all skills, scripts, and documentation have moved from the plugin into a dedicated repository ([adityaaria/SPARK-skills](https://github.com/adityaaria/SPARK-skills)). This transforms spark from a monolithic plugin into a lightweight shim that manages a local clone of the skills repository. Skills auto-update on session start. Users fork and contribute improvements via standard git workflows. The skills library versions independently from the plugin.

Beyond infrastructure, this release adds nine new skills focused on problem-solving, research, and architecture. We rewrote the core **using-skills** documentation with imperative tone and clearer structure, making it easier for Claude to understand when and how to use skills. **find-skills** now outputs paths you can paste directly into the Read tool, eliminating friction in the skills discovery workflow.

Users experience seamless operation: the plugin handles cloning, forking, and updating automatically. Contributors find the new architecture makes improving and sharing skills trivial. This release lays the foundation for skills to evolve rapidly as a community resource.

## Breaking Changes

### Skills Repository Separation

**The biggest change:** Skills no longer live in the plugin. They've been moved to a separate repository at [adityaaria/SPARK-skills](https://github.com/adityaaria/SPARK-skills).

**What this means for you:**

- **First install:** Plugin automatically clones skills to `~/.config/spark/skills/`
- **Forking:** During setup, you'll be offered the option to fork the skills repo (if `gh` is installed)
- **Updates:** Skills auto-update on session start (fast-forward when possible)
- **Contributing:** Work on branches, commit locally, submit PRs to upstream
- **No more shadowing:** Old two-tier system (personal/core) replaced with single-repo branch workflow

**Migration:**

If you have an existing installation:
1. Your old `~/.config/spark/.git` will be backed up to `~/.config/spark/.git.bak`
2. Old skills will be backed up to `~/.config/spark/skills.bak`
3. Fresh clone of adityaaria/SPARK-skills will be created at `~/.config/spark/skills/`

### Removed Features

- **Personal spark overlay system** - Replaced with git branch workflow
- **setup-personal-spark hook** - Replaced by initialize-skills.sh

## New Features

### Skills Repository Infrastructure

**Automatic Clone & Setup** (`lib/initialize-skills.sh`)
- Clones adityaaria/SPARK-skills on first run
- Offers fork creation if GitHub CLI is installed
- Sets up upstream/origin remotes correctly
- Handles migration from old installation

**Auto-Update**
- Fetches from tracking remote on every session start
- Auto-merges with fast-forward when possible
- Notifies when manual sync needed (branch diverged)
- Uses pulling-updates-from-skills-repository skill for manual sync

### New Skills

**Problem-Solving Skills** (`skills/problem-solving/`)
- **collision-zone-thinking** - Force unrelated concepts together for emergent insights
- **inversion-exercise** - Flip assumptions to reveal hidden constraints
- **meta-pattern-recognition** - Spot universal principles across domains
- **scale-game** - Test at extremes to expose fundamental truths
- **simplification-cascades** - Find insights that eliminate multiple components
- **when-stuck** - Dispatch to right problem-solving technique

**Research Skills** (`skills/research/`)
- **tracing-knowledge-lineages** - Understand how ideas evolved over time

**Architecture Skills** (`skills/architecture/`)
- **preserving-productive-tensions** - Keep multiple valid approaches instead of forcing premature resolution

### Skills Improvements

**using-skills (formerly getting-started)**
- Renamed from getting-started to using-skills
- Complete rewrite with imperative tone (v4.0.0)
- Front-loaded critical rules
- Added "Why" explanations for all workflows
- Always includes /SKILL.md suffix in references
- Clearer distinction between rigid rules and flexible patterns

**writing-skills**
- Cross-referencing guidance moved from using-skills
- Added token efficiency section (word count targets)
- Improved CSO (Claude Search Optimization) guidance

**sharing-skills**
- Updated for new branch-and-PR workflow (v2.0.0)
- Removed personal/core split references

**pulling-updates-from-skills-repository** (new)
- Complete workflow for syncing with upstream
- Replaces old "updating-skills" skill

### Tools Improvements

**find-skills**
- Now outputs full paths with /SKILL.md suffix
- Makes paths directly usable with Read tool
- Updated help text

**skill-run**
- Moved from scripts/ to skills/using-skills/
- Improved documentation

### Plugin Infrastructure

**Session Start Hook**
- Now loads from skills repository location
- Shows full skills list at session start
- Prints skills location info
- Shows update status (updated successfully / behind upstream)
- Moved "skills behind" warning to end of output

**Environment Variables**
- `SPARK_SKILLS_ROOT` set to `~/.config/spark/skills`
- Used consistently throughout all paths

## Bug Fixes

- Fixed duplicate upstream remote addition when forking
- Fixed find-skills double "skills/" prefix in output
- Removed obsolete setup-personal-spark call from session-start
- Fixed path references throughout hooks and commands

## Documentation

### README
- Updated for new skills repository architecture
- Prominent link to spark-skills repo
- Updated auto-update description
- Fixed skill names and references
- Updated Meta skills list

### Testing Documentation
- Added comprehensive testing checklist (`docs/TESTING-CHECKLIST.md`)
- Created local marketplace config for testing
- Documented manual testing scenarios

## Technical Details

### File Changes

**Added:**
- `lib/initialize-skills.sh` - Skills repo initialization and auto-update
- `docs/TESTING-CHECKLIST.md` - Manual testing scenarios
- `.claude-plugin/marketplace.json` - Local testing config

**Removed:**
- `skills/` directory (82 files) - Now in adityaaria/SPARK-skills
- `scripts/` directory - Now in adityaaria/SPARK-skills/skills/using-skills/
- `hooks/setup-personal-spark.sh` - Obsolete

**Modified:**
- `hooks/session-start.sh` - Use skills from ~/.config/spark/skills
- `commands/brainstorm.md` - Updated paths to SPARK_SKILLS_ROOT
- `commands/write-plan.md` - Updated paths to SPARK_SKILLS_ROOT
- `commands/execute-plan.md` - Updated paths to SPARK_SKILLS_ROOT
- `README.md` - Complete rewrite for new architecture

### Commit History

This release includes:
- 20+ commits for skills repository separation
- PR #1: Amplifier-inspired problem-solving and research skills
- PR #2: Personal spark overlay system (later replaced)
- Multiple skill refinements and documentation improvements

## Upgrade Instructions

### Fresh Install

```bash
# In Claude Code
/plugin marketplace add adityaaria/SPARK-marketplace
/plugin install spark@spark-marketplace
```

The plugin handles everything automatically.

### Upgrading from v1.x

1. **Backup your personal skills** (if you have any):
   ```bash
   cp -r ~/.config/spark/skills ~/spark-skills-backup
   ```

2. **Update the plugin:**
   ```bash
   /plugin update spark
   ```

3. **On next session start:**
   - Old installation will be backed up automatically
   - Fresh skills repo will be cloned
   - If you have GitHub CLI, you'll be offered the option to fork

4. **Migrate personal skills** (if you had any):
   - Create a branch in your local skills repo
   - Copy your personal skills from backup
   - Commit and push to your fork
   - Consider contributing back via PR

## What's Next

### For Users

- Explore the new problem-solving skills
- Try the branch-based workflow for skill improvements
- Contribute skills back to the community

### For Contributors

- Skills repository is now at https://github.com/adityaaria/SPARK-skills
- Fork → Branch → PR workflow
- See skills/meta/writing-skills/SKILL.md for TDD approach to documentation

## Known Issues

None at this time.

## Credits

- Problem-solving skills inspired by Amplifier patterns
- Community contributions and feedback
- Extensive testing and iteration on skill effectiveness

---

**Full Changelog:** https://github.com/adityaaria/SPARK/compare/dd013f6...main
**Skills Repository:** https://github.com/adityaaria/SPARK-skills
**Issues:** https://github.com/adityaaria/SPARK/issues
