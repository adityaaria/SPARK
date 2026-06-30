import { createAdapter } from './common.js';

export function createClaudeCodeAdapter() {
  return createAdapter({
    id: 'claude',
    label: 'Claude Code',
    kind: 'shell-hook',
    envKeys: ['CLAUDE_PLUGIN_ROOT'],
    binaryNames: ['claude'],
    bootstrap: 'shell hook -> hooks/session-start -> using-spark',
    installHint: '.claude-plugin/plugin.json + hooks/hooks.json + hooks/session-start',
    verifyHint: 'Run a fresh Claude Code session and confirm using-spark loads before coding.',
  });
}

export function createCodexAdapter() {
  return createAdapter({
    id: 'codex',
    label: 'Codex',
    kind: 'shell-hook',
    envKeys: ['CLAUDE_PLUGIN_ROOT'],
    binaryNames: ['codex'],
    bootstrap: 'shell hook -> hooks/session-start-codex -> using-spark',
    installHint: '.codex-plugin/plugin.json + hooks/hooks-codex.json + hooks/session-start-codex',
    verifyHint: 'Run a fresh Codex session and confirm using-spark loads before coding.',
  });
}

export function createCursorAdapter() {
  return createAdapter({
    id: 'cursor',
    label: 'Cursor',
    kind: 'shell-hook',
    envKeys: ['CURSOR_PLUGIN_ROOT'],
    binaryNames: ['cursor'],
    bootstrap: 'shell hook -> hooks/session-start -> using-spark',
    installHint: '.cursor-plugin/plugin.json + hooks/hooks-cursor.json + hooks/session-start',
    verifyHint: 'Run a fresh Cursor Agent session and confirm using-spark loads before coding.',
  });
}

export function createCopilotAdapter() {
  return createAdapter({
    id: 'copilot',
    label: 'Copilot CLI',
    kind: 'shell-hook',
    envKeys: ['COPILOT_CLI'],
    binaryNames: ['copilot'],
    bootstrap: 'shell hook -> hooks/session-start -> using-spark',
    installHint: 'skills/using-spark/references/copilot-tools.md + hooks/session-start',
    verifyHint: 'Run a fresh Copilot CLI session and confirm using-spark loads before coding.',
    command: {
      file: 'copilot',
      args: ['plugin', 'install', 'spark@spark-marketplace'],
    },
  });
}
