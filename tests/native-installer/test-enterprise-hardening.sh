#!/usr/bin/env bash
# Enterprise hardening checks for release gates, version governance, ownership,
# security documentation, and rollback-safe updates.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
INSTALLER="$REPO_ROOT/bin/spark-install.sh"
UPDATER="$REPO_ROOT/bin/spark-update.sh"

FAILURES=0
PASSES=0
TEST_ROOT="$(mktemp -d)"

cleanup() {
    rm -rf "$TEST_ROOT"
}
trap cleanup EXIT

pass() {
    echo "  [PASS] $1"
    PASSES=$((PASSES + 1))
}

fail() {
    echo "  [FAIL] $1"
    FAILURES=$((FAILURES + 1))
}

assert_file_contains() {
    local path="$1"
    local pattern="$2"
    local description="$3"

    if [ -f "$path" ] && grep -Eq "$pattern" "$path"; then
        pass "$description"
    else
        fail "$description"
    fi
}

json_field() {
    node -e "const data=require('fs').readFileSync(process.argv[1],'utf8'); const obj=JSON.parse(data); console.log(process.argv[2].split('.').reduce((v,k)=>v && v[k], obj) ?? '')" "$1" "$2"
}

make_repo_copy() {
    local destination="$1"
    mkdir -p "$destination"
    (
        cd "$REPO_ROOT"
        tar --exclude=.git -cf - .
    ) | (
        cd "$destination"
        tar -xf -
    )
}

echo "Enterprise hardening checks"

# =============================================================================
# CI gate
# =============================================================================

echo ""
echo "CI gate"

ci_file="$REPO_ROOT/.github/workflows/ci.yml"
assert_file_contains "$ci_file" "npm test" "CI runs npm test"
assert_file_contains "$ci_file" "test-lint-shell\\.sh|lint-shell\\.sh" "CI runs shell lint coverage"
assert_file_contains "$ci_file" "test-enterprise-hardening\\.sh" "CI runs enterprise hardening checks"
assert_file_contains "$ci_file" "npm pack --dry-run" "CI validates package contents with npm pack dry-run"

# =============================================================================
# Version governance
# =============================================================================

echo ""
echo "Version governance"

package_version="$(json_field "$REPO_ROOT/package.json" "version")"
version_mismatch=false
for manifest in \
    "$REPO_ROOT/.claude-plugin/plugin.json" \
    "$REPO_ROOT/.codex-plugin/plugin.json" \
    "$REPO_ROOT/.cursor-plugin/plugin.json" \
    "$REPO_ROOT/.kimi-plugin/plugin.json" \
    "$REPO_ROOT/gemini-extension.json"; do
    manifest_version="$(json_field "$manifest" "version")"
    if [ "$manifest_version" != "$package_version" ]; then
        version_mismatch=true
        fail "$(basename "$(dirname "$manifest")")/$(basename "$manifest") version matches package.json"
    else
        pass "$(basename "$(dirname "$manifest")")/$(basename "$manifest") version matches package.json"
    fi
done

if ! $version_mismatch; then
    pass "all public manifests use package.json version $package_version"
fi

if grep -R 'VERSION="6\.1\.0"' "$REPO_ROOT/bin" >/dev/null 2>&1; then
    fail "shell scripts do not carry stale fallback version 6.1.0"
else
    pass "shell scripts do not carry stale fallback version 6.1.0"
fi

# =============================================================================
# Release and security governance
# =============================================================================

echo ""
echo "Release and security governance"

assert_file_contains "$REPO_ROOT/docs/release-checklist.md" "npm test" "release checklist requires npm test"
assert_file_contains "$REPO_ROOT/docs/release-checklist.md" "npm pack --dry-run" "release checklist requires package dry-run"
assert_file_contains "$REPO_ROOT/docs/release-checklist.md" "provenance|attestation|signed" "release checklist covers provenance or signing"
assert_file_contains "$REPO_ROOT/SECURITY.md" "Responsible Disclosure|Reporting" "SECURITY.md documents vulnerability reporting"
assert_file_contains "$REPO_ROOT/SECURITY.md" "Secret|secret" "SECURITY.md documents secret handling"
assert_file_contains "$REPO_ROOT/SECURITY.md" "Supported Versions" "SECURITY.md documents supported versions"

