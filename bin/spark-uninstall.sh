#!/usr/bin/env bash
# spark-uninstall.sh — Native uninstaller for SPARK
# Cleanly removes SPARK skills, hooks, and plugin configurations without damaging agent directories.
# Zero external runtime dependencies (pure bash + common unix tools).
#
# Usage:
#   bash bin/spark-uninstall.sh              # uninstall project-scope SPARK
#   bash bin/spark-uninstall.sh -g           # uninstall global-scope SPARK
#   bash bin/spark-uninstall.sh -y           # uninstall without confirmation prompt
#   bash bin/spark-uninstall.sh --agent=claude-code # partial uninstall for specific agent
#   bash bin/spark-uninstall.sh --dry-run    # preview removal without deleting anything

set -euo pipefail

# =============================================================================
# Constants & Colors
# =============================================================================

VERSION="6.1.0"
readonly LOCK_FILE_NAME=".spark-lock.json"

# Colors (disabled if not a TTY)
if [ -t 1 ]; then
  readonly C_RESET='\033[0m'
  readonly C_BOLD='\033[1m'
  readonly C_GREEN='\033[38;5;46m'       # 8-bit neon green
  readonly C_YELLOW='\033[38;5;226m'      # 8-bit bright yellow
  readonly C_RED='\033[38;5;196m'         # 8-bit bright red
  readonly C_CYAN='\033[38;5;51m'         # 8-bit cyan
  readonly C_MAGENTA='\033[38;5;201m'     # 8-bit magenta
  readonly C_DIM='\033[2m'
else
  readonly C_RESET=''
  readonly C_BOLD=''
  readonly C_GREEN=''
  readonly C_YELLOW=''
  readonly C_RED=''
  readonly C_CYAN=''
  readonly C_MAGENTA=''
  readonly C_DIM=''
fi

# Exit codes
readonly EXIT_SUCCESS=0
readonly EXIT_ERROR=1
readonly EXIT_NO_AGENTS=2
readonly EXIT_CANCELLED=3

# =============================================================================
# Logging helpers
# =============================================================================

info()    { printf "${C_CYAN}►${C_RESET} %s\n" "$1"; }
success() { printf "${C_GREEN}✔${C_RESET} %s\n" "$1"; }
warn()    { printf "${C_YELLOW}▲${C_RESET} %s\n" "$1" >&2; }
error()   { printf "${C_RED}✖${C_RESET} %s\n" "$1" >&2; }
header()  {
  echo ""
  printf "${C_MAGENTA}▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀${C_RESET}\n"
  printf "${C_MAGENTA}█${C_RESET}  ${C_BOLD}%-35s${C_RESET} ${C_MAGENTA}█${C_RESET}\n" "$1"
  printf "${C_MAGENTA}▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄${C_RESET}\n"
  echo ""
}

# =============================================================================
# Arguments parsing
# =============================================================================

SCOPE="project"
AUTO_YES=false
DRY_RUN=false
VERBOSE=false
HELP=false
TARGET_AGENTS_ARG=""

parse_args() {
  while [ $# -gt 0 ]; do
    case "$1" in
      -g|--global)  SCOPE="global" ;;
      -y|--yes)     AUTO_YES=true ;;
      --dry-run)    DRY_RUN=true ;;
      -v|--verbose) VERBOSE=true ;;
      -h|--help)    HELP=true ;;
      --agent=*)    TARGET_AGENTS_ARG="${1#*=}" ;;
      *)
        error "Unknown argument: $1"
        echo "Run with --help for usage."
        exit $EXIT_ERROR
        ;;
    esac
    shift
  done
}

print_help() {
  header "SPARK Native Uninstaller"
  cat <<EOF
Usage:
  bash bin/spark-uninstall.sh [options]

Options:
  -g, --global       Uninstall global-scope SPARK installations (from home directory)
  -y, --yes          Skip confirmation prompt and uninstall immediately
  --agent=<names>    Uninstall only for specific agents (comma-separated, e.g. claude-code,cursor)
  --dry-run          Preview which files/directories would be removed without deleting
  -v, --verbose      Show detailed logs during removal
  -h, --help         Show this help message

Examples:
  bash bin/spark-uninstall.sh               # Remove SPARK from current project with prompt
  bash bin/spark-uninstall.sh -g -y         # Remove global SPARK immediately
  bash bin/spark-uninstall.sh --agent=claude-code  # Remove SPARK only from Claude Code
EOF
}

