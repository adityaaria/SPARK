import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createClaudeCodeAdapter } from '../../src/installer/adapters/shell-hook.js';

test('claude install stages a local marketplace and plugin bundle', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spark-claude-install-'));

  try {
    const adapter = createClaudeCodeAdapter();
    const calls = [];
    const runner = (file, args) => {
      calls.push([file, ...args]);
      return { status: 0, stdout: '', stderr: '' };
    };
    const result = await adapter.install({ cwd: tempRoot, runner });
    const marketplaceRoot = path.join(tempRoot, '.spark', 'claude-marketplace');
    const targetRoot = path.join(marketplaceRoot, 'plugins', 'spark');

    assert.equal(result.plan.automated, true);
    assert.equal(result.globalCopy, undefined);
    assert.equal(result.metadata.relativeTargetRoot, path.join('.spark', 'claude-marketplace', 'plugins', 'spark'));
    assert.equal(result.metadata.relativeMarketplaceRoot, path.join('.spark', 'claude-marketplace'));
    assert.equal(result.metadata.marketplaceName, 'spark-local');
    assert.deepEqual(calls, [
      ['claude', 'plugin', 'marketplace', 'add', path.join('.spark', 'claude-marketplace')],
      ['claude', 'plugin', 'install', 'spark@spark-local'],
    ]);

    assert.equal(fs.existsSync(path.join(marketplaceRoot, 'marketplace.json')), true);
    assert.equal(fs.existsSync(path.join(targetRoot, '.claude-plugin', 'plugin.json')), true);
    assert.equal(fs.existsSync(path.join(targetRoot, 'hooks', 'hooks.json')), true);
    assert.equal(fs.existsSync(path.join(targetRoot, 'hooks', 'run-hook.cmd')), true);
    assert.equal(fs.existsSync(path.join(targetRoot, 'hooks', 'session-start')), true);
    assert.equal(fs.existsSync(path.join(targetRoot, 'skills', 'using-spark', 'SKILL.md')), true);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
