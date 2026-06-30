import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createCursorAdapter } from '../../src/installer/adapters/shell-hook.js';

test('cursor install copies the plugin into the official local plugins directory', async () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'spark-cursor-home-'));
  const tempBin = fs.mkdtempSync(path.join(os.tmpdir(), 'spark-cursor-bin-'));
  const cursorBinary = path.join(tempBin, 'cursor');

  try {
    fs.writeFileSync(cursorBinary, '', { mode: 0o755 });
    const adapter = createCursorAdapter();
    const result = await adapter.install({
      env: {
        ...process.env,
        HOME: tempHome,
        PATH: tempBin,
      },
    });
    const targetRoot = path.join(tempHome, '.cursor', 'plugins', 'spark');

    assert.equal(result.plan.automated, true);
    assert.equal(result.metadata.relativeTargetRoot, '~/.cursor/plugins/spark');
    assert.equal(fs.existsSync(path.join(targetRoot, '.cursor-plugin', 'plugin.json')), true);
    assert.equal(fs.existsSync(path.join(targetRoot, 'hooks', 'hooks-cursor.json')), true);
    assert.equal(fs.existsSync(path.join(targetRoot, 'hooks', 'run-hook.cmd')), true);
    assert.equal(fs.existsSync(path.join(targetRoot, 'hooks', 'session-start')), true);
    assert.equal(fs.existsSync(path.join(targetRoot, 'skills', 'using-spark', 'SKILL.md')), true);
    assert.equal(fs.existsSync(path.join(targetRoot, 'assets', 'app-icon.png')), true);
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
    fs.rmSync(tempBin, { recursive: true, force: true });
  }
});
