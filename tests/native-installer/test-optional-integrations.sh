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
assert_file_contains "$REPO_ROOT/integrations/rudis/skills/rudis-adapter/references/adapter-contract.md" "Rudis Task Intake" "Rudis adapter defines task intake output"
assert_file_contains "$REPO_ROOT/integrations/rudis/skills/rudis-adapter/references/adapter-contract.md" "TaskID.*Parallel.*Story.*File Paths" "Rudis adapter extracts task execution fields"
assert_file_contains "$REPO_ROOT/integrations/rudis/skills/rudis-adapter/references/adapter-contract.md" "Example Rudis tasks input" "Rudis adapter documents example tasks input"
assert_file_contains "$REPO_ROOT/integrations/rudis/skills/rudis-adapter/references/adapter-contract.md" "Example Rudis Task Intake output" "Rudis adapter documents example task intake output"
assert_file_contains "$REPO_ROOT/integrations/rudis/skills/rudis-adapter/SKILL.md" "writing-plans" "Rudis adapter hands task context to writing-plans"
assert_file_contains "$REPO_ROOT/docs/integrations/rudis.md" "Continue my Rudis tasks with SPARK" "Rudis docs include simple user-facing planning prompt"

RUDIS_FIXTURE="$REPO_ROOT/tests/fixtures/rudis-project"
for fixture_file in \
    ".spark/integrations/rudis.json" \
    ".rudis/memory/constitution.md" \
    "specs/001-example/spec.md" \
    "specs/001-example/plan.md" \
    "specs/001-example/tasks.md"; do
    if [ -f "$RUDIS_FIXTURE/$fixture_file" ]; then
        pass "Rudis fixture includes $fixture_file"
    else
        fail "Rudis fixture includes $fixture_file"
    fi
done

for skill_name in project-scanner template-generator project-onboarding knowledge-rules; do
    assert_file_not_contains "$REPO_ROOT/skills/$skill_name/SKILL.md" "\\.rudis|Rudis|rudis" "$skill_name core skill stays Rudis-neutral"
done

assert_file_contains "$REPO_ROOT/skills/using-spark/references/optional-integrations.md" "optional external knowledge adapter" "using-spark has neutral optional integration routing"
assert_file_not_contains "$REPO_ROOT/skills/using-spark/SKILL.md" "\\.rudis|Rudis|rudis" "using-spark bootstrap stays Rudis-neutral"
assert_file_contains "$REPO_ROOT/skills/writing-plans/SKILL.md" "external task intake" "writing-plans consumes neutral external task intake"
assert_file_contains "$REPO_ROOT/skills/writing-plans/SKILL.md" "source task IDs" "writing-plans preserves adapter traceability"
assert_file_not_contains "$REPO_ROOT/skills/writing-plans/SKILL.md" "\\.rudis|Rudis|rudis|specs/<feature>/tasks\\.md" "writing-plans stays external-adapter neutral"

echo ""
echo "Test summary: $PASSES passed, $FAILURES failed"

if [ "$FAILURES" -gt 0 ]; then
    exit 1
fi
