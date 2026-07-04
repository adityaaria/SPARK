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
UPDATE=false
VERBOSE=false
AUTO_INSTALL_YES=false
MANUAL_AGENTS_ARG=""

parse_args() {
  while [ $# -gt 0 ]; do
    case "$1" in
      -g|--global)  SCOPE="global" ;;
      --force)      FORCE=true ;;
      --dry-run)    DRY_RUN=true ;;
      -u|--uninstall) UNINSTALL=true ;;
      --update)     UPDATE=true ;;
      -v|--verbose) VERBOSE=true ;;
      -h|--help)    HELP=true ;;
      -y|--yes)     AUTO_INSTALL_YES=true ;;
      --agent=*)    MANUAL_AGENTS_ARG="${1#*=}" ;;
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
    -g, --global    Install to global agent config (~/.agents/skills/)
                    Default: project scope (./.agents/skills/)
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
  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

  # Read version from bundled package.json (relative to script location)
  if command -v node >/dev/null 2>&1 && [ -f "$script_dir/../package.json" ]; then
    SPARK_VERSION="$(node -e "console.log(require('$script_dir/../package.json').version)" 2>/dev/null || echo "")"
  fi

  # Fallback: parse version from package.json without jq/node
  if [ -z "$SPARK_VERSION" ] && [ -f "$script_dir/../package.json" ]; then
    SPARK_VERSION="$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "$script_dir/../package.json" | head -1 | grep -o '"[^"]*"$' | tr -d '"')"
  fi

  if [ -z "$SPARK_VERSION" ]; then SPARK_VERSION="unknown"; fi

  # Detect git commit SHA only if git repo exists
  if command -v git >/dev/null 2>&1 && [ -d "$SPARK_ROOT/.git" ]; then
    SPARK_COMMIT="$(git -C "$SPARK_ROOT" rev-parse HEAD 2>/dev/null || echo "n/a")"
  else
    SPARK_COMMIT="n/a"
  fi
  if [ -n "$SPARK_VERSION" ] && [ "$SPARK_VERSION" != "unknown" ]; then
    VERSION="$SPARK_VERSION"
  fi
}

run_with_timeout_capture() {
  local timeout_secs="$1"
  shift

  local tmp_out
  tmp_out="$(mktemp)"

  "$@" >"$tmp_out" 2>/dev/null &
  local cmd_pid=$!
  local elapsed=0

  while kill -0 "$cmd_pid" 2>/dev/null; do
    if [ "$elapsed" -ge "$timeout_secs" ]; then
      kill "$cmd_pid" 2>/dev/null || true
      wait "$cmd_pid" 2>/dev/null || true
      rm -f "$tmp_out"
      return 124
    fi

    sleep 1
    elapsed=$((elapsed + 1))
  done

  wait "$cmd_pid" 2>/dev/null || true
  cat "$tmp_out"
  rm -f "$tmp_out"
}

check_registry_version() {
  if ! command -v npm >/dev/null 2>&1; then
    return 0
  fi

  local latest
  latest="$(run_with_timeout_capture 5 npm show @adityaaria/spark version | tr -d '\r\n ' || echo "")"
  if [ -n "$latest" ] && [ "$SPARK_VERSION" != "$latest" ] && [ "$SPARK_VERSION" != "unknown" ]; then
    warn "Newer version available: $latest"
    printf "    Run: npm cache clean --force && rm -rf ~/.npm/_npx/ && npx @adityaaria/spark@latest install --force\n" >&2
  fi
}

