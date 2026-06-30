import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createVsCodeAdapter } from '../../src/installer/adapters/shell-hook.js';

test('vscode install stages a local plugin bundle and registers it in workspace settings', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spark-vscode-install-'));

  try {
    const adapter = createVsCodeAdapter();
    const calls = [];
    const runner = (file, args) => {
      calls.push([file, ...args]);
      return { status: 0, stdout: '', stderr: '' };
    };
    const result = await adapter.install({ cwd: tempRoot, runner });
    const targetRoot = path.join(tempRoot, '.spark', 'vscode-plugin');
    const settingsPath = path.join(tempRoot, '.vscode', 'settings.json');
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

    assert.equal(result.plan.automated, true);
    assert.equal(result.metadata.relativeTargetRoot, path.join('.spark', 'vscode-plugin'));
    assert.equal(result.metadata.relativeSettingsPath, path.join('.vscode', 'settings.json'));
    assert.deepEqual(calls, []);

    assert.equal(fs.existsSync(path.join(targetRoot, '.claude-plugin', 'plugin.json')), true);
    assert.equal(fs.existsSync(path.join(targetRoot, 'hooks', 'hooks.json')), true);
    assert.equal(fs.existsSync(path.join(targetRoot, 'hooks', 'run-hook.cmd')), true);
    assert.equal(fs.existsSync(path.join(targetRoot, 'hooks', 'session-start')), true);
    assert.equal(fs.existsSync(path.join(targetRoot, 'skills', 'using-spark', 'SKILL.md')), true);
    assert.equal(fs.existsSync(path.join(targetRoot, 'assets', 'app-icon.png')), true);
    assert.equal(settings['chat.pluginLocations'][targetRoot], true);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('vscode install preserves existing workspace settings while adding chat.pluginLocations', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spark-vscode-settings-'));

  try {
    const settingsRoot = path.join(tempRoot, '.vscode');
    const settingsPath = path.join(settingsRoot, 'settings.json');
    fs.mkdirSync(settingsRoot, { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify({
      'editor.formatOnSave': true,
      'chat.pluginLocations': {
        '/tmp/existing-plugin': true,
      },
    }, null, 2));

    await createVsCodeAdapter().install({ cwd: tempRoot, runner: () => ({ status: 0, stdout: '', stderr: '' }) });
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

    assert.equal(settings['editor.formatOnSave'], true);
    assert.equal(settings['chat.pluginLocations']['/tmp/existing-plugin'], true);
    assert.equal(settings['chat.pluginLocations'][path.join(tempRoot, '.spark', 'vscode-plugin')], true);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
