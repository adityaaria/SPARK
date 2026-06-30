import { createAdapter } from './common.js';
import { stageCodexPlugin } from './codex-staging.js';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

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
    manualSteps: [
      '/plugin install spark@claude-plugins-official',
    ],
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
    verifyHint: 'Open Codex plugin install, point it at .spark/codex-plugin, then confirm using-spark loads in a fresh session.',
    successMessage: 'Staged SPARK for Codex in .spark/codex-plugin.',
    automatedSteps: [
      'Stage a project-local Codex plugin bundle at .spark/codex-plugin.',
      'Open Codex plugin install and point it at .spark/codex-plugin.',
    ],
    customInstall({ cwd }) {
      return stageCodexPlugin({ cwd, packageRoot });
    },
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
    manualSteps: [
      '/add-plugin spark',
    ],
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
    commands: [
      {
        file: 'copilot',
        args: ['plugin', 'marketplace', 'add', 'adityaaria/SPARK-marketplace'],
      },
      {
        file: 'copilot',
        args: ['plugin', 'install', 'spark@spark-marketplace'],
      },
    ],
  });
}