write_file_atomically() {
  local target_path="$1"
  local tmp_path
  tmp_path="$(mktemp "${target_path}.tmp.XXXXXX")"

  cat > "$tmp_path"
  mv "$tmp_path" "$target_path"
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

  # 1. Claude Code
  if [ -d "$home/.claude" ] || [ -n "${CLAUDE_PLUGIN_ROOT:-}" ] || command_exists claude || command_exists claude-code; then
    local reason=""
    [ -d "$home/.claude" ] && reason="config:~/.claude"
    [ -n "${CLAUDE_PLUGIN_ROOT:-}" ] && reason="${reason:+$reason, }env:CLAUDE_PLUGIN_ROOT"
    (command_exists claude || command_exists claude-code) && reason="${reason:+$reason, }path:claude"
    register_agent "claude-code" "Claude Code" "true" "$reason"
  else
    register_agent "claude-code" "Claude Code" "false" ""
  fi

  # 2. Codex CLI
  if [ -d "$home/.codex" ] || command_exists codex || command_exists codex-cli; then
    local reason=""
    [ -d "$home/.codex" ] && reason="config:~/.codex"
    (command_exists codex || command_exists codex-cli) && reason="${reason:+$reason, }path:codex"
    register_agent "codex-cli" "Codex CLI" "true" "$reason"
  else
    register_agent "codex-cli" "Codex CLI" "false" ""
  fi

  # 3. Cursor
  if [ -d "$home/.cursor" ] || [ -n "${CURSOR_PLUGIN_ROOT:-}" ] || command_exists cursor; then
    local reason=""
    [ -d "$home/.cursor" ] && reason="config:~/.cursor"
    [ -n "${CURSOR_PLUGIN_ROOT:-}" ] && reason="${reason:+$reason, }env:CURSOR_PLUGIN_ROOT"
    command_exists cursor && reason="${reason:+$reason, }path:cursor"
    register_agent "cursor" "Cursor" "true" "$reason"
  else
    register_agent "cursor" "Cursor" "false" ""
  fi

  # 4. Antigravity
  if [ -d "$home/.agy" ] || command_exists agy || command_exists antigravity; then
    local reason=""
    [ -d "$home/.agy" ] && reason="config:~/.agy"
    (command_exists agy || command_exists antigravity) && reason="${reason:+$reason, }path:agy"
    register_agent "antigravity" "Antigravity" "true" "$reason"
  else
    register_agent "antigravity" "Antigravity" "false" ""
  fi

  # 5. Gemini
  if [ -d "$home/.gemini" ] || command_exists gemini; then
    local reason=""
    [ -d "$home/.gemini" ] && reason="config:~/.gemini"
    command_exists gemini && reason="${reason:+$reason, }path:gemini"
    register_agent "gemini" "Gemini CLI" "true" "$reason"
  else
    register_agent "gemini" "Gemini CLI" "false" ""
  fi

  # 6. Copilot
  if [ -d "$home/.copilot" ] || command_exists copilot || command_exists gh-copilot; then
    local reason=""
    [ -d "$home/.copilot" ] && reason="config:~/.copilot"
    (command_exists copilot || command_exists gh-copilot) && reason="${reason:+$reason, }path:copilot"
    register_agent "copilot" "GitHub Copilot" "true" "$reason"
  else
    register_agent "copilot" "GitHub Copilot" "false" ""
  fi

  # 7. Kimi
  if [ -d "$home/.kimi" ] || command_exists kimi; then
    local reason=""
    [ -d "$home/.kimi" ] && reason="config:~/.kimi"
    command_exists kimi && reason="${reason:+$reason, }path:kimi"
    register_agent "kimi" "Kimi Code" "true" "$reason"
  else
    register_agent "kimi" "Kimi Code" "false" ""
  fi

  # 8. OpenCode
  local oc_config="${OPENCODE_CONFIG_DIR:-$home/.config/opencode}"
  if [ -d "$oc_config" ] || [ -d "$home/.opencode" ] || command_exists opencode; then
    local reason=""
    [ -d "$oc_config" ] || [ -d "$home/.opencode" ] && reason="config:opencode"
    [ -n "${OPENCODE_CONFIG_DIR:-}" ] && reason="${reason:+$reason, }env:OPENCODE_CONFIG_DIR"
    command_exists opencode && reason="${reason:+$reason, }path:opencode"
    register_agent "opencode" "OpenCode" "true" "$reason"
  else
    register_agent "opencode" "OpenCode" "false" ""
  fi

  # 9. Factory
  if [ -d "$home/.factory" ] || command_exists factory || command_exists droid; then
    local reason=""
    [ -d "$home/.factory" ] && reason="config:~/.factory"
    (command_exists factory || command_exists droid) && reason="${reason:+$reason, }path:factory"
    register_agent "factory" "Factory Droid" "true" "$reason"
  else
    register_agent "factory" "Factory Droid" "false" ""
  fi

  # 10. Pi
  if [ -n "${PI_HOME:-}" ] || [ -d "$home/.pi" ] || command_exists pi; then
    local reason=""
    [ -n "${PI_HOME:-}" ] || [ -d "$home/.pi" ] && reason="config:~/.pi"
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

show_interactive_menu() {
  select_from_input() {
    local input="$1"

    local normalized="$input"
    normalized="${normalized//,/ }"

    local chosen_agents=()
    for token in $normalized; do
      if [[ "$token" =~ ^[0-9]+$ ]] && [ "$token" -ge 0 ] && [ "$token" -lt "${#AGENT_IDS[@]}" ]; then
        chosen_agents+=("${AGENT_IDS[$token]}")
      else
        warn "Ignoring invalid choice: $token"
      fi
    done

    if [ ${#chosen_agents[@]} -eq 0 ]; then
      return 1
    fi

    SELECTED_AGENTS=("${chosen_agents[@]}")
    return 0
  }

  while true; do
    echo ""
    echo "Select which agents to install SPARK for:"
    echo ""
    for i in "${!AGENT_IDS[@]}"; do
      local label="${AGENT_LABELS[$i]}"
      if [ "${AGENT_DETECTED[$i]}" = "true" ]; then
        printf "  ${C_BOLD}%d)${C_RESET} %s ${C_GREEN}(detected)${C_RESET}\n" "$i" "$label"
      else
        printf "  ${C_BOLD}%d)${C_RESET} %s\n" "$i" "$label"
      fi
    done
    echo ""
    printf "Enter agent number(s) separated by spaces or commas. Press Enter to use detected agents: "
    read -r input || {
      error "Interactive selection aborted before any agent was chosen."
      exit $EXIT_NO_AGENTS
    }

    if [ -z "$input" ]; then
      SELECTED_AGENTS=()
      for i in "${!AGENT_IDS[@]}"; do
        if [ "${AGENT_DETECTED[$i]}" = "true" ]; then
          SELECTED_AGENTS+=("${AGENT_IDS[$i]}")
        fi
      done
      if [ ${#SELECTED_AGENTS[@]} -eq 0 ]; then
        warn "No detected agents available. Enter at least one agent number."
        continue
      fi
      break
    else
      if ! select_from_input "$input"; then
        warn "No valid agent numbers found."
        continue
      fi
      break
    fi
  done

  if [ ${#SELECTED_AGENTS[@]} -gt 0 ]; then
    info "Selected: ${SELECTED_AGENTS[*]}"
  fi
}

prompt_agent_selection() {
  show_interactive_menu
}

auto_install_detected() {
  local detected_count=0
  for i in "${!AGENT_IDS[@]}"; do
    if [ "${AGENT_DETECTED[$i]}" = "true" ]; then
      SELECTED_AGENTS+=("${AGENT_IDS[$i]}")
      detected_count=$((detected_count + 1))
    fi
  done
  if [ "$detected_count" -eq 0 ]; then
    error "No coding agents detected automatically."
    error "Run interactively or specify target agent with --agent=<names>."
    exit $EXIT_NO_AGENTS
  fi
  info "Auto-selecting detected agents: ${SELECTED_AGENTS[*]}"
}

build_selected_agents() {
  # 1. Manual argument (--agent=name1,name2)
  if [ -n "$MANUAL_AGENTS_ARG" ]; then
    local old_ifs="$IFS"
    IFS=','
    for arg in $MANUAL_AGENTS_ARG; do
      arg="$(echo "$arg" | tr -d ' ')"
      for i in "${!AGENT_IDS[@]}"; do
        if [ "${AGENT_IDS[$i]}" = "$arg" ] || [ "${AGENT_LABELS[$i]}" = "$arg" ]; then
          SELECTED_AGENTS+=("${AGENT_IDS[$i]}")
        fi
      done
    done
    IFS="$old_ifs"
    if [ ${#SELECTED_AGENTS[@]} -eq 0 ]; then
      error "No matching agents found for --agent=$MANUAL_AGENTS_ARG"
      exit $EXIT_NO_AGENTS
    fi
    return
  fi

  # 2. Non-interactive flag (-y / --yes)
  if [ "$AUTO_INSTALL_YES" = "true" ]; then
    auto_install_detected
    return
  fi

  # 3. TTY check
  if [ "${SPARK_FORCE_INTERACTIVE:-false}" = "true" ] || { [ -t 0 ] && [ -t 1 ] && [ -z "${CI:-}" ]; }; then
    show_interactive_menu
  else
    auto_install_detected  # fallback untuk CI/non-TTY
  fi
}

# =============================================================================
# Installation logic
# =============================================================================

INSTALL_RESULTS=()   # "agent_id:method" pairs
INSTALL_ERRORS=()
GITIGNORE_ENTRIES=""

# Determine target directory for a given agent
get_target_dir() {
  local agent_id="$1"
  local home="${HOME:-$(eval echo ~)}"

  if [ "$SCOPE" = "global" ]; then
    case "$agent_id" in
      claude|claude-code) echo "$home/.claude" ;;
      codex|codex-cli)    echo "$home/.codex" ;;
      cursor)             echo "$home/.cursor/plugins/spark" ;;
      antigravity)        echo "$home/.agy" ;;
      gemini)             echo "$home/.gemini" ;;
      copilot)            echo "$home/.copilot" ;;
      kimi)               echo "$home/.kimi" ;;
      opencode)           echo "${OPENCODE_CONFIG_DIR:-$home/.config/opencode}" ;;
      factory)            echo "$home/.factory" ;;
      pi)                 echo "${PI_HOME:-$home/.pi}" ;;
      *)                  echo "$home/.$agent_id" ;;
    esac
  else
    # Project scope: relative to current working directory
    case "$agent_id" in
      claude|claude-code) echo "$(pwd)/.claude" ;;
      codex|codex-cli)    echo "$(pwd)/.codex" ;;
      cursor)             echo "$(pwd)/.cursor" ;;
      antigravity)        echo "$(pwd)/.agy" ;;
      gemini)             echo "$(pwd)/.gemini" ;;
      copilot)            echo "$(pwd)/.github" ;;
      kimi)               echo "$(pwd)/.kimi" ;;
      opencode)           echo "$(pwd)/.opencode" ;;
      factory)            echo "$(pwd)/.factory" ;;
      pi)                 echo "$(pwd)/.pi" ;;
      *)                  echo "$(pwd)/.$agent_id" ;;
    esac
  fi
}

