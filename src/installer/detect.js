import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { formatPromptBlock, promptOption } from '../cli/output.js';
import { getAdapterById, listAdapters } from './registry.js';
import { InstallerError } from './errors.js';

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

  if (!prompt) {
    throw new InstallerError('No harness selected. Re-run with --harness or use an interactive terminal.');
  }

  const homeDir = os.homedir();
  const detectedCandidates = detectHarnessCandidates({ env, fsImpl: fs });
  const candidates = buildPromptCandidates(detectedCandidates, env, fs, homeDir);

  let validationMessage = null;
  while (true) {
    const answer = await prompt(renderPrompt(candidates, validationMessage));
    const adapter = resolvePromptAnswer(answer, candidates);
    if (adapter) {
      return { adapter, source: 'prompt', candidates };
    }
    validationMessage = `Unsupported choice: ${answer || '(empty)'}. Please choose a number or harness name from the list.`;
  }
}

function scoreAdapter(adapter, env, fsImpl, homeDir) {
  let score = 0;
  const reasons = [];

  let missingBinaries = false;

  for (const key of adapter.envKeys) {
    if (env[key]) {
      score += 100;
      reasons.push(`env:${key}`);
    }
  }

  if (adapter.binaryNames && adapter.binaryNames.length > 0) {
    missingBinaries = true;
    for (const binaryName of adapter.binaryNames) {
      if (commandExists(binaryName, env, fsImpl)) {
        score += 70;
        reasons.push(`path:${binaryName}`);
        missingBinaries = false;
        break;
      }
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
    missingBinaries,
  };
}

function candidateConfigPaths(homeDir, env, configPath) {
  const paths = [];
  if (env.OPENCODE_CONFIG_DIR && configPath === 'opencode.json') {
    paths.push(path.join(env.OPENCODE_CONFIG_DIR, 'opencode.json'));
  }
  if (configPath === 'GEMINI.md') {
    paths.push(
      path.join(homeDir, '.gemini', 'GEMINI.md'),
      path.join(homeDir, 'GEMINI.md')
    );
  }
  if (configPath === 'gemini-extension.json') {
    paths.push(
      path.join(homeDir, 'gemini-extension.json'),
      path.join(homeDir, '.gemini', 'gemini-extension.json')
    );
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

function buildPromptCandidates(detectedCandidates, env, fsImpl, homeDir) {
  const allAdapters = listAdapters();
  const detectedIds = new Set(detectedCandidates.map((candidate) => candidate.id));

  return [
    ...detectedCandidates,
    ...allAdapters
      .filter((adapter) => !detectedIds.has(adapter.id))
      .map((adapter) => {
        const result = scoreAdapter(adapter, env, fsImpl, homeDir);
        result.score = 0;
        result.reasons = [];
        return result;
      }),
  ];
}

function renderPrompt(candidates, validationMessage = null) {
  const lines = [];

  if (validationMessage) {
    lines.push(validationMessage);
    lines.push('');
  }

  const detectedCount = candidates.filter((candidate) => candidate.score > 0).length;
  const recommendedIds = new Set(candidates.filter((candidate) => candidate.score > 0).map((candidate) => candidate.id));

  if (detectedCount > 0) {
    lines.push('Recommended from your current environment:');
    lines.push('');
  }

  for (const [index, candidate] of candidates.entries()) {
    let label = candidate.label;
    if (candidate.missingBinaries) {
      label += ' [Missing CLI]';
    }

    const hint = recommendedIds.has(candidate.id) ? 'recommended' : null;
    lines.push(
      promptOption(
        index + 1,
        label,
        candidate.id,
        hint,
        describeHarness(candidate.id, candidate.missingBinaries)
      )
    );
  }

  return formatPromptBlock(
    'Install SPARK',
    lines,
    'Enter a number or harness name.'
  );
}

function resolvePromptAnswer(answer, candidates) {
  const value = normalizeHarness(answer);
  if (!value) return null;

  const numeric = Number(value);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= candidates.length) {
    return getAdapterById(candidates[numeric - 1].id);
  }

  const exact = candidates.find((candidate) => candidate.id === value || candidate.label.toLowerCase() === value);
  if (!exact) return null;

  return getAdapterById(exact.id);
}

function describeHarness(id, missingBinaries = false) {
  const descriptions = {
    claude: 'Best for Claude Code sessions and project-local plugin workflows.',
    codex: 'For the Codex CLI plugin marketplace flow in terminal sessions.',
    vscode: 'One install path for VS Code agent sessions across Claude, Copilot, GPT, and other supported models.',
    cursor: 'Native Cursor plugin install for fresh Agent sessions.',
    copilot: 'For GitHub Copilot CLI in terminal-based agent sessions.',
    opencode: 'Registers the OpenCode plugin in your local config directory.',
    gemini: 'Installs the Gemini CLI extension and loads SPARK at startup.',
    pi: 'Installs the Pi extension from the SPARK repository.',
    antigravity: 'Installs the Antigravity plugin and loads SPARK on new sessions.',
  };

  let description = descriptions[id] ?? null;
  if (description && missingBinaries) {
    description += '\n   ⚠️  Requires its official CLI to be installed first.';
  }

  return description;
}

function normalizeHarness(value) {
  const normalized = String(value ?? '').trim().toLowerCase();

  if (!normalized) {
    return '';
  }

  const aliases = new Map([
    ['codex cli', 'codex'],
    ['codex-cli', 'codex'],
    ['codex vscode', 'vscode'],
    ['codex vs code', 'vscode'],
    ['codex-vs-code', 'vscode'],
    ['codex app', 'vscode'],
    ['copilot vscode', 'vscode'],
    ['copilot vs code', 'vscode'],
    ['copilot-vs-code', 'vscode'],
    ['vscode agent', 'vscode'],
    ['vs code', 'vscode'],
  ]);

  return aliases.get(normalized) ?? normalized;
}
