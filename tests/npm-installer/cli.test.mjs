import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');
const binPath = resolve(repoRoot, 'bin/spark.js');
const packageJsonPath = resolve(repoRoot, 'package.json');

async function readPackageJson() {
  return JSON.parse(await readFile(packageJsonPath, 'utf8'));
}

function runCli(args, env = {}) {
  return spawnSync(process.execPath, [binPath, ...args], {
    cwd: repoRoot,
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
}

test('package.json exposes the CLI binary', async () => {
  const pkg = await readPackageJson();

  assert.equal(pkg.name, '@adityaaria/spark');
  assert.ok(pkg.bin, 'expected package.json to declare a bin field');
  assert.equal(pkg.bin.spark, 'bin/spark.js');
});

test('CLI prints install help', () => {
  const result = runCli(['--help']);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /npx @adityaaria\/spark install/);
  assert.match(result.stdout, /Wraps the native SPARK installer/i);
  assert.match(result.stdout, /--global/);
  assert.match(result.stdout, /--dry-run/);
});

test('CLI dry-run forwards to spark-install.sh without touching filesystem', () => {
  const result = runCli(['install', '--dry-run']);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /SPARK Native Installer/i);
  assert.match(result.stdout, /\[DRY-RUN\] Would install for/i);
  assert.match(result.stdout, /\[DRY-RUN\] Would write lock file/i);
});

test('CLI forwards flags like -g to spark-install.sh', () => {
  const result = runCli(['install', '-g', '--dry-run']);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /SPARK Native Installer/i);
  assert.match(result.stdout, /Scope:\s+global/i);
});
