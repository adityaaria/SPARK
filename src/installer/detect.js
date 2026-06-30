import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { getAdapterById, listAdapters } from './registry.js';
import { InstallerError } from './errors.js';

const HIGH_CONFIDENCE_SCORE = 80;
const AMBIGUOUS_MARGIN = 20;

export function detectHarnessCandidates({ env = process.env, fsImpl = fs } = {}) {
  const homeDir = os.homedir();
  const adapters = listAdapters();

  return adapters
    .map((adapter) => scoreAdapter(adapter, env, fsImpl, homeDir))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
}

export async function chooseHarness({
  forcedHarness = null,
  env = process.env,
  fs = fs,
  prompt = null,
} = {}) {
  if (forcedHarness) {
    const adapter = getAdapterById(normalizeHarness(forcedHarness));
    if (!adapter) {
      throw new InstallerError(`Unsupported harness: ${forcedHarness}`);
    }
    return { adapter, source: 'forced', candidates: [] };
  }

  const candidates = detectHarnessCandidates({ env, fsImpl: fs });
  if (candidates.length === 0) {
    throw new InstallerError(
      `Could not detect a supported harness. Supported harnesses: ${listAdapters().map((adapter) => adapter.label).join(', ')}`
    );
  }

  if (isConfident(candidates)) {
    const adapter = getAdapterById(candidates[0].id);
    return { adapter, source: 'auto', candidates };
  }

  if (!prompt) {
    throw new InstallerError(`Multiple harnesses look plausible: ${candidates.map((candidate) => candidate.label).join(', ')}`);
  }

  const answer = await prompt(renderPrompt(candidates));
  const adapter = resolvePromptAnswer(answer, candidates);
  return { adapter, source: 'prompt', candidates };
}

function scoreAdapter(adapter, env, fsImpl, homeDir) {
  let score = 0;
  const reasons = [];

  for (const key of adapter.envKeys) {
    if (env[key]) {
      score += 100;
      reasons.push(`env:${key}`);
    }
  }

  for (const binaryName of adapter.binaryNames) {
    if (commandExists(binaryName, env, fsImpl)) {
      score += 70;
      reasons.push(`path:${binaryName}`);
    }
  }

  for (const configPath of adapter.configPaths) {
    for (const candidatePath of candidateConfigPaths(homeDir, env, configPath)) {
      if (fsImpl.existsSync(candidatePath)) {
        score += 90;
        reasons.push(`config:${candidatePath}`);
        break;
      }
    }
  }

  return {
    id: adapter.id,
    label: adapter.label,
    score,
    reasons,
  };
}

function candidateConfigPaths(homeDir, env, configPath) {
  const paths = [];
  if (env.OPENCODE_CONFIG_DIR && configPath === 'opencode.json') {
    paths.push(path.join(env.OPENCODE_CONFIG_DIR, 'opencode.json'));
  }
  if (configPath === 'GEMINI.md') {
    paths.push(path.join(homeDir, '.gemini', 'GEMINI.md'));
    paths.push(path.join(homeDir, 'GEMINI.md'));
  }
  if (configPath === 'gemini-extension.json') {
    paths.push(path.join(homeDir, 'gemini-extension.json'));
    paths.push(path.join(homeDir, '.gemini', 'gemini-extension.json'));
  }
  return paths;
}

function commandExists(commandName, env, fsImpl) {
  const paths = String(env.PATH ?? '').split(path.delimiter).filter(Boolean);
  const exts = process.platform === 'win32'
    ? String(env.PATHEXT ?? '.EXE;.CMD;.BAT;.COM').split(';').filter(Boolean)
    : [''];

  for (const dir of paths) {
    for (const ext of exts) {
      const candidate = path.join(dir, `${commandName}${ext}`);
      try {
        fsImpl.accessSync(candidate, fs.constants.X_OK);
        return true;
      } catch {
        try {
          fsImpl.accessSync(candidate, fs.constants.F_OK);
          return true;
        } catch {
          continue;
        }
      }
    }
  }

  return false;
}

function isConfident(candidates) {
  if (candidates[0].score < HIGH_CONFIDENCE_SCORE) return false;
  if (candidates.length === 1) return true;
  return candidates[0].score - candidates[1].score >= AMBIGUOUS_MARGIN;
}

function renderPrompt(candidates) {
  return [
    'Choose the harness to install SPARK for:',
    ...candidates.map((candidate, index) => `${index + 1}. ${candidate.label} (${candidate.id})`),
    'Enter a number or harness name:',
  ].join('\n');
}

function resolvePromptAnswer(answer, candidates) {
  const value = normalizeHarness(answer);
  if (!value) {
    throw new InstallerError('No harness selected.');
  }

  const numeric = Number(value);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= candidates.length) {
    return getAdapterById(candidates[numeric - 1].id);
  }

  const exact = candidates.find((candidate) => candidate.id === value || candidate.label.toLowerCase() === value);
  if (!exact) {
    throw new InstallerError(`Unsupported harness choice: ${answer}`);
  }

  return getAdapterById(exact.id);
}

function normalizeHarness(value) {
  return String(value ?? '').trim().toLowerCase();
}
