import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createOpenCodeAdapter } from '../../src/installer/adapters/extension-style.js';

test('opencode install copies the package and registers the plugin entry', async () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'spark-opencode-home-'));
  const tempBin = fs.mkdtempSync(path.join(os.tmpdir(), 'spark-opencode-bin-'));
  const opencodeBinary = path.join(tempBin, 'opencode');
  const configDir = path.join(tempHome, '.config', 'opencode');

  try {
    fs.writeFileSync(opencodeBinary, '', { mode: 0o755 });
    const adapter = createOpenCodeAdapter();
    const result = await adapter.install({
      env: {
        ...process.env,
        HOME: tempHome,
        OPENCODE_CONFIG_DIR: configDir,
        PATH: tempBin,
      },
    });

    assert.equal(result.plan.automated, true);
    assert.equal(result.metadata.relativeTargetRoot, '~/.config/opencode/spark');
    assert.equal(result.metadata.pluginFile, '~/.config/opencode/spark/.opencode/plugins/spark.js');
    assert.equal(result.metadata.registeredPlugin, '~/.config/opencode/plugins/spark.js');

    const sparkRoot = path.join(configDir, 'spark');
    const pluginFile = path.join(sparkRoot, '.opencode', 'plugins', 'spark.js');
    const registeredPlugin = path.join(configDir, 'plugins', 'spark.js');

    assert.equal(fs.existsSync(path.join(sparkRoot, 'skills', 'using-spark', 'SKILL.md')), true);
    assert.equal(fs.existsSync(pluginFile), true);
    assert.equal(fs.existsSync(registeredPlugin), true);
    assert.equal(fs.lstatSync(registeredPlugin).isSymbolicLink(), true);
    assert.equal(fs.readlinkSync(registeredPlugin), pluginFile);
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
    fs.rmSync(tempBin, { recursive: true, force: true });
  }
});