register_gitignore_entry() {
  local entry="$1"
  [ "$SCOPE" != "project" ] && return 0
  [ -z "$entry" ] && return 0

  case "
$GITIGNORE_ENTRIES
" in
    *"
$entry
"*) return 0 ;;
  esac

  if [ -n "$GITIGNORE_ENTRIES" ]; then
    GITIGNORE_ENTRIES="$GITIGNORE_ENTRIES
$entry"
  else
    GITIGNORE_ENTRIES="$entry"
  fi
}

ensure_project_gitignore() {
  [ "$SCOPE" != "project" ] && return 0
  [ "$DRY_RUN" = "true" ] && return 0
  if [ -z "$GITIGNORE_ENTRIES" ]; then
    return 0
  fi

  local gitignore_path
  gitignore_path="$(pwd)/.gitignore"
  [ -f "$gitignore_path" ] || : > "$gitignore_path"

  local entry
  while IFS= read -r entry; do
    [ -z "$entry" ] && continue
    if ! grep -Fqx "$entry" "$gitignore_path" 2>/dev/null; then
      printf "%s\n" "$entry" >> "$gitignore_path"
    fi
  done <<EOF
$GITIGNORE_ENTRIES
EOF

  success "Updated .gitignore with SPARK-managed project artifacts"
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
      warn "Use --force to overwrite. Skipping."
      echo "existing"
      return 0
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
    claude|claude-code)
      echo "hooks/hooks.json"
      echo "hooks/run-hook.cmd"
      echo "hooks/session-start"
      ;;
    codex|codex-cli)
      echo "hooks/hooks-codex.json"
      echo "hooks/run-hook.cmd"
      echo "hooks/session-start-codex"
      ;;
    cursor)
      echo "hooks/hooks-cursor.json"
      echo "hooks/run-hook.cmd"
      echo "hooks/session-start"
      ;;
    kimi|opencode|pi|antigravity|gemini|copilot|factory)
      # Using native/other bootstrap methods, no separate hook files needed here
      ;;
  esac
}