# =============================================================================
# Agent definitions & mapping
# =============================================================================

readonly AGENT_IDS=(
  "claude-code"
  "codex-cli"
  "cursor"
  "antigravity"
  "gemini"
  "copilot"
  "kimi"
  "opencode"
  "factory"
  "pi"
)

readonly AGENT_LABELS=(
  "Claude Code"
  "Codex CLI"
  "Cursor"
  "Antigravity"
  "Gemini CLI"
  "Copilot CLI"
  "Kimi CLI"
  "OpenCode"
  "Factory CLI"
  "Pi CLI"
)

get_target_dir() {
  local agent_id="$1"
  if [ "$SCOPE" = "global" ]; then
    local home="${HOME:-$(eval echo ~)}"
    case "$agent_id" in
      claude|claude-code) echo "$home/.claude" ;;
      codex|codex-cli)    echo "$home/.codex" ;;
      cursor)             echo "$home/.cursor" ;;
      antigravity)        echo "$home/.gemini/antigravity" ;;
      gemini)             echo "$home/.gemini" ;;
      copilot)            echo "$home/.copilot" ;;
      kimi)               echo "$home/.kimi" ;;
      opencode)           echo "$home/.config/opencode" ;;
      factory)            echo "$home/.factory" ;;
      pi)                 echo "$home/.pi" ;;
      *)                  echo "$home/.$agent_id" ;;
    esac
  else
    case "$agent_id" in
      claude|claude-code) echo "$(pwd)/.claude" ;;
      codex|codex-cli)    echo "$(pwd)/.codex" ;;
      cursor)             echo "$(pwd)/.cursor" ;;
      antigravity)        echo "$(pwd)/.gemini/antigravity" ;;
      gemini)             echo "$(pwd)/.gemini" ;;
      copilot)            echo "$(pwd)/.copilot" ;;
      kimi)               echo "$(pwd)/.kimi" ;;
      opencode)           echo "$(pwd)/.opencode" ;;
      factory)            echo "$(pwd)/.factory" ;;
      pi)                 echo "$(pwd)/.pi" ;;
      *)                  echo "$(pwd)/.$agent_id" ;;
    esac
  fi
}

# =============================================================================
# Discovery & Selection
# =============================================================================

TO_REMOVE_AGENTS=()

discover_installed_agents() {
  local lock_dir
  if [ "$SCOPE" = "global" ]; then
    lock_dir="${HOME:-$(eval echo ~)}"
  else
    lock_dir="$(pwd)"
  fi
  local lock_path="$lock_dir/$LOCK_FILE_NAME"

  local detected=()
  local i
  for i in "${!AGENT_IDS[@]}"; do
    detected[$i]="false"
  done

  # 1. Check lock file first
  if [ -f "$lock_path" ]; then
    info "Reading installed agents from $lock_path..."
    for i in "${!AGENT_IDS[@]}"; do
      local aid="${AGENT_IDS[$i]}"
      if grep -E "\"$aid\"[[:space:]]*:" "$lock_path" >/dev/null 2>&1 || grep -E "\"agents\"[[:space:]]*:[[:space:]]*\[[^]]*\"$aid\"" "$lock_path" >/dev/null 2>&1; then
        detected[$i]="true"
      fi
    done
  fi

  # 2. Also scan filesystem for existing SPARK skills/hooks
  for i in "${!AGENT_IDS[@]}"; do
    local aid="${AGENT_IDS[$i]}"
    local tdir
    tdir="$(get_target_dir "$aid")"
    if [ -e "$tdir/skills/using-spark" ] || [ -e "$tdir/skills/SKILL.md" ] || [ -L "$tdir/skills" ]; then
      detected[$i]="true"
    fi
  done

  # 3. Filter by --agent argument if specified
  if [ -n "$TARGET_AGENTS_ARG" ]; then
    localIFS="$IFS"
    IFS=','
    for arg in $TARGET_AGENTS_ARG; do
      arg="$(echo "$arg" | tr -d ' ')"
      local found=false
      for i in "${!AGENT_IDS[@]}"; do
        if [ "${AGENT_IDS[$i]}" = "$arg" ] || [ "${AGENT_LABELS[$i]}" = "$arg" ]; then
          found=true
          if [ "${detected[$i]}" = "true" ]; then
            TO_REMOVE_AGENTS+=("${AGENT_IDS[$i]}")
          else
            warn "Agent '$arg' is specified but SPARK is not installed there."
          fi
        fi
      done
      if ! $found; then
        warn "Unknown agent specified in --agent: $arg"
      fi
    done
    IFS="$localIFS"
  else
    for i in "${!AGENT_IDS[@]}"; do
      if [ "${detected[$i]}" = "true" ]; then
        TO_REMOVE_AGENTS+=("${AGENT_IDS[$i]}")
      fi
    done
  fi

  # Remove duplicates if any
  local unique_agents=()
  for aid in "${TO_REMOVE_AGENTS[@]}"; do
    local dup=false
    for u in "${unique_agents[@]:-}"; do
      if [ "$u" = "$aid" ]; then dup=true; break; fi
    done
    if ! $dup; then unique_agents+=("$aid"); fi
  done
  TO_REMOVE_AGENTS=("${unique_agents[@]:-}")
}

