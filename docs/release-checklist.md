# Release Checklist

Use this checklist before publishing SPARK through npm, plugin marketplaces, or a tagged GitHub release.

## Required Gates

- Run `npm test`.
- Run `bash tests/shell-lint/test-lint-shell.sh`.
- Run `bash tests/native-installer/test-enterprise-hardening.sh`.
- Run `npm pack --dry-run` and confirm expected skills, hooks, manifests, assets, and reference files are included.
- Confirm `package.json`, plugin manifests, and `gemini-extension.json` use the same version.
- Confirm `RELEASE-NOTES.md` describes user-visible changes and upgrade risks.

## Supply Chain

- Publish from a clean git worktree.
- Prefer signed tags for released versions.
- Prefer npm provenance or equivalent attestation when publishing from CI.
- Keep release artifacts reproducible from the tagged commit.
- Do not publish local `.env`, eval result, worktree, or private journal content.

## Human Review

- Review the complete diff before release.
- Verify installer, update, and uninstall behavior on at least one project-scope install.
- Verify rollback behavior for a failed update before publishing installer changes.
