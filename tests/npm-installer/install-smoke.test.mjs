import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');
const binPath = resolve(repoRoot, 'bin/spark.js');

function runCli(args) {
  return spawnSync(process.execPath, [binPath, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

test('installer smoke test prints a concrete dry-run plan', () => {
  const result = runCli(['install', '--dry-run', '--harness', 'pi']);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Pi/);
  assert.match(result.stdout, /selection source forced/);
  assert.match(result.stdout, /using-spark/);
});
