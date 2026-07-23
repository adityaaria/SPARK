#!/usr/bin/env bash
# Maintenance test suite for native install/update/uninstall scripts.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
INSTALLER="$REPO_ROOT/bin/spark-install.sh"
UPDATER="$REPO_ROOT/bin/spark-update.sh"
UNINSTALLER="$REPO_ROOT/bin/spark-uninstall.sh"

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

configure_git_identity() {
    local repo="$1"
    git -C "$repo" config user.name "Test Bot"
    git -C "$repo" config user.email "test@example.com"
}

assert_json_parseable() {
    local path="$1"
    local description="$2"

    if node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" "$path" >/dev/null 2>&1; then
        pass "$description"
    else
        fail "$description"
        echo "    invalid JSON in $path"
        sed -n '1,160p' "$path" | sed 's/^/      /'
    fi
}

assert_contains() {
    local haystack="$1"
    local needle="$2"
    local description="$3"

    if printf '%s' "$haystack" | grep -Fq -- "$needle"; then
        pass "$description"
    else
        fail "$description"
        echo "    expected to find: $needle"
        printf '%s\n' "$haystack" | sed 's/^/      /'
    fi
}

assert_not_contains() {
    local haystack="$1"
    local needle="$2"
    local description="$3"

    if printf '%s' "$haystack" | grep -Fq -- "$needle"; then
        fail "$description"
        echo "    did not expect to find: $needle"
        printf '%s\n' "$haystack" | sed 's/^/      /'
    else
        pass "$description"
    fi
}

echo "Native installer maintenance tests"
echo ""

# =============================================================================
# Test 1: Partial uninstall keeps lock file valid JSON
# =============================================================================

echo "Partial uninstall lockfile integrity"

partial_home="$TEST_ROOT/partial-home"
partial_work="$TEST_ROOT/partial-work"
mkdir -p "$partial_home/.claude" "$partial_home/.cursor" "$partial_work"

(
    cd "$partial_work"
    HOME="$partial_home" bash "$INSTALLER" --agent=claude-code,cursor --yes >/dev/null 2>&1
    HOME="$partial_home" bash "$UNINSTALLER" --agent=cursor --yes >/dev/null 2>&1
)

partial_lock="$partial_work/.spark-lock.json"
if [ -f "$partial_lock" ]; then
    pass "partial uninstall leaves lock file on disk when one agent remains"
    assert_json_parseable "$partial_lock" "partial uninstall keeps lock file parseable"

    parsed_lock="$(cat "$partial_lock")"
    assert_contains "$parsed_lock" "\"claude-code\"" "remaining agent stays recorded in lock file"
    assert_not_contains "$parsed_lock" "\"cursor\"" "removed agent is deleted from lock file"
else
    fail "partial uninstall leaves lock file on disk when one agent remains"
fi

# =============================================================================
# Test 2: install --update must fail clearly if updater script is missing
# =============================================================================

echo ""
echo "Install gateway update fallback"

gateway_repo="$TEST_ROOT/gateway-repo"
gateway_home="$TEST_ROOT/gateway-home"
gateway_project="$TEST_ROOT/gateway-project"
make_repo_copy "$gateway_repo"
rm -f "$gateway_repo/bin/spark-update.sh"
mkdir -p "$gateway_home/.claude" "$gateway_project"

set +e
gateway_output="$(
    cd "$gateway_project" &&
    HOME="$gateway_home" bash "$gateway_repo/bin/spark-install.sh" --update --agent=claude-code --yes 2>&1
)"
gateway_exit=$?
set -e

if [ "$gateway_exit" -ne 0 ]; then
    pass "install --update exits non-zero when updater is unavailable"
else
    fail "install --update exits non-zero when updater is unavailable"
    printf '%s\n' "$gateway_output" | sed 's/^/      /'
fi

assert_contains "$gateway_output" "spark-update.sh" "install --update mentions missing updater script"

if [ ! -f "$gateway_project/.spark-lock.json" ]; then
    pass "install --update does not fall back to fresh install when updater is missing"
else
    fail "install --update does not fall back to fresh install when updater is missing"
fi

# =============================================================================
# Test 3: git-backed update fetches the latest commit before reinstalling
# =============================================================================

echo ""
echo "Git-backed update refresh"

origin_repo="$TEST_ROOT/origin.git"
seed_repo="$TEST_ROOT/seed"
installed_repo="$TEST_ROOT/installed"
update_home="$TEST_ROOT/update-home"
update_project="$TEST_ROOT/update-project"

git init -q --bare "$origin_repo"
make_repo_copy "$seed_repo"
git -C "$seed_repo" init -q -b main
configure_git_identity "$seed_repo"
git -C "$seed_repo" add . >/dev/null 2>&1
git -C "$seed_repo" commit -q -m "base"
git -C "$seed_repo" remote add origin "$origin_repo"
git -C "$seed_repo" push -q origin main
git --git-dir="$origin_repo" symbolic-ref HEAD refs/heads/main

git clone -q "$origin_repo" "$installed_repo"
old_commit="$(git -C "$installed_repo" rev-parse HEAD)"

mkdir -p "$update_home/.claude" "$update_project"
(
    cd "$update_project"
    HOME="$update_home" bash "$installed_repo/bin/spark-install.sh" --agent=claude-code --yes >/dev/null 2>&1
)

perl -0pi -e 's/"version": "([^"]+)"/"version": "$1-updatetest"/' "$seed_repo/package.json"
git -C "$seed_repo" add package.json
git -C "$seed_repo" commit -q -m "bump version"
git -C "$seed_repo" push -q origin main
new_commit="$(git -C "$seed_repo" rev-parse HEAD)"

set +e
update_output="$(
    cd "$update_project" &&
    HOME="$update_home" bash "$installed_repo/bin/spark-update.sh" --yes 2>&1
)"
update_exit=$?
set -e
after_commit="$(git -C "$installed_repo" rev-parse HEAD)"

if [ "$update_exit" -eq 0 ]; then
    pass "git-backed update command exits successfully"
else
    fail "git-backed update command exits successfully"
    printf '%s\n' "$update_output" | sed 's/^/      /'
fi

if [ "$after_commit" = "$new_commit" ] && [ "$after_commit" != "$old_commit" ]; then
    pass "git-backed update advances installed repo to latest remote commit"
else
    fail "git-backed update advances installed repo to latest remote commit"
    echo "    old:   $old_commit"
    echo "    new:   $new_commit"
    echo "    after: $after_commit"
    printf '%s\n' "$update_output" | sed 's/^/      /'
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
