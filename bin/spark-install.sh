#!/usr/bin/env bash
# spark-install.sh — Native self-installer for SPARK
# Installs skills + hooks for detected coding agents.
# Zero external runtime dependencies (pure bash + common unix tools).
#
# Usage:
#   bash bin/spark-install.sh              # project-scope install
#   bash bin/spark-install.sh -g           # global-scope install
#   bash bin/spark-install.sh --force      # re-install even if already installed
#   bash bin/spark-install.sh --help       # show usage

set -euo pipefail


# =============================================================================
# Constants & Colors
# =============================================================================

readonly VERSION="1.0.0"
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
readonly EXIT_NO_AGENTS=1
readonly EXIT_PERMISSION=2
readonly EXIT_NO_REPO=3
readonly EXIT_INSTALL_FAILED=4

# =============================================================================
# Output helpers (8-Bit Theme)
# =============================================================================

info()    { printf "${C_CYAN}►${C_RESET} %s\n" "$*"; }
success() { printf "${C_GREEN}★${C_RESET} %s\n" "$*"; }
warn()    { printf "${C_YELLOW}▲${C_RESET} %s\n" "$*" >&2; }
error()   { printf "${C_RED}[X]${C_RESET} %s\n" "$*" >&2; }
step()    { printf "${C_MAGENTA}[LVL %s/%s]${C_RESET} %s\n" "$1" "$2" "$3"; }
header()  {
  printf "\n${C_MAGENTA}▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄${C_RESET}\n"
  printf "${C_MAGENTA}█${C_RESET} ${C_BOLD}%-35s${C_RESET} ${C_MAGENTA}█${C_RESET}\n" " $1 "
  printf "${C_MAGENTA}▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀${C_RESET}\n\n"
}

# =============================================================================
# Argument parsing
# =============================================================================

SCOPE="project"
FORCE=false
HELP=false
DRY_RUN=false
UNINSTALL=false

parse_args() {
  while [ $# -gt 0 ]; do
    case "$1" in
      -g|--global)  SCOPE="global" ;;
      --force)      FORCE=true ;;
      --dry-run)    DRY_RUN=true ;;
      -u|--uninstall) UNINSTALL=true ;;
      -h|--help)    HELP=true ;;
      *)
        error "Unknown argument: $1"
        echo "Run with --help for usage."
        exit 1
        ;;
    esac
    shift
  done
}

print_help() {
  cat <<'EOF'

  SPARK Native Installer

  Usage:
    bash bin/spark-install.sh [options]

  Options:
    -g, --global    Install to global agent config (~/.agent/skills/)
                    Default: project scope (./.agent/skills/)
    --force         Re-install even if already installed
    --dry-run       Show what would be done without making changes
    -u, --uninstall Safely remove SPARK from agent configs
    -h, --help      Show this help message

  Examples:
    bash bin/spark-install.sh              # install for detected agents (project scope)
    bash bin/spark-install.sh -g           # install globally
    bash bin/spark-install.sh --force -g   # force reinstall globally

  One-liner from scratch:
    git clone https://github.com/adityaaria/SPARK.git && cd SPARK && bash bin/spark-install.sh

EOF
}

# =============================================================================
# Repo resolution & version detection
# =============================================================================

SPARK_ROOT=""
SPARK_VERSION=""
SPARK_COMMIT=""

resolve_spark_root() {
  # Determine repo root from the script's own location
  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

  # Script lives in bin/, so repo root is one level up
  SPARK_ROOT="$(cd "$script_dir/.." && pwd)"

  # Validate: skills/ directory must exist
  if [ ! -d "$SPARK_ROOT/skills" ]; then
    error "Cannot find skills/ directory at $SPARK_ROOT"
    error "Are you running this from within the SPARK repo?"
    exit $EXIT_NO_REPO
  fi

  # Validate: hooks/ directory must exist
  if [ ! -d "$SPARK_ROOT/hooks" ]; then
    error "Cannot find hooks/ directory at $SPARK_ROOT"
    exit $EXIT_NO_REPO
  fi
}