# Get plugin manifest files for a specific agent
get_agent_manifest_files() {
  local agent_id="$1"

  case "$agent_id" in
    claude|claude-code) echo ".claude-plugin/plugin.json" ;;
    codex|codex-cli)    echo ".codex-plugin/plugin.json" ;;
    cursor)      echo ".cursor-plugin/plugin.json" ;;
    kimi)        echo ".kimi-plugin/plugin.json" ;;
    opencode)    echo ".opencode/plugins/spark.js" ;;
    pi)          echo ".pi/extensions/spark.ts" ;;
    *)           ;;
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

  local skills_target="$target_dir/skills"
  register_gitignore_entry "$(gitignore_pattern_for_path "$skills_target" "dir")"
  if [ -e "$skills_target" ] && ! $FORCE; then
    warn "Skills directory already exists for $agent_id at $skills_target. Skipping (use --force to overwrite)."
    INSTALL_RESULTS+=("$agent_id:existing")
    return 0
  fi

  local method="symlink"
  local hooks_installed=false

  # 1. Install skills — symlink the entire skills/ directory
  local result
  result="$(link_or_copy "$SPARK_ROOT/skills" "$skills_target")" || {
    error "Failed to install skills for $agent_id"
    INSTALL_ERRORS+=("$agent_id:skills_failed")
    return 1
  }
  [ -n "$result" ] && method="$result"

  if [ ! -r "$skills_target/using-spark/SKILL.md" ]; then
    error "Installed skills for $agent_id are incomplete or unreadable at $skills_target"
    INSTALL_ERRORS+=("$agent_id:skills_unreadable")
    return 1
  fi

  # 2. Install hooks (for shell-hook agents)
  local hook_files
  hook_files="$(get_agent_hook_files "$agent_id")"

  if [ -n "$hook_files" ]; then
    local hooks_dir="$target_dir/hooks"
    mkdir -p "$hooks_dir"
    register_gitignore_entry "$(gitignore_pattern_for_path "$hooks_dir" "dir")"

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
          register_gitignore_entry "$(gitignore_pattern_for_path "$oc_plugins" "dir")"
          copy_file "$source_path" "$oc_plugins/spark.js"
          ;;
        pi)
          # Pi needs the extension TS in its extensions directory
          local pi_ext="$target_dir/extensions"
          mkdir -p "$pi_ext"
          register_gitignore_entry "$(gitignore_pattern_for_path "$pi_ext" "dir")"
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
            register_gitignore_entry "$(gitignore_pattern_for_path "$plugin_dir" "dir")"
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
  register_gitignore_entry "$(gitignore_pattern_for_path "$lock_path" "file")"
  local timestamp
  timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +"%Y-%m-%dT%H:%M:%S")"

  if $DRY_RUN; then
    info "[DRY-RUN] Would write lock file to $lock_path"
    return 0
  fi

  # Build agents JSON manually (no jq dependency)
  local agents_arr_str=""
  local agents_json=""
  for entry in "${INSTALL_RESULTS[@]}"; do
    local agent_id method hooks_installed
    agent_id="$(echo "$entry" | cut -d: -f1)"
    method="$(echo "$entry" | cut -d: -f2)"
    hooks_installed="$(echo "$entry" | cut -d: -f3 | sed 's/hooks=//')"

    local target_dir
    target_dir="$(get_target_dir "$agent_id")"

    [ -n "$agents_arr_str" ] && agents_arr_str="$agents_arr_str, "
    agents_arr_str="$agents_arr_str\"$agent_id\""

    [ -n "$agents_json" ] && agents_json="$agents_json,"
    agents_json="$agents_json
    \"$agent_id\": {
      \"scope\": \"$SCOPE\",
      \"target\": \"$target_dir\",
      \"method\": \"$method\",
      \"hooks_installed\": ${hooks_installed:-false}
    }"
  done

  local inst_name="spark-install.sh"
  if [ -n "${SPARK_INSTALLER:-}" ]; then
    inst_name="$SPARK_INSTALLER"
  elif [ -n "${npm_execpath:-}" ] || [ -n "${npm_config_user_agent:-}" ] || [[ "$SPARK_ROOT" =~ _npx ]]; then
    inst_name="npx"
  fi

  write_file_atomically "$lock_path" <<EOF
{
  "version": "$VERSION",
  "installedAt": "$timestamp",
  "sha": "$SPARK_COMMIT",
  "scope": "$SCOPE",
  "agents": [$agents_arr_str],
  "installer": "$inst_name",
  "installer_version": "$VERSION",
  "spark_version": "$SPARK_VERSION",
  "commit": "$SPARK_COMMIT",
  "spark_root": "$SPARK_ROOT",
  "installed_at": "$timestamp",
  "agents_map": {$agents_json
  }
}
EOF

  success "Lock file written to $lock_path"
}

