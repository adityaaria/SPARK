import assert from 'node:assert/strict';
import { readFile, mkdtemp, mkdir, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import test, { before, after } from 'node:test';
import { buildCommandHeader } from '../../src/cli/output.js';

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

// A clean CI runner has no ~/.claude, ~/.codex, etc., so autodetection
// finds no coding agent and the installer exits non-zero. Point HOME at
// a fixture with a fake ~/.claude so agent autodetection succeeds the
// same way it would on a developer machine that already has an agent installed.
let fakeHome;

before(async () => {
  fakeHome = await mkdtemp(join(tmpdir(), 'spark-cli-test-'));
  await mkdir(join(fakeHome, '.claude'), { recursive: true });
  // Seed a real global install so the uninstall/update dry-run tests below
  // have something to detect — a clean CI runner starts with nothing installed.
  runCli(['install', '-g', '--yes'], { HOME: fakeHome });
});

after(async () => {
  if (fakeHome) await rm(fakeHome, { recursive: true, force: true });
});

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

test('CLI command header is center-aligned when rendered as plain text', () => {
  const lines = buildCommandHeader('Install', { width: 48, colorize: false });

  assert.equal(lines.length, 5);
  assert.equal(lines[0].length, 48);
  assert.equal(lines[1].length, 48);
  assert.equal(lines[2].length, 48);
  assert.equal(lines[3].length, 48);
  assert.equal(lines[4], '');
  assert.match(lines[1], /SPARK/);
  assert.match(lines[1], /Install/);
  assert.match(lines[2], /Skills installer for coding agents/);
  assert.ok(lines[1].startsWith(' '), 'title row should be centered with left padding');
  assert.ok(lines[2].startsWith(' '), 'subtitle row should be centered with left padding');
});

test('CLI dry-run forwards to spark-install.sh without touching filesystem', () => {
  const result = runCli(['install', '--dry-run'], { HOME: fakeHome });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /SPARK Native Installer/i);
  assert.match(result.stdout, /\[DRY-RUN\] Would install for/i);
  assert.match(result.stdout, /\[DRY-RUN\] Would write lock file/i);
});

test('CLI forwards flags like -g to spark-install.sh', () => {
  // --force because before() already seeded a real global install in fakeHome;
  // without it the installer short-circuits with "Already up to date."
  const result = runCli(['install', '-g', '--dry-run', '--force'], { HOME: fakeHome });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /SPARK Native Installer/i);
  assert.match(result.stdout, /Scope:\s+global/i);
});

test('CLI forwards uninstall command to spark-uninstall.sh', () => {
  const result = runCli(['uninstall', '--dry-run', '-g'], { HOME: fakeHome });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /SPARK Native Uninstaller/i);
  assert.match(result.stdout, /Dry-run uninstallation preview complete/i);
});

test('CLI forwards update command to spark-update.sh', () => {
  const result = runCli(['update', '--dry-run', '-g'], { HOME: fakeHome });

  // Exits with 0 or 1 depending on whether lockfile exists, but output must match Updater header
  assert.match(result.stdout, /SPARK Native Updater/i);
});