# =============================================================================
# Removal Logic
# =============================================================================

remove_file_or_dir() {
  local target="$1"
  local desc="$2"

  if [ -e "$target" ] || [ -L "$target" ]; then
    if $DRY_RUN; then
      info "[DRY-RUN] Would remove $desc: $target"
    else
      rm -rf "$target"
      if $VERBOSE; then info "Removed $desc: $target"; fi
    fi
  fi
}

uninstall_for_agent() {
  local agent_id="$1"
  local target_dir
  target_dir="$(get_target_dir "$agent_id")"

  if [ ! -e "$target_dir" ] && [ ! -L "$target_dir" ]; then
    return 0
  fi

  info "Cleaning up $agent_id at $target_dir..."

  # 1. Remove skills directory/symlink
  remove_file_or_dir "$target_dir/skills" "skills directory/symlink"

  # 2. Remove hooks
  case "$agent_id" in
    claude|claude-code)
      remove_file_or_dir "$target_dir/hooks/hooks.json" "hook file"
      remove_file_or_dir "$target_dir/hooks/run-hook.cmd" "hook file"
      remove_file_or_dir "$target_dir/hooks/session-start" "hook file"
      remove_file_or_dir "$target_dir/.claude-plugin/plugin.json" "plugin manifest"
      ;;
    codex|codex-cli)
      remove_file_or_dir "$target_dir/hooks/hooks-codex.json" "hook file"
      remove_file_or_dir "$target_dir/hooks/run-hook.cmd" "hook file"
      remove_file_or_dir "$target_dir/hooks/session-start-codex" "hook file"
      remove_file_or_dir "$target_dir/.codex-plugin/plugin.json" "plugin manifest"
      ;;
    cursor)
      remove_file_or_dir "$target_dir/hooks/hooks-cursor.json" "hook file"
      remove_file_or_dir "$target_dir/hooks/run-hook.cmd" "hook file"
      remove_file_or_dir "$target_dir/hooks/session-start" "hook file"
      remove_file_or_dir "$target_dir/.cursor-plugin/plugin.json" "plugin manifest"
      ;;
    kimi)
      remove_file_or_dir "$target_dir/.kimi-plugin/plugin.json" "plugin manifest"
      ;;
    opencode)
      remove_file_or_dir "$target_dir/plugins/spark.js" "plugin script"
      ;;
    pi)
      remove_file_or_dir "$target_dir/extensions/spark.ts" "extension script"
      ;;
  esac

  # 3. Clean up empty subdirectories safely (NEVER remove non-empty host dirs)
  if ! $DRY_RUN; then
    for subdir in "hooks" ".claude-plugin" ".codex-plugin" ".cursor-plugin" ".kimi-plugin" "plugins" "extensions"; do
      if [ -d "$target_dir/$subdir" ]; then
        rmdir "$target_dir/$subdir" 2>/dev/null || true
      fi
    done
    # Remove agent root target_dir ONLY if it is completely empty
    if [ -d "$target_dir" ]; then
      rmdir "$target_dir" 2>/dev/null || true
    fi
  fi
}

