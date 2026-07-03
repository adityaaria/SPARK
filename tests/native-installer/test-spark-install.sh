#!/usr/bin/env bash
# Test suite for bin/spark-install.sh
# Follows the same [PASS]/[FAIL] convention as tests/hooks/test-session-start.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
INSTALLER="$REPO_ROOT/bin/spark-install.sh"
PACKAGE_JSON="$REPO_ROOT/package.json"

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

read_package_version() {
    grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "$PACKAGE_JSON" | head -1 | grep -o '"[^"]*"$' | tr -d '"'
}

# =============================================================================
# Test 1: Skill frontmatter validation
# =============================================================================

echo "Skill frontmatter validation"

for skill_dir in "$REPO_ROOT"/skills/*/; do
    [ ! -d "$skill_dir" ] && continue
    skill_name="$(basename "$skill_dir")"
    skill_md="$skill_dir/SKILL.md"

    # Must have SKILL.md
    if [ ! -f "$skill_md" ]; then
        fail "$skill_name: missing SKILL.md"
        continue
    fi

    # Must have valid frontmatter with name: and description:
    has_name=false
    has_desc=false
    in_frontmatter=false
    has_opening=false
    has_closing=false

    while IFS= read -r line; do
        if [ "$line" = "---" ]; then
            if $in_frontmatter; then
                has_closing=true
                break
            else
                in_frontmatter=true
                has_opening=true
                continue
            fi
        fi
        if $in_frontmatter; then
            case "$line" in
                name:*) has_name=true ;;
                description:*) has_desc=true ;;
            esac
        fi
    done < "$skill_md"

    if ! $has_opening; then
        fail "$skill_name: SKILL.md missing opening '---' frontmatter delimiter"
        continue
    fi

    if ! $has_closing; then
        fail "$skill_name: SKILL.md missing closing '---' frontmatter delimiter"
        continue
    fi

    if ! $has_name; then
        fail "$skill_name: SKILL.md frontmatter missing 'name:' field"
        continue
    fi

    if ! $has_desc; then
        fail "$skill_name: SKILL.md frontmatter missing 'description:' field"
        continue
    fi

    pass "$skill_name: valid SKILL.md frontmatter"
done

# =============================================================================
# Test 2: Hook consistency — manifests reference existing hook files
# =============================================================================

echo ""
echo "Hook consistency checks"

# Claude: hooks.json references session-start via run-hook.cmd
if [ -f "$REPO_ROOT/hooks/hooks.json" ]; then
    if [ -f "$REPO_ROOT/hooks/run-hook.cmd" ] && [ -f "$REPO_ROOT/hooks/session-start" ]; then
        pass "Claude hooks: hooks.json + run-hook.cmd + session-start all exist"
    else
        fail "Claude hooks: hooks.json exists but run-hook.cmd or session-start missing"
    fi
else
    fail "Claude hooks: hooks.json not found"
fi

# Codex: hooks-codex.json references session-start-codex via run-hook.cmd
if [ -f "$REPO_ROOT/hooks/hooks-codex.json" ]; then
    if [ -f "$REPO_ROOT/hooks/run-hook.cmd" ] && [ -f "$REPO_ROOT/hooks/session-start-codex" ]; then
        pass "Codex hooks: hooks-codex.json + run-hook.cmd + session-start-codex all exist"
    else
        fail "Codex hooks: hooks-codex.json exists but run-hook.cmd or session-start-codex missing"
    fi
else
    fail "Codex hooks: hooks-codex.json not found"
fi

# Cursor: hooks-cursor.json references session-start via run-hook.cmd
if [ -f "$REPO_ROOT/hooks/hooks-cursor.json" ]; then
    if [ -f "$REPO_ROOT/hooks/run-hook.cmd" ] && [ -f "$REPO_ROOT/hooks/session-start" ]; then
        pass "Cursor hooks: hooks-cursor.json + run-hook.cmd + session-start all exist"
    else
        fail "Cursor hooks: hooks-cursor.json exists but run-hook.cmd or session-start missing"
    fi
else
    fail "Cursor hooks: hooks-cursor.json not found"
fi

# Verify hook scripts reference using-spark skill
for hook_script in "$REPO_ROOT/hooks/session-start" "$REPO_ROOT/hooks/session-start-codex"; do
    hook_name="$(basename "$hook_script")"
    if [ -f "$hook_script" ]; then
        if grep -q "using-spark" "$hook_script"; then
            pass "$hook_name references using-spark skill"
        else
            fail "$hook_name does not reference using-spark skill"
        fi
    fi
done

# Verify plugin manifests exist for each agent plugin directory
for plugin_dir in "$REPO_ROOT"/.{claude,codex,cursor,kimi}-plugin; do
    [ ! -d "$plugin_dir" ] && continue
    plugin_name="$(basename "$plugin_dir")"
    if [ -f "$plugin_dir/plugin.json" ]; then
        pass "$plugin_name: plugin.json exists"
    else
        fail "$plugin_name: plugin.json missing"
    fi
done

# Verify hooks referenced in codex plugin manifest
if [ -f "$REPO_ROOT/.codex-plugin/plugin.json" ]; then
    hooks_ref="$(grep -o '"hooks"[[:space:]]*:[[:space:]]*"[^"]*"' "$REPO_ROOT/.codex-plugin/plugin.json" | grep -o '"[^"]*"$' | tr -d '"' || true)"
    if [ -n "$hooks_ref" ]; then
        # hooks_ref is relative to plugin root, e.g. "./hooks/hooks-codex.json"
        hooks_path="$REPO_ROOT/${hooks_ref#./}"
        if [ -f "$hooks_path" ]; then
            pass "Codex plugin manifest hooks reference ($hooks_ref) exists"
        else
            fail "Codex plugin manifest hooks reference ($hooks_ref) not found at $hooks_path"
        fi
    fi
fi

# Verify hooks referenced in cursor plugin manifest
if [ -f "$REPO_ROOT/.cursor-plugin/plugin.json" ]; then
    hooks_ref="$(grep -o '"hooks"[[:space:]]*:[[:space:]]*"[^"]*"' "$REPO_ROOT/.cursor-plugin/plugin.json" | grep -o '"[^"]*"$' | tr -d '"' || true)"
    if [ -n "$hooks_ref" ]; then
        hooks_path="$REPO_ROOT/${hooks_ref#./}"
        if [ -f "$hooks_path" ]; then
            pass "Cursor plugin manifest hooks reference ($hooks_ref) exists"
        else
            fail "Cursor plugin manifest hooks reference ($hooks_ref) not found at $hooks_path"
        fi
    fi
fi

# =============================================================================
# Test 3: Installer --help exits successfully
# =============================================================================

echo ""
echo "Installer basic functionality"

if bash "$INSTALLER" --help >/dev/null 2>&1; then
    pass "spark-install.sh --help exits with code 0"
else
    fail "spark-install.sh --help exited with non-zero code"
fi

# Verify help output contains expected content
help_output="$(bash "$INSTALLER" --help 2>&1)"
if echo "$help_output" | grep -q "SPARK Native Installer"; then
    pass "Help output contains 'SPARK Native Installer'"
else
    fail "Help output missing 'SPARK Native Installer'"
fi

if echo "$help_output" | grep -q "\-\-global"; then
    pass "Help output documents --global flag"
else
    fail "Help output missing --global flag documentation"
fi

# =============================================================================
# Test 4: Project-scope install auto-updates .gitignore
# =============================================================================

echo ""
echo "Project .gitignore automation"

gitignore_dir="$TEST_ROOT/gitignore-test"
mkdir -p "$gitignore_dir"
printf "# existing\n" > "$gitignore_dir/.gitignore"

gitignore_output="$(cd "$gitignore_dir" && HOME="$TEST_ROOT/fake-home" bash "$INSTALLER" --agent=claude-code </dev/null 2>&1 || true)"

if [ -f "$gitignore_dir/.gitignore" ]; then
    if grep -q '^/.claude/skills/$' "$gitignore_dir/.gitignore" && \
       grep -q '^/.claude/hooks/$' "$gitignore_dir/.gitignore" && \
       grep -q '^/.claude-code-plugin/$' "$gitignore_dir/.gitignore" && \
       grep -q '^/.spark-lock.json$' "$gitignore_dir/.gitignore"; then
        pass "Project install auto-registers SPARK artifacts in .gitignore"
    else
        fail "Project install did not add all expected SPARK gitignore entries"
        echo "$gitignore_output"
        echo "---- .gitignore ----"
        cat "$gitignore_dir/.gitignore"
    fi
else
    fail ".gitignore missing after project install"
fi

(cd "$gitignore_dir" && HOME="$TEST_ROOT/fake-home" bash "$INSTALLER" --agent=claude-code --force </dev/null >/dev/null 2>&1 || true)

dup_count="$(grep -c '^/.spark-lock.json$' "$gitignore_dir/.gitignore" || true)"
if [ "$dup_count" -eq 1 ]; then
    pass "SPARK gitignore entries are not duplicated on reinstall"
else
    fail "SPARK gitignore entries were duplicated on reinstall"
fi

# =============================================================================
# Test 5: Dry-run mode doesn't modify filesystem
# =============================================================================

echo ""
echo "Dry-run mode"

dry_run_dir="$TEST_ROOT/dry-run-test"
mkdir -p "$dry_run_dir"

# Run installer in dry-run mode with a fake HOME so no agents are detected
# We need non-interactive, so we'll pipe empty input
dry_output="$(cd "$dry_run_dir" && HOME="$TEST_ROOT/fake-home" bash "$INSTALLER" --agent=claude-code --dry-run </dev/null 2>&1 || true)"

# Verify no lock file was created
if [ ! -f "$dry_run_dir/.spark-lock.json" ]; then
    pass "Dry-run did not create lock file"
else
    fail "Dry-run created lock file"
fi

if [ ! -d "$dry_run_dir/.claude" ]; then
    pass "Dry-run did not make changes in filesystem"
else
    fail "Dry-run made changes in filesystem"
fi

# Verify registry version check cannot hang installer when npm is slow/unreachable
slow_npm_bin="$TEST_ROOT/slow-npm-bin"
mkdir -p "$slow_npm_bin"
cat > "$slow_npm_bin/npm" <<'EOF'
#!/usr/bin/env bash
sleep 30
EOF
chmod +x "$slow_npm_bin/npm"

start_ts="$(date +%s)"
slow_npm_output="$(cd "$dry_run_dir" && HOME="$TEST_ROOT/fake-home" PATH="$slow_npm_bin:$PATH" bash "$INSTALLER" --agent=claude-code --dry-run </dev/null 2>&1 || true)"
elapsed_secs="$(( $(date +%s) - start_ts ))"

if [ "$elapsed_secs" -lt 10 ]; then
    pass "Installer bounds registry version check when npm hangs"
else
    fail "Installer hung too long during registry version check ($elapsed_secs seconds)"
fi

if echo "$slow_npm_output" | grep -q "\[DRY-RUN\] Would install for"; then
    pass "Installer continues past registry check when npm hangs"
else
    fail "Installer did not continue after slow npm registry check"
fi

# Interactive selection should accept a single numeric input and proceed immediately
interactive_dir="$TEST_ROOT/interactive-test"
interactive_home="$TEST_ROOT/interactive-home"
mkdir -p "$interactive_dir" "$interactive_home/.claude" "$interactive_home/.codex"

interactive_output="$(cd "$interactive_dir" && HOME="$interactive_home" SPARK_FORCE_INTERACTIVE=true bash "$INSTALLER" --dry-run <<'EOF' 2>&1 || true
1
EOF
)"

prompt_count="$(printf "%s" "$interactive_output" | grep -c "Enter agent number")"
if [ "$prompt_count" -eq 1 ]; then
    pass "Interactive installer accepts one numeric selection without re-prompt loop"
else
    fail "Interactive installer re-prompted unexpectedly ($prompt_count prompts)"
fi

if printf "%s" "$interactive_output" | grep -q "\[DRY-RUN\] Would install for codex-cli" && ! printf "%s" "$interactive_output" | grep -q "\[DRY-RUN\] Would install for claude-code"; then
    pass "Interactive installer applies only the selected numeric agent"
else
    fail "Interactive installer did not restrict installation to the selected numeric agent"
fi

# =============================================================================
# Test 5: Idempotency — install twice in temp dir, assert same result
# =============================================================================

echo ""
echo "Idempotency tests"

idem_dir="$TEST_ROOT/idempotent-test"
idem_home="$TEST_ROOT/idempotent-home"
mkdir -p "$idem_dir" "$idem_home/.claude"

# First install
first_output="$(cd "$idem_dir" && HOME="$idem_home" bash "$INSTALLER" 2>&1 || true)"
first_exit=$?

# Capture state after first install
first_lock=""
if [ -f "$idem_dir/.spark-lock.json" ]; then
    first_lock="$(cat "$idem_dir/.spark-lock.json")"
fi

# Check skills symlink exists
if [ -L "$idem_dir/.claude/skills" ] || [ -d "$idem_dir/.claude/skills" ]; then
    pass "First install created skills directory for claude"
else
    fail "First install did not create skills directory for claude"
fi

# Second install (with --force to ensure it goes through)
second_output="$(cd "$idem_dir" && HOME="$idem_home" bash "$INSTALLER" --force 2>&1 || true)"
second_exit=$?

# Verify no duplicate symlinks or errors
if [ -L "$idem_dir/.claude/skills" ] || [ -d "$idem_dir/.claude/skills" ]; then
    pass "Second install preserved skills directory (no duplicates)"
else
    fail "Second install broke skills directory"
fi

# Verify lock file still exists and is valid JSON
if [ -f "$idem_dir/.spark-lock.json" ]; then
    # Simple JSON validation: check it starts with { and ends with }
    lock_content="$(cat "$idem_dir/.spark-lock.json")"
    if echo "$lock_content" | head -c1 | grep -q '{' && echo "$lock_content" | tail -c2 | grep -q '}'; then
        pass "Lock file is valid JSON after second install"
    else
        fail "Lock file is not valid JSON after second install"
    fi
else
    fail "Lock file missing after second install"
fi

# Verify idempotent (without --force): should detect existing install
idem_no_force="$(cd "$idem_dir" && HOME="$idem_home" bash "$INSTALLER" 2>&1 || true)"
if echo "$idem_no_force" | grep -qi "already\|up to date\|nothing to do"; then
    pass "Third install (no --force) detected existing install"
else
    fail "Third install (no --force) did not detect existing install"
fi

# Remove lockfile and verify reinstall without --force warns on existing target directory and skips
rm -f "$idem_dir/.spark-lock.json"
echo "custom content" > "$idem_dir/.claude/skills/dummy.txt"
idem_skip="$(cd "$idem_dir" && HOME="$idem_home" bash "$INSTALLER" 2>&1 || true)"
if echo "$idem_skip" | grep -qi "already exists.*skipping" && grep -q "custom content" "$idem_dir/.claude/skills/dummy.txt" 2>/dev/null; then
    pass "Reinstall without --force displays warning and does not overwrite files"
else
    fail "Reinstall without --force did not warn or protect existing files"
fi
rm -f "$idem_dir/.claude/skills/dummy.txt"

# =============================================================================
# Test 6: Lock file structure validation
# =============================================================================

echo ""
echo "Lock file validation"

lock_dir="$TEST_ROOT/lock-test"
lock_home="$TEST_ROOT/lock-home"
mkdir -p "$lock_dir" "$lock_home/.claude"

# Install
cd "$lock_dir" && HOME="$lock_home" bash "$INSTALLER" >/dev/null 2>&1 || true

if [ -f "$lock_dir/.spark-lock.json" ]; then
    lock="$(cat "$lock_dir/.spark-lock.json")"

    # Check required fields exist
    for field in "installer" "installer_version" "spark_version" "commit" "spark_root" "installed_at" "scope" "agents"; do
        if echo "$lock" | grep -q "\"$field\""; then
            pass "Lock file contains '$field' field"
        else
            fail "Lock file missing '$field' field"
        fi
    done

    # Check scope is "project" (default)
    if echo "$lock" | grep -q '"scope".*"project"'; then
        pass "Lock file records project scope"
    else
        fail "Lock file does not record project scope"
    fi

    # Check claude agent is recorded
    if echo "$lock" | grep -E -q '"claude-code"|"claude"'; then
        pass "Lock file records claude agent"
    else
        fail "Lock file does not record claude agent"
    fi
else
    fail "Lock file not created"
    for field in "installer" "installer_version" "spark_version" "commit" "spark_root" "installed_at" "scope" "agents"; do
        fail "Lock file contains '$field' field (lock file not created)"
    done
    fail "Lock file records project scope (lock file not created)"
    fail "Lock file records claude agent (lock file not created)"
fi

# =============================================================================
# Test 7: Skills directory is properly linked
# =============================================================================

echo ""
echo "Skills installation verification"

verify_dir="$TEST_ROOT/verify-test"
verify_home="$TEST_ROOT/verify-home"
mkdir -p "$verify_dir" "$verify_home/.claude"

cd "$verify_dir" && HOME="$verify_home" bash "$INSTALLER" >/dev/null 2>&1 || true

# Check that installed skills contain the same skills as source
if [ -d "$verify_dir/.claude/skills" ]; then
    source_skills="$(ls "$REPO_ROOT/skills/" | sort)"
    installed_skills="$(ls "$verify_dir/.claude/skills/" 2>/dev/null | sort)"

    if [ "$source_skills" = "$installed_skills" ]; then
        pass "All skills are present in installed directory"
    else
        fail "Installed skills do not match source skills"
        echo "    Source:    $source_skills"
        echo "    Installed: $installed_skills"
    fi
else
    fail "Skills directory not found at .claude/skills"
fi

# Check that using-spark SKILL.md is accessible
if [ -f "$verify_dir/.claude/skills/using-spark/SKILL.md" ]; then
    pass "using-spark/SKILL.md is accessible in installed location"
else
    fail "using-spark/SKILL.md not accessible in installed location"
fi

# =============================================================================
# Test 8: Hooks installation verification (Claude agent)
# =============================================================================

echo ""
echo "Hooks installation verification"

hooks_dir="$TEST_ROOT/hooks-test"
hooks_home="$TEST_ROOT/hooks-home"
mkdir -p "$hooks_dir" "$hooks_home/.claude"

cd "$hooks_dir" && HOME="$hooks_home" bash "$INSTALLER" >/dev/null 2>&1 || true

for hook_file in "hooks/hooks.json" "hooks/run-hook.cmd" "hooks/session-start"; do
    if [ -f "$hooks_dir/.claude/$hook_file" ]; then
        pass "Claude hook file installed: $hook_file"
    else
        fail "Claude hook file missing: $hook_file"
    fi
done

# Verify installed hook script is executable
if [ -f "$hooks_dir/.claude/hooks/session-start" ]; then
    if [ -x "$hooks_dir/.claude/hooks/session-start" ]; then
        pass "Installed session-start hook is executable"
    else
        fail "Installed session-start hook is not executable"
    fi
fi

# =============================================================================
# Test 9: Uninstallation safety verification
# =============================================================================

echo ""
echo "Uninstallation safety verification"

uninst_dir="$TEST_ROOT/uninstall-test"
uninst_home="$TEST_ROOT/uninstall-home"
mkdir -p "$uninst_dir/.claude" "$uninst_dir/.cursor" "$uninst_home"

# Create host agent configuration files that MUST NOT be deleted
echo '{"custom": true}' > "$uninst_dir/.claude/config.json"
echo '{"theme": "dark"}' > "$uninst_dir/.cursor/settings.json"

# Install SPARK
cd "$uninst_dir" && HOME="$uninst_home" bash "$INSTALLER" --agent=claude-code,cursor --force >/dev/null 2>&1 || true

# Run uninstaller with --yes
uninst_out="$(cd "$uninst_dir" && HOME="$uninst_home" bash "$SCRIPT_DIR/../../bin/spark-uninstall.sh" --yes 2>&1 || true)"

# Verify SPARK files and lockfile are deleted
if [ ! -e "$uninst_dir/.claude/skills" ] && [ ! -f "$uninst_dir/.spark-lock.json" ]; then
    pass "Uninstaller cleanly removed SPARK skills and lockfile"
else
    fail "Uninstaller left SPARK skills or lockfile behind"
fi

# Verify host agent configuration files and directories STILL EXIST
if [ -f "$uninst_dir/.claude/config.json" ] && [ -f "$uninst_dir/.cursor/settings.json" ]; then
    pass "Uninstaller preserved host agent configuration files and directories without damage"
else
    fail "Uninstaller damaged or deleted host agent configuration files!"
fi

# =============================================================================
# Test 10: Atomic update verification
# =============================================================================

echo ""
echo "Atomic update verification"

upd_dir="$TEST_ROOT/update-test"
upd_home="$TEST_ROOT/update-home"
mkdir -p "$upd_dir/.claude" "$upd_home"

# Install SPARK first
cd "$upd_dir" && HOME="$upd_home" bash "$INSTALLER" --agent=claude-code --force >/dev/null 2>&1 || true

# Modify lockfile to simulate an older version
sed -i.bak 's/"version": "[^"]*"/"version": "6.0.0"/' "$upd_dir/.spark-lock.json" 2>/dev/null || true
rm -f "$upd_dir/.spark-lock.json.bak" 2>/dev/null || true

# Run updater with --yes
upd_out="$(cd "$upd_dir" && HOME="$upd_home" bash "$SCRIPT_DIR/../../bin/spark-update.sh" --yes 2>&1 || true)"

# Verify lockfile is updated to current version and skills exist
current_version="$(read_package_version)"
if grep -q "\"version\": \"$current_version\"" "$upd_dir/.spark-lock.json" 2>/dev/null && [ -e "$upd_dir/.claude/skills/using-spark" ]; then
    pass "Updater successfully upgraded from old version and updated .spark-lock.json atomically"
else
    fail "Updater failed to upgrade or update lockfile properly"
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
