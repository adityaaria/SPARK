import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createClaudeCodeAdapter,
  createCodexAdapter,
  createCopilotAdapter,
  createCursorAdapter,
} from '../../src/installer/adapters/shell-hook.js';

test('shell-hook adapters expose stable identifiers and plans', () => {
  const adapters = [
    createClaudeCodeAdapter(),
    createCodexAdapter(),
    createCursorAdapter(),
    createCopilotAdapter(),
  ];

  assert.deepEqual(
    adapters.map((adapter) => adapter.id),
    ['claude', 'codex', 'cursor', 'copilot']
  );

  for (const adapter of adapters) {
    const plan = adapter.planInstall();
    assert.equal(plan.kind, 'shell-hook');
    assert.match(plan.bootstrap, /using-spark/);
    assert.ok(plan.installHint.length > 0);
    assert.ok(plan.verifyHint.length > 0);
  }
});

test('shell-hook adapters describe the committed repository artifacts they rely on', () => {
  const claude = createClaudeCodeAdapter();
  const codex = createCodexAdapter();
  const cursor = createCursorAdapter();
  const copilot = createCopilotAdapter();

  assert.match(claude.planInstall().installHint, /\.claude-plugin\/plugin\.json/);
  assert.match(codex.planInstall().installHint, /\.codex-plugin\/plugin\.json/);
  assert.match(cursor.planInstall().installHint, /\.cursor-plugin\/plugin\.json/);
  assert.match(copilot.planInstall().installHint, /copilot-tools\.md/);
});

test('shell-hook adapters expose either automated commands or explicit interactive steps', () => {
  const claude = createClaudeCodeAdapter().planInstall();
  const codex = createCodexAdapter().planInstall();
  const cursor = createCursorAdapter().planInstall();
  const copilot = createCopilotAdapter().planInstall();

  assert.equal(claude.automated, true);
  assert.deepEqual(claude.manualSteps, []);
  assert.deepEqual(claude.automatedSteps, [
    'Stage a local Claude Code marketplace at .spark/claude-marketplace.',
    'Register the local marketplace with Claude Code.',
    'Install the spark plugin from that marketplace.',
  ]);
  assert.deepEqual(
    claude.commands.map((command) => [command.file, ...command.args]),
    [
      ['claude', 'plugin', 'marketplace', 'add', '{relativeMarketplaceRoot}'],
      ['claude', 'plugin', 'install', 'spark@{marketplaceName}'],
    ]
  );

  assert.equal(codex.automated, true);
  assert.deepEqual(codex.automatedSteps, [
    'Stage a local Codex marketplace at .spark/codex-marketplace.',
    'Register the local marketplace with Codex.',
    'Install the spark plugin from that marketplace.',
  ]);
  assert.deepEqual(
    codex.commands.map((command) => [command.file, ...command.args]),
    [
      ['codex', 'plugin', 'marketplace', 'add', '{relativeMarketplaceRoot}'],
      ['codex', 'plugin', 'add', 'spark'],
    ]
  );

  assert.equal(cursor.automated, true);
  assert.deepEqual(cursor.automatedSteps, [
    'Copy the SPARK plugin into ~/.cursor/plugins/spark.',
    'Restart Cursor fully to load the new plugin.',
    'Start a fresh Cursor Agent session and confirm using-spark loads before coding.',
  ]);

  assert.equal(copilot.automated, true);
  assert.deepEqual(
    copilot.commands.map((command) => [command.file, ...command.args]),
    [
      ['copilot', 'plugin', 'marketplace', 'add', 'adityaaria/SPARK-marketplace'],
      ['copilot', 'plugin', 'install', 'spark@spark-marketplace'],
    ]
  );
});
