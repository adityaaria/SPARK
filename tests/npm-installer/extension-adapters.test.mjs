import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createAntigravityAdapter,
  createGeminiAdapter,
  createOpenCodeAdapter,
  createPiAdapter,
} from '../../src/installer/adapters/extension-style.js';

test('extension-style adapters expose stable identifiers and plans', () => {
  const adapters = [
    createAntigravityAdapter(),
    createGeminiAdapter(),
    createOpenCodeAdapter(),
    createPiAdapter(),
  ];

  assert.deepEqual(
    adapters.map((adapter) => adapter.id),
    ['antigravity', 'gemini', 'opencode', 'pi']
  );

  for (const adapter of adapters) {
    const plan = adapter.planInstall();
    assert.ok(['extension', 'context-file'].includes(plan.kind));
    assert.match(plan.bootstrap, /using-spark/);
    assert.ok(plan.installHint.length > 0);
    assert.ok(plan.verifyHint.length > 0);
  }
});

test('extension-style adapters describe the committed repository artifacts they rely on', () => {
  const antigravity = createAntigravityAdapter();
  const gemini = createGeminiAdapter();
  const opencode = createOpenCodeAdapter();
  const pi = createPiAdapter();

  assert.match(antigravity.planInstall().installHint, /antigravity-tools\.md/);
  assert.match(gemini.planInstall().installHint, /gemini-extension\.json/);
  assert.match(opencode.planInstall().installHint, /\.opencode\/plugins\/spark\.js/);
  assert.match(pi.planInstall().installHint, /\.pi\/extensions\/spark\.ts/);
});

test('extension-style adapters expose command-backed or config-backed install plans', () => {
  const antigravity = createAntigravityAdapter().planInstall();
  const gemini = createGeminiAdapter().planInstall();
  const opencode = createOpenCodeAdapter().planInstall();
  const pi = createPiAdapter().planInstall();

  assert.equal(antigravity.automated, true);
  assert.equal(gemini.automated, true);
  assert.equal(pi.automated, true);

  assert.equal(opencode.automated, false);
  assert.deepEqual(opencode.manualSteps, [
    'Add `spark@git+https://github.com/adityaaria/SPARK.git` to the `plugin` array in `opencode.json`.',
    'Restart OpenCode.',
  ]);
});