detect_version() {
  # Try git tag first
  if command -v git >/dev/null 2>&1 && [ -d "$SPARK_ROOT/.git" ]; then
    SPARK_COMMIT="$(git -C "$SPARK_ROOT" rev-parse HEAD 2>/dev/null || echo "unknown")"
    SPARK_VERSION="$(git -C "$SPARK_ROOT" describe --tags --always 2>/dev/null || echo "")"
  fi

  # Fallback: parse version from package.json without jq
  if [ -z "$SPARK_VERSION" ] && [ -f "$SPARK_ROOT/package.json" ]; then
    # Simple grep-based extraction — no jq required
    SPARK_VERSION="$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "$SPARK_ROOT/package.json" | head -1 | grep -o '"[^"]*"$' | tr -d '"')"
  fi

  if [ -z "$SPARK_VERSION" ]; then SPARK_VERSION="unknown"; fi
  if [ -z "$SPARK_COMMIT" ]; then SPARK_COMMIT="unknown"; fi
}

# =============================================================================
# Skill & hook discovery
# =============================================================================

# Parallel arrays for discovered skills
SKILL_NAMES=()
SKILL_PATHS=()

discover_skills() {
  local count=0
  for skill_dir in "$SPARK_ROOT"/skills/*/; do
    [ ! -d "$skill_dir" ] && continue
    local skill_md="$skill_dir/SKILL.md"
    if [ ! -f "$skill_md" ]; then
      warn "Skill directory $(basename "$skill_dir") missing SKILL.md — skipping"
      continue
    fi

    # Validate frontmatter: must have name: and description:
    local has_name=false has_desc=false in_frontmatter=false
    while IFS= read -r line; do
      if [ "$line" = "---" ]; then
        if $in_frontmatter; then
          break  # end of frontmatter
        else
          in_frontmatter=true
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

    if ! $has_name || ! $has_desc; then
      warn "Skill $(basename "$skill_dir") has invalid frontmatter (missing name/description) — skipping"
      continue
    fi

    SKILL_NAMES+=("$(basename "$skill_dir")")
    SKILL_PATHS+=("$skill_dir")
    count=$((count + 1))
  done

  if [ $count -eq 0 ]; then
    error "No valid skills found in $SPARK_ROOT/skills/"
    exit $EXIT_NO_REPO
  fi

  info "Discovered $count skills: ${SKILL_NAMES[*]}"
}

# =============================================================================
# Agent detection
# =============================================================================

# Agent registry: parallel arrays
AGENT_IDS=()
AGENT_LABELS=()
AGENT_DETECTED=()     # "true" / "false"
AGENT_REASONS=()

register_agent() {
  local id="$1" label="$2" detected="$3" reason="$4"
  AGENT_IDS+=("$id")
  AGENT_LABELS+=("$label")
  AGENT_DETECTED+=("$detected")
  AGENT_REASONS+=("$reason")
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

detect_agents() {
  local home="${HOME:-}"
  [ -z "$home" ] && home="$(eval echo ~)"

  # Claude Code: ~/.claude/ or claude binary or CLAUDE_PLUGIN_ROOT env
  if [ -d "$home/.claude" ] || [ -n "${CLAUDE_PLUGIN_ROOT:-}" ] || command_exists claude; then
    local reason=""
    [ -d "$home/.claude" ] && reason="config:~/.claude"
    [ -n "${CLAUDE_PLUGIN_ROOT:-}" ] && reason="${reason:+$reason, }env:CLAUDE_PLUGIN_ROOT"
    command_exists claude && reason="${reason:+$reason, }path:claude"
    register_agent "claude" "Claude Code" "true" "$reason"
  else
    register_agent "claude" "Claude Code" "false" ""
  fi

  # Codex CLI: ~/.codex/ or codex binary
  if [ -d "$home/.codex" ] || command_exists codex; then
    local reason=""
    [ -d "$home/.codex" ] && reason="config:~/.codex"
    command_exists codex && reason="${reason:+$reason, }path:codex"
    register_agent "codex" "Codex CLI" "true" "$reason"
  else
    register_agent "codex" "Codex CLI" "false" ""
  fi

  # Cursor: ~/.cursor/ or CURSOR_PLUGIN_ROOT env or cursor binary
  if [ -d "$home/.cursor" ] || [ -n "${CURSOR_PLUGIN_ROOT:-}" ] || command_exists cursor; then
    local reason=""
    [ -d "$home/.cursor" ] && reason="config:~/.cursor"
    [ -n "${CURSOR_PLUGIN_ROOT:-}" ] && reason="${reason:+$reason, }env:CURSOR_PLUGIN_ROOT"
    command_exists cursor && reason="${reason:+$reason, }path:cursor"
    register_agent "cursor" "Cursor" "true" "$reason"
  else
    register_agent "cursor" "Cursor" "false" ""
  fi

  # Kimi: ~/.kimi/ or kimi binary
  if [ -d "$home/.kimi" ] || command_exists kimi; then
    local reason=""
    [ -d "$home/.kimi" ] && reason="config:~/.kimi"
    command_exists kimi && reason="${reason:+$reason, }path:kimi"
    register_agent "kimi" "Kimi Code" "true" "$reason"
  else
    register_agent "kimi" "Kimi Code" "false" ""
  fi

  # OpenCode: ~/.config/opencode/ or OPENCODE_CONFIG_DIR or opencode binary
  local oc_config="${OPENCODE_CONFIG_DIR:-$home/.config/opencode}"
  if [ -d "$oc_config" ] || command_exists opencode; then
    local reason=""
    [ -d "$oc_config" ] && reason="config:$oc_config"
    [ -n "${OPENCODE_CONFIG_DIR:-}" ] && reason="${reason:+$reason, }env:OPENCODE_CONFIG_DIR"
    command_exists opencode && reason="${reason:+$reason, }path:opencode"
    register_agent "opencode" "OpenCode" "true" "$reason"
  else
    register_agent "opencode" "OpenCode" "false" ""
  fi

  # Pi: PI_HOME env or pi binary
  if [ -n "${PI_HOME:-}" ] || command_exists pi; then
    local reason=""
    [ -n "${PI_HOME:-}" ] && reason="env:PI_HOME"
    command_exists pi && reason="${reason:+$reason, }path:pi"
    register_agent "pi" "Pi" "true" "$reason"
  else
    register_agent "pi" "Pi" "false" ""
  fi

  # Count detected
  local detected_count=0
  for i in "${!AGENT_IDS[@]}"; do
    [ "${AGENT_DETECTED[$i]}" = "true" ] && detected_count=$((detected_count + 1))
  done

  if [ $detected_count -gt 0 ]; then
    info "Detected $detected_count agent(s):"
    for i in "${!AGENT_IDS[@]}"; do
      if [ "${AGENT_DETECTED[$i]}" = "true" ]; then
        printf "  ${C_GREEN}■${C_RESET} %-15s ${C_DIM}(%s)${C_RESET}\n" "${AGENT_LABELS[$i]}" "${AGENT_REASONS[$i]}"
      fi
    done
  fi

  return $detected_count
}

# =============================================================================
# Interactive agent selection (when none detected)
# =============================================================================

SELECTED_AGENTS=()

prompt_agent_selection() {
  # Check if stdin is a terminal
  if [ ! -t 0 ]; then
    error "No agents detected and stdin is not a terminal."
    error "Run interactively or set agent config directories manually."
    exit $EXIT_NO_AGENTS
  fi

  echo ""
  warn "No coding agents detected automatically."
  echo ""
  echo "Select which agents to install SPARK for:"
  echo ""

  for i in "${!AGENT_IDS[@]}"; do
    printf "  ${C_BOLD}%d)${C_RESET} %s\n" "$((i + 1))" "${AGENT_LABELS[$i]}"
  done

  echo ""
  printf "Enter numbers separated by spaces (e.g. '1 3 5'), or 'q' to quit: "
  read -r selection

  if [ "$selection" = "q" ] || [ "$selection" = "Q" ] || [ -z "$selection" ]; then
    info "No agents selected. Exiting."
    exit $EXIT_NO_AGENTS
  fi

  for num in $selection; do
    # Validate: must be a number in range
    if [[ "$num" =~ ^[0-9]+$ ]] && [ "$num" -ge 1 ] && [ "$num" -le "${#AGENT_IDS[@]}" ]; then
      local idx=$((num - 1))
      SELECTED_AGENTS+=("${AGENT_IDS[$idx]}")
    else
      warn "Ignoring invalid selection: $num"
    fi
  done

  if [ ${#SELECTED_AGENTS[@]} -eq 0 ]; then
    error "No valid agents selected."
    exit $EXIT_NO_AGENTS
  fi

  info "Selected: ${SELECTED_AGENTS[*]}"
}

build_selected_agents() {
  # If agents were detected, use those. Otherwise, use manual selection.
  local detected_count=0
  for i in "${!AGENT_IDS[@]}"; do
    [ "${AGENT_DETECTED[$i]}" = "true" ] && detected_count=$((detected_count + 1))
  done

  if [ $detected_count -eq 0 ]; then
    prompt_agent_selection
  else
    # Use all detected agents
    for i in "${!AGENT_IDS[@]}"; do
      if [ "${AGENT_DETECTED[$i]}" = "true" ]; then
        SELECTED_AGENTS+=("${AGENT_IDS[$i]}")
      fi
    done
  fi
}

# =============================================================================
# Installation logic
# =============================================================================

INSTALL_RESULTS=()   # "agent_id:method" pairs
INSTALL_ERRORS=()

# Determine target directory for a given agent
get_target_dir() {
  local agent_id="$1"
  local home="${HOME:-$(eval echo ~)}"

  if [ "$SCOPE" = "global" ]; then
    case "$agent_id" in
      claude)   echo "$home/.claude" ;;
      codex)    echo "$home/.codex" ;;
      cursor)   echo "$home/.cursor/plugins/spark" ;;
      kimi)     echo "$home/.kimi" ;;
      opencode) echo "${OPENCODE_CONFIG_DIR:-$home/.config/opencode}" ;;
      pi)       echo "${PI_HOME:-$home/.pi}" ;;
      *)        echo "$home/.$agent_id" ;;
    esac
  else
    # Project scope: relative to current working directory
    case "$agent_id" in
      claude)   echo "$(pwd)/.claude" ;;
      codex)    echo "$(pwd)/.codex" ;;
      cursor)   echo "$(pwd)/.cursor" ;;
      kimi)     echo "$(pwd)/.kimi" ;;
      opencode) echo "$(pwd)/.opencode" ;;
      pi)       echo "$(pwd)/.pi" ;;
      *)        echo "$(pwd)/.$agent_id" ;;
    esac
  fi
}

# Try to create a symlink, fallback to copy
# Returns: "symlink" or "copy"
link_or_copy() {
  local source="$1"
  local target="$2"

  # If target already exists and points to same source, skip
  if [ -L "$target" ]; then
    local existing_target
    existing_target="$(readlink "$target" 2>/dev/null || true)"
    if [ "$existing_target" = "$source" ]; then
      return 0  # Already linked correctly
    fi
    # Remove stale symlink
    rm -f "$target"
  elif [ -e "$target" ]; then
    if $FORCE; then
      rm -rf "$target"
    else
      warn "Target already exists (not a symlink): $target"
      warn "Use --force to overwrite"
      return 1
    fi
  fi

  # Create parent directory
  mkdir -p "$(dirname "$target")"

  # Try symlink first
  if ln -s "$source" "$target" 2>/dev/null; then
    echo "symlink"
    return 0
  fi

  # Fallback to copy
  if [ -d "$source" ]; then
    cp -R "$source" "$target"
  else
    cp "$source" "$target"
  fi
  echo "copy"
  return 0
}

# Copy a file preserving permissions
copy_file() {
  local source="$1"
  local target="$2"

  mkdir -p "$(dirname "$target")"

  if [ -e "$target" ] && ! $FORCE; then
    # Check if content is identical
    if cmp -s "$source" "$target" 2>/dev/null; then
      return 0  # Already identical
    fi
  fi

  cp "$source" "$target"
  # Preserve executable permission if source has it
  if [ -x "$source" ]; then
    chmod +x "$target"
  fi
}

# Get hook files needed for a specific agent
get_agent_hook_files() {
  local agent_id="$1"

  case "$agent_id" in
    claude)
      echo "hooks/hooks.json"
      echo "hooks/run-hook.cmd"
      echo "hooks/session-start"
      ;;
    codex)
      echo "hooks/hooks-codex.json"
      echo "hooks/run-hook.cmd"
      echo "hooks/session-start-codex"
      ;;
    cursor)
      echo "hooks/hooks-cursor.json"
      echo "hooks/run-hook.cmd"
      echo "hooks/session-start"
      ;;
    kimi)
      # Kimi uses sessionStart field in plugin.json, no separate hook files
      ;;
    opencode)
      # OpenCode uses plugin JS for bootstrap, no separate hook files
      ;;
    pi)
      # Pi uses extension TS for bootstrap, no separate hook files
      ;;
  esac
}

# Get plugin manifest files for a specific agent
get_agent_manifest_files() {
  local agent_id="$1"

  case "$agent_id" in
    claude)   echo ".claude-plugin/plugin.json" ;;
    codex)    echo ".codex-plugin/plugin.json" ;;
    cursor)   echo ".cursor-plugin/plugin.json" ;;
    kimi)     echo ".kimi-plugin/plugin.json" ;;
    opencode) echo ".opencode/plugins/spark.js" ;;
    pi)       echo ".pi/extensions/spark.ts" ;;
  esac
}

install_for_agent() {
  local agent_id="$1"
  local target_dir
  target_dir="$(get_target_dir "$agent_id")"

  if $DRY_RUN; then
    info "[DRY-RUN] Would install for $agent_id at $target_dir"
    INSTALL_RESULTS+=("$agent_id:dry-run")
    return 0
  fi

  # Create target directory
  if ! mkdir -p "$target_dir" 2>/dev/null; then
    error "Cannot create directory: $target_dir"
    INSTALL_ERRORS+=("$agent_id:permission_denied")
    return 1
  fi

  local method="symlink"
  local hooks_installed=false

  # 1. Install skills — symlink the entire skills/ directory
  local skills_target="$target_dir/skills"
  local result
  result="$(link_or_copy "$SPARK_ROOT/skills" "$skills_target")" || {
    error "Failed to install skills for $agent_id"
    INSTALL_ERRORS+=("$agent_id:skills_failed")
    return 1
  }
  [ -n "$result" ] && method="$result"

  # 2. Install hooks (for shell-hook agents)
  local hook_files
  hook_files="$(get_agent_hook_files "$agent_id")"

  if [ -n "$hook_files" ]; then
    local hooks_dir="$target_dir/hooks"
    mkdir -p "$hooks_dir"

    while IFS= read -r hook_file; do
      [ -z "$hook_file" ] && continue
      local source_path="$SPARK_ROOT/$hook_file"
      local target_path="$target_dir/$hook_file"

      if [ ! -f "$source_path" ]; then
        warn "Hook file not found: $source_path"
        continue
      fi

      copy_file "$source_path" "$target_path"
    done <<< "$hook_files"

    hooks_installed=true
  fi

  # 3. Install plugin manifest (for agents that need it locally)
  local manifest_files
  manifest_files="$(get_agent_manifest_files "$agent_id")"

  if [ -n "$manifest_files" ]; then
    while IFS= read -r manifest_file; do
      [ -z "$manifest_file" ] && continue
      local source_path="$SPARK_ROOT/$manifest_file"
      local manifest_basename
      manifest_basename="$(basename "$manifest_file")"

      # For extension-style agents, install the plugin/extension file
      case "$agent_id" in
        opencode)
          # OpenCode needs the plugin JS in its plugins directory
          local oc_plugins="$target_dir/plugins"
          mkdir -p "$oc_plugins"
          copy_file "$source_path" "$oc_plugins/spark.js"
          ;;
        pi)
          # Pi needs the extension TS in its extensions directory
          local pi_ext="$target_dir/extensions"
          mkdir -p "$pi_ext"
          copy_file "$source_path" "$pi_ext/spark.ts"
          ;;
        *)
          # Shell-hook agents: copy manifest to agent-plugin dir
          local plugin_dir="$target_dir/.${agent_id}-plugin"
          # For project scope, put manifest in the target dir itself
          if [ "$SCOPE" = "project" ]; then
            plugin_dir="$(pwd)/.${agent_id}-plugin"
          fi
          if [ -f "$source_path" ]; then
            mkdir -p "$plugin_dir"
            copy_file "$source_path" "$plugin_dir/$manifest_basename"
          fi
          ;;
      esac
    done <<< "$manifest_files"
  fi

  # 4. Print agent-specific post-install notes
  case "$agent_id" in
    opencode)
      info "  Note: OpenCode also needs plugin registered in opencode.json."
      info "  Add to your opencode.json: \"plugin\": [\"spark@git+https://github.com/adityaaria/SPARK.git\"]"
      ;;
    pi)
      info "  Note: For full Pi integration, also run: pi install git:github.com/adityaaria/SPARK"
      ;;
  esac

  INSTALL_RESULTS+=("$agent_id:$method:hooks=$hooks_installed")
  success "Installed SPARK for $agent_id ($method) at $target_dir"
  return 0
}

# =============================================================================
# Lock file
# =============================================================================

write_lock_file() {
  local lock_dir
  if [ "$SCOPE" = "global" ]; then
    lock_dir="${HOME:-$(eval echo ~)}"
  else
    lock_dir="$(pwd)"
  fi

  local lock_path="$lock_dir/$LOCK_FILE_NAME"
  local timestamp
  timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +"%Y-%m-%dT%H:%M:%S")"

  if $DRY_RUN; then
    info "[DRY-RUN] Would write lock file to $lock_path"
    return 0
  fi

  # Build agents JSON manually (no jq dependency)
  local agents_json=""
  for entry in "${INSTALL_RESULTS[@]}"; do
    local agent_id method hooks_installed
    agent_id="$(echo "$entry" | cut -d: -f1)"
    method="$(echo "$entry" | cut -d: -f2)"
    hooks_installed="$(echo "$entry" | cut -d: -f3 | sed 's/hooks=//')"

    local target_dir
    target_dir="$(get_target_dir "$agent_id")"

    [ -n "$agents_json" ] && agents_json="$agents_json,"
    agents_json="$agents_json
    \"$agent_id\": {
      \"scope\": \"$SCOPE\",
      \"target\": \"$target_dir\",
      \"method\": \"$method\",
      \"hooks_installed\": $hooks_installed
    }"
  done

  cat > "$lock_path" <<EOF
{
  "installer": "spark-install.sh",
  "installer_version": "$VERSION",
  "spark_version": "$SPARK_VERSION",
  "commit": "$SPARK_COMMIT",
  "spark_root": "$SPARK_ROOT",
  "installed_at": "$timestamp",
  "scope": "$SCOPE",
  "agents": {$agents_json
  }
}
EOF

  success "Lock file written to $lock_path"
}

# =============================================================================
# Idempotency check
# =============================================================================

check_existing_install() {
  local lock_dir
  if [ "$SCOPE" = "global" ]; then
    lock_dir="${HOME:-$(eval echo ~)}"
  else
    lock_dir="$(pwd)"
  fi

  local lock_path="$lock_dir/$LOCK_FILE_NAME"

  if [ -f "$lock_path" ] && ! $FORCE; then
    local existing_version=""
    local existing_commit=""

    # Parse existing lock file without jq
    existing_version="$(grep -o '"spark_version"[[:space:]]*:[[:space:]]*"[^"]*"' "$lock_path" 2>/dev/null | grep -o '"[^"]*"$' | tr -d '"' || true)"
    existing_commit="$(grep -o '"commit"[[:space:]]*:[[:space:]]*"[^"]*"' "$lock_path" 2>/dev/null | grep -o '"[^"]*"$' | tr -d '"' || true)"

    echo ""
    warn "SPARK is already installed (version: ${existing_version:-unknown}, commit: ${existing_commit:-unknown})"

    if [ "$existing_version" = "$SPARK_VERSION" ] && [ "$existing_commit" = "$SPARK_COMMIT" ]; then
      success "Already up to date. Nothing to do."
      info "Use --force to reinstall anyway."
      exit $EXIT_SUCCESS
    fi

    info "A different version is installed. Updating..."
    info "  Installed: $existing_version ($existing_commit)"
    info "  Available: $SPARK_VERSION ($SPARK_COMMIT)"
    echo ""
  fi
}

# =============================================================================
# Uninstall
# =============================================================================

uninstall_for_agent() {
  local agent_id="$1"
  local target_dir
  target_dir="$(get_target_dir "$agent_id")"

  if [ ! -d "$target_dir" ]; then
    return 0
  fi

  info "Removing SPARK from $agent_id at $target_dir"

  # 1. Remove skills symlink/directory
  if [ -e "$target_dir/skills" ]; then
    rm -rf "$target_dir/skills"
  fi

  # 2. Remove hooks
  local hook_files
  hook_files="$(get_agent_hook_files "$agent_id")"
  if [ -n "$hook_files" ]; then
    while IFS= read -r hook_file; do
      [ -z "$hook_file" ] && continue
      rm -f "$target_dir/$hook_file"
    done <<< "$hook_files"
    # Try to remove hooks dir if empty
    rmdir "$target_dir/hooks" 2>/dev/null || true
  fi

  # 3. Remove plugin manifests
  local manifest_files
  manifest_files="$(get_agent_manifest_files "$agent_id")"
  if [ -n "$manifest_files" ]; then
    while IFS= read -r manifest_file; do
      [ -z "$manifest_file" ] && continue
      rm -f "$target_dir/$manifest_file"
      local manifest_dir
      manifest_dir="$(dirname "$target_dir/$manifest_file")"
      rmdir "$manifest_dir" 2>/dev/null || true
    done <<< "$manifest_files"
  fi

  # 4. Remove agent dir if totally empty
  rmdir "$target_dir" 2>/dev/null || true
}

perform_uninstall() {
  header "SPARK Uninstaller"

  local lock_dir
  if [ "$SCOPE" = "global" ]; then
    lock_dir="${HOME:-$(eval echo ~)}"
  else
    lock_dir="$(pwd)"
  fi
  local lock_path="$lock_dir/$LOCK_FILE_NAME"

  # Detect agents
  info "Detecting installed agents to clean up..."
  detect_agents || true
  build_selected_agents

  for agent_id in "${SELECTED_AGENTS[@]}"; do
    uninstall_for_agent "$agent_id"
  done

  if [ -f "$lock_path" ]; then
    rm -f "$lock_path"
    info "Removed lock file: $lock_path"
  fi

  echo ""
  success "SPARK has been safely uninstalled."
  exit $EXIT_SUCCESS
}

# =============================================================================
# Summary
# =============================================================================

print_summary() {
  header "Installation Summary"

  echo "  SPARK version:  $SPARK_VERSION"
  echo "  Commit:         ${SPARK_COMMIT:0:12}"
  echo "  Scope:          $SCOPE"
  echo "  Skills:         ${#SKILL_NAMES[@]} installed"
  echo ""

  if [ ${#INSTALL_RESULTS[@]} -gt 0 ]; then
    echo "  Agents:"
    for entry in "${INSTALL_RESULTS[@]}"; do
      local agent_id method
      agent_id="$(echo "$entry" | cut -d: -f1)"
      method="$(echo "$entry" | cut -d: -f2)"
      local target_dir
      target_dir="$(get_target_dir "$agent_id")"
      printf "    ${C_GREEN}■${C_RESET} %-15s → %s ${C_DIM}(%s)${C_RESET}\n" "$agent_id" "$target_dir" "$method"
    done
  fi

  if [ ${#INSTALL_ERRORS[@]} -gt 0 ]; then
    echo ""
    echo "  Errors:"
    for entry in "${INSTALL_ERRORS[@]}"; do
      printf "    ${C_RED}■${C_RESET} %s\n" "$entry"
    done
  fi

  echo ""
  success "Start a fresh agent session to confirm using-spark loads before coding."
  echo ""
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

  if $UNINSTALL; then
    perform_uninstall
  fi

  header "SPARK Native Installer"

  # Step 1: Resolve repo
  info "Resolving SPARK repository..."
  resolve_spark_root
  detect_version
  info "SPARK root: $SPARK_ROOT"
  info "Version: $SPARK_VERSION (${SPARK_COMMIT:0:12})"

  # Step 2: Check existing install
  check_existing_install

  # Step 3: Discover skills
  info "Discovering skills..."
  discover_skills

  # Step 4: Detect agents
  echo ""
  info "Detecting installed agents..."
  detect_agents || true  # detect_agents returns count via exit code

  # Step 5: Build selection
  build_selected_agents

  if [ ${#SELECTED_AGENTS[@]} -eq 0 ]; then
    error "No agents to install for."
    exit $EXIT_NO_AGENTS
  fi

  # Step 6: Install for each selected agent
  echo ""
  header "Installing"

  local total=${#SELECTED_AGENTS[@]}
  local current=0
  for agent_id in "${SELECTED_AGENTS[@]}"; do
    current=$((current + 1))
    step "$current" "$total" "Installing for $agent_id..."
    install_for_agent "$agent_id" || true
  done

  # Step 7: Write lock file
  if [ ${#INSTALL_RESULTS[@]} -gt 0 ]; then
    echo ""
    write_lock_file
  fi

  # Step 8: Summary
  print_summary

  # Exit with error if any installs failed
  if [ ${#INSTALL_ERRORS[@]} -gt 0 ]; then
    exit $EXIT_INSTALL_FAILED
  fi

  exit $EXIT_SUCCESS
}

main "$@"