gitignore_pattern_for_path() {
  local target="$1"
  local kind="${2:-file}"
  local project_root
  project_root="$(pwd)"

  case "$target" in
    "$project_root"/*)
      target="${target#"$project_root"/}"
      ;;
  esac

  target="${target#./}"
  target="/$target"

  if [ "$kind" = "dir" ]; then
    target="${target%/}/"
  fi

  printf "%s" "$target"
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
    if [ -z "$existing_version" ]; then
      existing_version="$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "$lock_path" 2>/dev/null | head -1 | grep -o '"[^"]*"$' | tr -d '"' || true)"
    fi
    existing_commit="$(grep -o '"commit"[[:space:]]*:[[:space:]]*"[^"]*"' "$lock_path" 2>/dev/null | grep -o '"[^"]*"$' | tr -d '"' || true)"
    if [ -z "$existing_commit" ]; then
      existing_commit="$(grep -o '"sha"[[:space:]]*:[[:space:]]*"[^"]*"' "$lock_path" 2>/dev/null | head -1 | grep -o '"[^"]*"$' | tr -d '"' || true)"
    fi

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
    resolve_spark_root
    if [ -f "$SPARK_ROOT/bin/spark-uninstall.sh" ]; then
      bash "$SPARK_ROOT/bin/spark-uninstall.sh" "$@"
      exit $?
    fi
    perform_uninstall
  fi

  if $UPDATE; then
    resolve_spark_root
    if [ -f "$SPARK_ROOT/bin/spark-update.sh" ]; then
      bash "$SPARK_ROOT/bin/spark-update.sh" "$@"
      exit $?
    fi
    error "Requested --update, but $SPARK_ROOT/bin/spark-update.sh is missing."
    exit $EXIT_INSTALL_FAILED
  fi

  header "SPARK Native Installer"

  # Step 1: Resolve repo
  info "Resolving SPARK repository..."
  resolve_spark_root
  detect_version
  info "SPARK root: $SPARK_ROOT"
  if [ "$SPARK_COMMIT" != "n/a" ] && [ "$SPARK_COMMIT" != "unknown" ]; then
    info "Version: $SPARK_VERSION (${SPARK_COMMIT:0:12})"
  else
    info "Version: $SPARK_VERSION"
  fi
  check_registry_version

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
  local labels_str=""
  for agent_id in "${SELECTED_AGENTS[@]}"; do
    for i in "${!AGENT_IDS[@]}"; do
      if [ "${AGENT_IDS[$i]}" = "$agent_id" ]; then
        if [ -z "$labels_str" ]; then
          labels_str="${AGENT_LABELS[$i]}"
        else
          labels_str="$labels_str, ${AGENT_LABELS[$i]}"
        fi
      fi
    done
  done
  echo "Installing to: $labels_str"
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
    ensure_project_gitignore
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
