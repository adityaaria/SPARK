#!/usr/bin/env bash
# Validates optional integration contracts stay isolated from core SPARK skills.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

FAILURES=0
PASSES=0

pass() {
    echo "  [PASS] $1"
    PASSES=$((PASSES + 1))
}

fail() {
    echo "  [FAIL] $1"
    FAILURES=$((FAILURES + 1))
}

assert_file_contains() {
    local file="$1"
    local pattern="$2"
    local label="$3"

    if [ ! -f "$file" ]; then
        fail "$label: missing file $file"
        return
    fi

    if grep -Eq "$pattern" "$file"; then
        pass "$label"
    else
        fail "$label"
    fi
}

assert_file_not_contains() {
    local file="$1"
    local pattern="$2"
    local label="$3"

    if [ ! -f "$file" ]; then
        fail "$label: missing file $file"
        return
    fi

    if grep -Eq "$pattern" "$file"; then
        fail "$label"
    else
        pass "$label"
    fi
}

echo "Optional integration isolation"

assert_file_contains "$REPO_ROOT/docs/integrations/rudis.md" "\\.spark/integrations/rudis\\.json" "Rudis docs define explicit opt-in marker"
assert_file_contains "$REPO_ROOT/docs/integrations/rudis.md" "\\.rudis/memory/constitution\\.md" "Rudis docs define constitution input"
assert_file_contains "$REPO_ROOT/docs/integrations/rudis.md" "read-only" "Rudis docs require read-only consumption"

if [ -e "$REPO_ROOT/skills/rudis-adapter" ]; then
    fail "Rudis adapter is not installed as a core skill"
else
    pass "Rudis adapter is not installed as a core skill"
fi

assert_file_contains "$REPO_ROOT/integrations/rudis/skills/rudis-adapter/SKILL.md" "Use when .*Rudis" "Rudis adapter is isolated in optional integration skills"
assert_file_contains "$REPO_ROOT/integrations/rudis/skills/rudis-adapter/SKILL.md" 'MUST read `references/adapter-contract.md`' "Rudis adapter requires its contract reference"
assert_file_contains "$REPO_ROOT/integrations/rudis/skills/rudis-adapter/references/adapter-contract.md" "External Knowledge Adapter Context" "Rudis adapter outputs neutral context"

for skill_name in project-scanner template-generator project-onboarding knowledge-rules; do
    assert_file_not_contains "$REPO_ROOT/skills/$skill_name/SKILL.md" "\\.rudis|Rudis|rudis" "$skill_name core skill stays Rudis-neutral"
done

assert_file_contains "$REPO_ROOT/skills/using-spark/references/optional-integrations.md" "optional external knowledge adapter" "using-spark has neutral optional integration routing"
assert_file_not_contains "$REPO_ROOT/skills/using-spark/SKILL.md" "\\.rudis|Rudis|rudis" "using-spark bootstrap stays Rudis-neutral"

echo ""
echo "Test summary: $PASSES passed, $FAILURES failed"

if [ "$FAILURES" -gt 0 ]; then
    exit 1
fi
