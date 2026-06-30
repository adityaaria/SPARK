import { createAdapter } from './common.js';
import { stageClaudePlugin } from './claude-staging.js';
import { stageCodexPlugin } from './codex-staging.js';
import { installCursorPlugin } from './cursor-staging.js';
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
    successMessage: 'Installed SPARK for Claude Code.',
    commands: [
      {
        file: 'claude',
        args: ['plugin', 'marketplace', 'add', '{relativeMarketplaceRoot}'],
      },
      {
        file: 'claude',
        args: ['plugin', 'install', 'spark@{marketplaceName}'],
      },
    ],
    automatedSteps: [
      'Stage a local Claude Code marketplace at .spark/claude-marketplace.',
      'Register the local marketplace with Claude Code.',
      'Install the spark plugin from that marketplace.',
    ],
    customInstall({ cwd, dryRun }) {
      return stageClaudePlugin({ cwd, packageRoot, dryRun });
    },
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
    successMessage: 'Installed SPARK for Codex.',
    commands: [
      {
        file: 'codex',
        args: ['plugin', 'marketplace', 'add', '{relativeMarketplaceRoot}'],
      },
      {
        file: 'codex',
        args: ['plugin', 'add', 'spark'],
      },
    ],
    automatedSteps: [
      'Stage a local Codex marketplace at .spark/codex-marketplace.',
      'Register the local marketplace with Codex.',
      'Install the spark plugin from that marketplace.',
    ],
    customInstall({ cwd, dryRun }) {
      return stageCodexPlugin({ cwd, packageRoot, dryRun });
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
    verifyHint: 'Restart Cursor fully, then confirm using-spark loads in a fresh Agent session.',
    successMessage: 'Installed SPARK for Cursor.',
    automatedSteps: [
      'Copy the SPARK plugin into ~/.cursor/plugins/spark.',
      'Restart Cursor fully to load the new plugin.',
      'Start a fresh Cursor Agent session and confirm using-spark loads before coding.',
    ],
    customInstall({ env, dryRun }) {
      return installCursorPlugin({ packageRoot, env, dryRun });
    },
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
