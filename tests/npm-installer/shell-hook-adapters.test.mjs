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
