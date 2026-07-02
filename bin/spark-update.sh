#!/usr/bin/env bash
# spark-update.sh — Native atomic update script for SPARK
# Reads .spark-lock.json, compares versions, prompts user, and performs an atomic reinstall.
# Zero external runtime dependencies (pure bash + common unix tools).
#
# Usage:
#   bash bin/spark-update.sh              # update project-scope SPARK
#   bash bin/spark-update.sh -g           # update global-scope SPARK
#   bash bin/spark-update.sh -y           # update without confirmation prompt
#   bash bin/spark-update.sh --force      # force update even if already up-to-date
#   bash bin/spark-update.sh --dry-run    # preview update without modifying filesystem

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
FORCE=false
DRY_RUN=false
VERBOSE=false
HELP=false
TARGET_AGENTS_ARG=""

parse_args() {
  while [ $# -gt 0 ]; do
    case "$1" in
      -g|--global)  SCOPE="global" ;;
      -y|--yes)     AUTO_YES=true ;;
      --force)      FORCE=true ;;
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
  header "SPARK Native Updater"
  cat <<EOF
Usage:
  bash bin/spark-update.sh [options]

Options:
  -g, --global       Update global-scope SPARK installations (from home directory)
  -y, --yes          Skip confirmation prompt and update immediately
  --force            Reinstall even if versions match and are up to date
  --agent=<names>    Update only for specific agents (comma-separated)
  --dry-run          Preview what would be updated without filesystem changes
  -v, --verbose      Show detailed logs during update
  -h, --help         Show this help message

Examples:
  bash bin/spark-update.sh               # Update SPARK in current project
  bash bin/spark-update.sh -g -y         # Update global SPARK immediately
  bash bin/spark-update.sh --force       # Force reinstall current version
EOF
}

# =============================================================================
# Agent definitions
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

# =============================================================================
# Version & Repository Resolution
# =============================================================================

SPARK_ROOT=""
AVAILABLE_VERSION=""
AVAILABLE_COMMIT="n/a"

