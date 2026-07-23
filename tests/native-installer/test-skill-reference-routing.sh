#!/usr/bin/env bash
# Validates that router-style skills make their split references mandatory.

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

assert_required_reference() {
    local skill_name="$1"
    local reference_file="$2"
    local skill_md="$REPO_ROOT/skills/$skill_name/SKILL.md"
    local rel_path="references/$(basename "$reference_file")"

    if [ ! -f "$reference_file" ]; then
        fail "$skill_name: missing reference file $rel_path"
        return
    fi

    if grep -Eq "MUST read \`$rel_path\`|Always read \`$rel_path\`" "$skill_md"; then
        pass "$skill_name: requires $rel_path"
    else
        fail "$skill_name: does not require $rel_path"
    fi
}

echo "Skill reference routing"

for skill_name in project-scanner template-generator project-onboarding; do
    skill_md="$REPO_ROOT/skills/$skill_name/SKILL.md"
    references_dir="$REPO_ROOT/skills/$skill_name/references"

    if [ ! -f "$skill_md" ]; then
        fail "$skill_name: missing SKILL.md"
        continue
    fi

    if [ ! -d "$references_dir" ]; then
        fail "$skill_name: missing references directory"
        continue
    fi

    if grep -q "Do not skip required references" "$skill_md"; then
        pass "$skill_name: has no-skip guardrail"
    else
        fail "$skill_name: missing no-skip guardrail"
    fi

    for reference_file in "$references_dir"/*.md; do
        assert_required_reference "$skill_name" "$reference_file"
    done
done

echo ""
echo "Test summary: $PASSES passed, $FAILURES failed"

if [ "$FAILURES" -gt 0 ]; then
    exit 1
fi
