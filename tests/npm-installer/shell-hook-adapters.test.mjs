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

  assert.equal(claude.automated, false);
  assert.deepEqual(claude.manualSteps, ['/plugin install spark@claude-plugins-official']);

  assert.equal(codex.automated, true);
  assert.deepEqual(codex.automatedSteps, [
    'Stage a project-local Codex plugin bundle at .spark/codex-plugin.',
    'Open Codex plugin install and point it at .spark/codex-plugin.',
  ]);

  assert.equal(cursor.automated, false);
  assert.deepEqual(cursor.manualSteps, ['/add-plugin spark']);

  assert.equal(copilot.automated, true);
  assert.deepEqual(
    copilot.commands.map((command) => [command.file, ...command.args]),
    [
      ['copilot', 'plugin', 'marketplace', 'add', 'adityaaria/SPARK-marketplace'],
      ['copilot', 'plugin', 'install', 'spark@spark-marketplace'],
    ]
  );
});