# =============================================================================
# Managed ownership marker
# =============================================================================

echo ""
echo "Managed ownership marker"

marker_dir="$TEST_ROOT/marker-project"
marker_home="$TEST_ROOT/marker-home"
mkdir -p "$marker_dir" "$marker_home/.claude"

(
    cd "$marker_dir"
    HOME="$marker_home" bash "$INSTALLER" --agent=claude-code --yes >/dev/null 2>&1
)

marker_path="$marker_dir/.claude/.spark-managed.json"
if [ -f "$marker_path" ]; then
    pass "installer writes per-agent .spark-managed.json"
    for field in "version" "installed_at" "scope" "agent" "managed_paths"; do
        value="$(json_field "$marker_path" "$field")"
        if [ -n "$value" ]; then
            pass "managed marker contains $field"
        else
            fail "managed marker contains $field"
        fi
    done
    if grep -q "$marker_dir/.claude-code-plugin/plugin.json" "$marker_path"; then
        pass "managed marker records plugin manifest path"
    else
        fail "managed marker records plugin manifest path"
    fi
else
    fail "installer writes per-agent .spark-managed.json"
fi

# =============================================================================
# Rollback-safe update
# =============================================================================

echo ""
echo "Rollback-safe update"

rollback_repo="$TEST_ROOT/rollback-repo"
rollback_project="$TEST_ROOT/rollback-project"
rollback_home="$TEST_ROOT/rollback-home"
make_repo_copy "$rollback_repo"
mkdir -p "$rollback_project" "$rollback_home/.claude"

(
    cd "$rollback_project"
    HOME="$rollback_home" bash "$rollback_repo/bin/spark-install.sh" --agent=claude-code --yes >/dev/null 2>&1
)

old_skill="$rollback_project/.claude/skills/using-spark/SKILL.md"
old_marker="$rollback_project/.claude/.spark-managed.json"
old_lock="$rollback_project/.spark-lock.json"

if [ -f "$old_skill" ] && [ -f "$old_marker" ] && [ -f "$old_lock" ]; then
    pass "rollback fixture installed baseline"
else
    fail "rollback fixture installed baseline"
fi

mv "$rollback_repo/bin/spark-install.sh" "$rollback_repo/bin/spark-install.real.sh"
cat > "$rollback_repo/bin/spark-install.sh" <<'EOF'
#!/usr/bin/env bash
echo "simulated install failure" >&2
exit 42
EOF
chmod +x "$rollback_repo/bin/spark-install.sh"

set +e
rollback_output="$(
    cd "$rollback_project" &&
    HOME="$rollback_home" bash "$rollback_repo/bin/spark-update.sh" --yes --force 2>&1
)"
rollback_exit=$?
set -e

if [ "$rollback_exit" -ne 0 ]; then
    pass "failed update exits non-zero"
else
    fail "failed update exits non-zero"
fi

if [ -f "$old_skill" ] && [ -f "$old_marker" ] && [ -f "$old_lock" ]; then
    pass "failed update restores previous skills, marker, and lockfile"
else
    fail "failed update restores previous skills, marker, and lockfile"
    printf '%s\n' "$rollback_output" | sed 's/^/      /'
fi

echo ""
echo "---"
TOTAL=$((PASSES + FAILURES))
echo "Results: $PASSES passed, $FAILURES failed (out of $TOTAL tests)"

if [ "$FAILURES" -gt 0 ]; then
    echo "STATUS: FAILED ($FAILURES failure(s))"
    exit 1
fi

echo "STATUS: PASSED"
