import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createCodexAdapter } from '../../src/installer/adapters/shell-hook.js';

test('codex install stages a local marketplace and plugin bundle', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spark-codex-install-'));
  const tempBin = fs.mkdtempSync(path.join(os.tmpdir(), 'spark-codex-bin-'));
  const codexBinary = path.join(tempBin, 'codex');

  try {
    fs.writeFileSync(codexBinary, '', { mode: 0o755 });
    const adapter = createCodexAdapter();
    const calls = [];
    const runner = (file, args) => {
      calls.push([file, ...args]);
      return { status: 0, stdout: '', stderr: '' };
    };
    const result = await adapter.install({
      cwd: tempRoot,
      env: {
        ...process.env,
        PATH: tempBin,
      },
      runner,
    });
    const marketplaceRoot = path.join(tempRoot, '.spark', 'codex-marketplace');
    const targetRoot = path.join(marketplaceRoot, 'plugins', 'spark');

    assert.equal(result.plan.automated, true);
    assert.equal(result.globalCopy, undefined);
    assert.equal(result.metadata.relativeTargetRoot, path.join('.spark', 'codex-marketplace', 'plugins', 'spark'));
    assert.equal(result.metadata.relativeMarketplaceRoot, `./${path.join('.spark', 'codex-marketplace')}`);
    assert.deepEqual(calls, [
      ['codex', 'plugin', 'marketplace', 'add', `./${path.join('.spark', 'codex-marketplace')}`],
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
    fs.rmSync(tempBin, { recursive: true, force: true });
  }
});

test('codex install fails fast when the Codex CLI binary is missing', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spark-codex-missing-'));

  try {
    const adapter = createCodexAdapter();
    const calls = [];
    const runner = () => {
      calls.push('runner');
      return { status: 0, stdout: '', stderr: '' };
    };

    await assert.rejects(
      adapter.install({
        cwd: tempRoot,
        env: { PATH: '' },
        fs: {
          accessSync() {
            const error = new Error('ENOENT');
            error.code = 'ENOENT';
            throw error;
          },
        },
        runner,
      }),
      /Codex CLI is not installed or not on PATH/i
    );

    assert.deepEqual(calls, []);
    assert.equal(fs.existsSync(path.join(tempRoot, '.spark')), false);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
