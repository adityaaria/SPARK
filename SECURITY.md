# Security Policy

## Supported Versions

Security fixes are maintained for the latest published SPARK release. Users should update to the latest version before reporting an issue unless the vulnerability prevents updating.

## Reporting

Report suspected vulnerabilities privately to the project maintainer before publishing details. Include:

- affected version or commit
- installation method
- impacted harness or agent
- reproduction steps
- expected and actual behavior

Do not include real credentials, API keys, tokens, private repository contents, or customer data in reports.

## Secret Handling

SPARK must not require secrets in tracked files. Local `.env` files, eval credentials, API keys, npm tokens, Telegram bot tokens, and agent credentials must stay outside git and outside published packages.

Installer, update, and uninstall scripts should avoid printing secret values. Tests may use fake tokens only.

## Local Server Surfaces

SPARK local helper servers should bind to loopback by default, use per-session tokens or equivalent local authorization, and fail closed when explicit tokens make automatic fallback unsafe.

## Supply Chain Expectations

Before publishing, maintainers should run the release checklist, verify package contents with `npm pack --dry-run`, prefer signed tags, and prefer npm provenance or equivalent release attestation.