resolve_spark_root_and_version() {
  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  SPARK_ROOT="$(cd "$script_dir/.." && pwd)"

  # Read version from bundled package.json
  if command -v node >/dev/null 2>&1 && [ -f "$SPARK_ROOT/package.json" ]; then
    AVAILABLE_VERSION="$(node -e "console.log(require('$SPARK_ROOT/package.json').version)" 2>/dev/null || echo "")"
  fi
  if [ -z "$AVAILABLE_VERSION" ] && [ -f "$SPARK_ROOT/package.json" ]; then
    AVAILABLE_VERSION="$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "$SPARK_ROOT/package.json" | head -1 | grep -o '"[^"]*"$' | tr -d '"')"
  fi
  if [ -z "$AVAILABLE_VERSION" ]; then AVAILABLE_VERSION="$VERSION"; fi
  VERSION="$AVAILABLE_VERSION"

  # Detect git commit SHA if in git repo
  if command -v git >/dev/null 2>&1 && [ -d "$SPARK_ROOT/.git" ]; then
    AVAILABLE_COMMIT="$(git -C "$SPARK_ROOT" rev-parse HEAD 2>/dev/null || echo "n/a")"
  fi
}

# =============================================================================
# Main Update Logic
# =============================================================================

main() {
  parse_args "$@"

  if $HELP; then
    print_help
    exit $EXIT_SUCCESS
  fi

  header "SPARK Native Updater"

  resolve_spark_root_and_version

  local lock_dir
  if [ "$SCOPE" = "global" ]; then
    lock_dir="${HOME:-$(eval echo ~)}"
  else
    lock_dir="$(pwd)"
  fi
  local lock_path="$lock_dir/$LOCK_FILE_NAME"

  if [ ! -f "$lock_path" ]; then
    error "No .spark-lock.json found in $SCOPE scope ($lock_dir)."
    error "Cannot update because SPARK is not currently installed or lockfile is missing."
    error "Run: bash \"$SPARK_ROOT/bin/spark-install.sh\" ${SCOPE:+-g}"
    exit $EXIT_ERROR
  fi

  info "Reading installation status from $lock_path..."

  local installed_version installed_commit installed_scope
  installed_version="$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "$lock_path" 2>/dev/null | head -1 | grep -o '"[^"]*"$' | tr -d '"' || true)"
  if [ -z "$installed_version" ]; then
    installed_version="$(grep -o '"spark_version"[[:space:]]*:[[:space:]]*"[^"]*"' "$lock_path" 2>/dev/null | head -1 | grep -o '"[^"]*"$' | tr -d '"' || echo "unknown")"
  fi

  installed_commit="$(grep -o '"sha"[[:space:]]*:[[:space:]]*"[^"]*"' "$lock_path" 2>/dev/null | head -1 | grep -o '"[^"]*"$' | tr -d '"' || true)"
  if [ -z "$installed_commit" ]; then
    installed_commit="$(grep -o '"commit"[[:space:]]*:[[:space:]]*"[^"]*"' "$lock_path" 2>/dev/null | head -1 | grep -o '"[^"]*"$' | tr -d '"' || echo "n/a")"
  fi

  installed_scope="$(grep -o '"scope"[[:space:]]*:[[:space:]]*"[^"]*"' "$lock_path" 2>/dev/null | head -1 | grep -o '"[^"]*"$' | tr -d '"' || echo "$SCOPE")"

  # Detect installed agents from lockfile
  local target_agents=()
  if [ -n "$TARGET_AGENTS_ARG" ]; then
    localIFS="$IFS"
    IFS=','
    for arg in $TARGET_AGENTS_ARG; do
      target_agents+=("$(echo "$arg" | tr -d ' ')")
    done
    IFS="$localIFS"
  else
    for aid in "${AGENT_IDS[@]}"; do
      if grep -E "\"$aid\"[[:space:]]*:" "$lock_path" >/dev/null 2>&1 || grep -E "\"agents\"[[:space:]]*:[[:space:]]*\[[^]]*\"$aid\"" "$lock_path" >/dev/null 2>&1; then
        target_agents+=("$aid")
      fi
    done
  fi

  if [ ${#target_agents[@]} -eq 0 ]; then
    warn "No installed coding agents found in lockfile."
    exit $EXIT_NO_AGENTS
  fi

  echo ""
  info "Version Comparison:"
  if [ "$installed_commit" != "n/a" ] && [ -n "$installed_commit" ]; then
    printf "  ► Installed : %s (%s)\n" "$installed_version" "${installed_commit:0:12}"
  else
    printf "  ► Installed : %s\n" "$installed_version"
  fi

  if [ "$AVAILABLE_COMMIT" != "n/a" ] && [ -n "$AVAILABLE_COMMIT" ]; then
    printf "  ► Available : %s (%s)\n" "$AVAILABLE_VERSION" "${AVAILABLE_COMMIT:0:12}"
  else
    printf "  ► Available : %s\n" "$AVAILABLE_VERSION"
  fi
  echo ""

  if [ "$installed_version" = "$AVAILABLE_VERSION" ] && [ "$installed_commit" = "$AVAILABLE_COMMIT" ] && ! $FORCE; then
    success "SPARK is already up to date ($AVAILABLE_VERSION). Nothing to do."
    info "Use --force to reinstall anyway."
    exit $EXIT_SUCCESS
  fi

  info "Target agents to update: ${target_agents[*]}"
  echo ""

  if ! $AUTO_YES && ! $DRY_RUN; then
    if [ ! -t 0 ] || [ ! -t 1 ]; then
      error "Non-interactive terminal detected. Use --yes (-y) to confirm update."
      exit $EXIT_ERROR
    fi
    printf "Proceed with atomic update? [y/N] "
    read -r ans || ans="n"
    if [ "$ans" != "y" ] && [ "$ans" != "Y" ] && [ "$ans" != "yes" ]; then
      info "Update cancelled by user."
      exit $EXIT_CANCELLED
    fi
    echo ""
  fi

  local scope_flag=""
  if [ "$SCOPE" = "global" ]; then scope_flag="-g"; fi

  local agents_arg=""
  localIFS="$IFS"; IFS=','; agents_arg="${target_agents[*]}"; IFS="$localIFS"
  agents_arg="${agents_arg// /,}"

  if $DRY_RUN; then
    info "[DRY-RUN] Would cleanly uninstall old version via spark-uninstall.sh"
    info "[DRY-RUN] Would install new version $AVAILABLE_VERSION for agents: $agents_arg"
    success "Dry-run update preview complete. No files were changed."
    exit $EXIT_SUCCESS
  fi

  info "Step 1/2: Removing old installation..."
  if [ -f "$SPARK_ROOT/bin/spark-uninstall.sh" ]; then
    bash "$SPARK_ROOT/bin/spark-uninstall.sh" --yes ${scope_flag} --agent="$agents_arg" || true
  fi

  info "Step 2/2: Installing new version ($AVAILABLE_VERSION)..."
  if ! bash "$SPARK_ROOT/bin/spark-install.sh" --yes --force ${scope_flag} --agent="$agents_arg"; then
    echo ""
    error "═══════════════════════════════════════════════════════════════════════"
    error "CRITICAL: Update failed during Step 2 (installation)!"
    error "Your SPARK installation may be in a partially uninstalled state."
    error ""
    error "RECOVERY INSTRUCTIONS:"
    error "1. Check disk space and directory write permissions."
    error "2. Run manual recovery install:"
    error "     bash \"$SPARK_ROOT/bin/spark-install.sh\" --force ${scope_flag} --agent=\"$agents_arg\""
    error "═══════════════════════════════════════════════════════════════════════"
    exit $EXIT_ERROR
  fi

  echo ""
  success "SPARK atomic update completed successfully! Upgraded to $AVAILABLE_VERSION."
  echo ""
  exit $EXIT_SUCCESS
}

main "$@"
