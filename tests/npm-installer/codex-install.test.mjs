import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createCodexAdapter } from '../../src/installer/adapters/shell-hook.js';

test('codex install stages a local marketplace and plugin bundle', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spark-codex-install-'));

  try {
    const adapter = createCodexAdapter();
    const calls = [];
    const runner = (file, args) => {
      calls.push([file, ...args]);
      return { status: 0, stdout: '', stderr: '' };
    };
    const result = await adapter.install({ cwd: tempRoot, runner });
    const marketplaceRoot = path.join(tempRoot, '.spark', 'codex-marketplace');
    const targetRoot = path.join(marketplaceRoot, 'plugins', 'spark');

    assert.equal(result.plan.automated, true);
    assert.equal(result.globalCopy, undefined);
    assert.equal(result.metadata.relativeTargetRoot, path.join('.spark', 'codex-marketplace', 'plugins', 'spark'));
    assert.equal(result.metadata.relativeMarketplaceRoot, path.join('.spark', 'codex-marketplace'));
    assert.deepEqual(calls, [
      ['codex', 'plugin', 'marketplace', 'add', path.join('.spark', 'codex-marketplace')],
      ['codex', 'plugin', 'add', 'spark'],
    ]);

    assert.equal(fs.existsSync(path.join(marketplaceRoot, 'marketplace.json')), true);
    assert.equal(fs.existsSync(path.join(targetRoot, '.codex-plugin', 'plugin.json')), true);
    assert.equal(fs.existsSync(path.join(targetRoot, 'hooks', 'hooks-codex.json')), true);
    assert.equal(fs.existsSync(path.join(targetRoot, 'hooks', 'run-hook.cmd')), true);
    assert.equal(fs.existsSync(path.join(targetRoot, 'hooks', 'session-start-codex')), true);
    assert.equal(fs.existsSync(path.join(targetRoot, 'skills', 'using-spark', 'SKILL.md')), true);
    assert.equal(fs.existsSync(path.join(targetRoot, 'assets', 'app-icon.png')), true);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
