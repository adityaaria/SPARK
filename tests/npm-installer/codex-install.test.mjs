import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createCodexAdapter } from '../../src/installer/adapters/shell-hook.js';

test('codex install stages a project-local plugin bundle', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spark-codex-install-'));

  try {
    const adapter = createCodexAdapter();
    const result = await adapter.install({ cwd: tempRoot });
    const targetRoot = path.join(tempRoot, '.spark', 'codex-plugin');

    assert.equal(result.plan.automated, true);
    assert.equal(result.metadata.relativeTargetRoot, path.join('.spark', 'codex-plugin'));

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
