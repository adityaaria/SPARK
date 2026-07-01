#!/usr/bin/env bash
# Parity test suite: node bin/spark.js install vs bash bin/spark-install.sh
# Follows the [PASS]/[FAIL] convention of tests/native-installer/test-spark-install.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
NODE_CLI="$REPO_ROOT/bin/spark.js"
BASH_CLI="$REPO_ROOT/bin/spark-install.sh"

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

echo "Running CLI Wrapper Parity Tests..."
echo ""

# =============================================================================
# Test 1: Dry-Run Output Parity (Detected Agents & Target Paths)
# =============================================================================

echo "Dry-Run Parity Check"

test_home="$TEST_ROOT/home"
test_dir="$TEST_ROOT/workdir"
mkdir -p "$test_home/.claude" "$test_home/.cursor" "$test_dir"

out_node="$(cd "$test_dir" && HOME="$test_home" node "$NODE_CLI" install --dry-run 2>&1 || true)"
out_bash="$(cd "$test_dir" && HOME="$test_home" bash "$BASH_CLI" --dry-run 2>&1 || true)"

# 1a. Check detected agents match
agents_node="$(echo "$out_node" | grep "●" | sort)"
agents_bash="$(echo "$out_bash" | grep "●" | sort)"

if [ -n "$agents_node" ] && [ "$agents_node" = "$agents_bash" ]; then
    pass "Detected agents list is identical between node CLI and bash installer"
else
    fail "Detected agents list differs between node CLI and bash installer"
    echo "    Node: $agents_node"
    echo "    Bash: $agents_bash"
fi

# 1b. Check target install paths match
paths_node="$(echo "$out_node" | grep "Would install" | sort)"
paths_bash="$(echo "$out_bash" | grep "Would install" | sort)"

if [ -n "$paths_node" ] && [ "$paths_node" = "$paths_bash" ]; then
    pass "Target install paths are identical between node CLI and bash installer"
else
    fail "Target install paths differ between node CLI and bash installer"
    echo "    Node: $paths_node"
    echo "    Bash: $paths_bash"
fi

# 1c. Check summary lines match
summary_node="$(echo "$out_node" | grep -E "(SPARK version:|Commit:|Scope:|Skills:)" | sort)"
summary_bash="$(echo "$out_bash" | grep -E "(SPARK version:|Commit:|Scope:|Skills:)" | sort)"

if [ -n "$summary_node" ] && [ "$summary_node" = "$summary_bash" ]; then
    pass "Summary metrics are identical between node CLI and bash installer"
else
    fail "Summary metrics differ between node CLI and bash installer"
    echo "    Node: $summary_node"
    echo "    Bash: $summary_bash"
fi

# =============================================================================
# Test 2: Non-Dry-Run Parity (.spark-lock.json and Installed Files)
# =============================================================================

echo ""
echo "Non-Dry-Run Execution Parity"

dir_node="$TEST_ROOT/run_node"
dir_bash="$TEST_ROOT/run_bash"
mkdir -p "$dir_node" "$dir_bash"

# Execute real installs
(cd "$dir_node" && HOME="$test_home" node "$NODE_CLI" install >/dev/null 2>&1 || true)
(cd "$dir_bash" && HOME="$test_home" bash "$BASH_CLI" >/dev/null 2>&1 || true)

# 2a. Verify lock files created in both
if [ -f "$dir_node/.spark-lock.json" ] && [ -f "$dir_bash/.spark-lock.json" ]; then
    pass "Both Node CLI and Bash installer generated .spark-lock.json"
else
    fail "Missing .spark-lock.json in one or both install paths"
fi

# 2b. Verify lock file content parity (normalizing timestamps and run paths)
if [ -f "$dir_node/.spark-lock.json" ] && [ -f "$dir_bash/.spark-lock.json" ]; then
    norm_lock_node="$(sed -e "s|$dir_node|NORM_DIR|g" -e "s/\"installed_at\": \"[^\"]*\"/\"installed_at\": \"NORM_TIME\"/g" "$dir_node/.spark-lock.json")"
    norm_lock_bash="$(sed -e "s|$dir_bash|NORM_DIR|g" -e "s/\"installed_at\": \"[^\"]*\"/\"installed_at\": \"NORM_TIME\"/g" "$dir_bash/.spark-lock.json")"

    if [ "$norm_lock_node" = "$norm_lock_bash" ]; then
        pass ".spark-lock.json content is identical (ignoring path & timestamp differences)"
    else
        fail ".spark-lock.json content differs between Node CLI and Bash installer"
        echo "=== Node Lock Normalized ==="
        echo "$norm_lock_node"
        echo "=== Bash Lock Normalized ==="
        echo "$norm_lock_bash"
    fi
fi

# 2c. Verify directory structure parity
if [ -d "$dir_node/.claude/skills" ] && [ -d "$dir_bash/.claude/skills" ]; then
    skills_node="$(ls "$dir_node/.claude/skills" | sort)"
    skills_bash="$(ls "$dir_bash/.claude/skills" | sort)"
    if [ "$skills_node" = "$skills_bash" ]; then
        pass "Installed skills structure is identical"
    else
        fail "Installed skills structure differs"
    fi
else
    fail ".claude/skills directory missing after install"
fi

# =============================================================================
# Test 3: Exit Code Parity
# =============================================================================

echo ""
echo "Exit Code Parity"

# Test invalid flag
set +e
(cd "$dir_node" && node "$NODE_CLI" install --invalid-flag >/dev/null 2>&1)
exit_node=$?
(cd "$dir_bash" && bash "$BASH_CLI" --invalid-flag >/dev/null 2>&1)
exit_bash=$?
set -e

if [ $exit_node -eq $exit_bash ] && [ $exit_node -ne 0 ]; then
    pass "Exit code parity on invalid argument (exit code: $exit_node)"
else
    fail "Exit code mismatch on invalid argument (Node: $exit_node, Bash: $exit_bash)"
fi

# =============================================================================
# Result
# =============================================================================

echo ""
echo "---"
TOTAL=$((PASSES + FAILURES))
echo "Results: $PASSES passed, $FAILURES failed (out of $TOTAL tests)"

if [ "$FAILURES" -gt 0 ]; then
    echo "STATUS: FAILED ($FAILURES failure(s))"
    exit 1
fi

echo "STATUS: PASSED"