update_or_remove_lock_file() {
  local lock_dir
  if [ "$SCOPE" = "global" ]; then
    lock_dir="${HOME:-$(eval echo ~)}"
  else
    lock_dir="$(pwd)"
  fi
  local lock_path="$lock_dir/$LOCK_FILE_NAME"

  if [ ! -f "$lock_path" ]; then
    return 0
  fi

  # Check if any other agents still have SPARK installed
  local remaining_count=0
  for i in "${!AGENT_IDS[@]}"; do
    local aid="${AGENT_IDS[$i]}"
    local is_removed=false
    for rem in "${TO_REMOVE_AGENTS[@]}"; do
      if [ "$rem" = "$aid" ]; then is_removed=true; break; fi
    done
    if ! $is_removed; then
      local tdir
      tdir="$(get_target_dir "$aid")"
      if [ -e "$tdir/skills/using-spark" ] || [ -e "$tdir/skills/SKILL.md" ] || [ -L "$tdir/skills" ]; then
        remaining_count=$((remaining_count + 1))
      fi
    fi
  done

  if [ $remaining_count -eq 0 ]; then
    remove_file_or_dir "$lock_path" "lock file"
  else
    if ! $DRY_RUN; then
      info "Partial uninstall completed. Updating lock file..."
      # If partial uninstall, we can clean up the lock file by re-running write or removing removed agent keys
      # For simplicity and robustness without jq, if some agents remain, we remove the uninstalled agent lines
      for rem in "${TO_REMOVE_AGENTS[@]}"; do
        # Use grep -v or sed to clean up array in lockfile if needed
        sed -i.bak "/\"$rem\"/d" "$lock_path" 2>/dev/null || true
        rm -f "${lock_path}.bak" 2>/dev/null || true
      done
    fi
  fi
}

# =============================================================================
# Main
# =============================================================================

main() {
  parse_args "$@"

  if $HELP; then
    print_help
    exit $EXIT_SUCCESS
  fi

  header "SPARK Native Uninstaller"

  info "Scanning for installed SPARK agents (scope: $SCOPE)..."
  discover_installed_agents

  if [ ${#TO_REMOVE_AGENTS[@]} -eq 0 ]; then
    if [ -n "$TARGET_AGENTS_ARG" ]; then
      warn "No SPARK installations found for specified agents: $TARGET_AGENTS_ARG"
    else
      warn "No SPARK installations found in $SCOPE scope."
    fi
    exit $EXIT_SUCCESS
  fi

  echo ""
  echo "The following SPARK installations will be removed:"
  for aid in "${TO_REMOVE_AGENTS[@]}"; do
    local tdir
    tdir="$(get_target_dir "$aid")"
    printf "  ${C_RED}■${C_RESET} %-15s → %s\n" "$aid" "$tdir"
  done
  echo ""

  # Confirmation prompt
  if ! $AUTO_YES && ! $DRY_RUN; then
    if [ ! -t 0 ] || [ ! -t 1 ]; then
      error "Non-interactive terminal detected. Use --yes (-y) to confirm uninstallation."
      exit $EXIT_ERROR
    fi
    printf "Are you sure you want to remove SPARK from these agents? [y/N] "
    read -r ans || ans="n"
    if [ "$ans" != "y" ] && [ "$ans" != "Y" ] && [ "$ans" != "yes" ]; then
      info "Uninstallation cancelled by user."
      exit $EXIT_CANCELLED
    fi
    echo ""
  fi

  for aid in "${TO_REMOVE_AGENTS[@]}"; do
    uninstall_for_agent "$aid"
  done

  update_or_remove_lock_file

  echo ""
  if $DRY_RUN; then
    success "Dry-run uninstallation preview complete. No files were removed."
  else
    success "SPARK has been cleanly uninstalled."
  fi
  echo ""
  exit $EXIT_SUCCESS
}

main "$@"
