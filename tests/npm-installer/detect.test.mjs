import assert from 'node:assert/strict';
import test from 'node:test';
import { chooseHarness, detectHarnessCandidates } from '../../src/installer/detect.js';

function fakeFs(existingPaths = new Set()) {
  return {
    existsSync(target) {
      return existingPaths.has(target);
    },
    accessSync(target) {
      if (!existingPaths.has(target)) {
        const error = new Error('ENOENT');
        error.code = 'ENOENT';
        throw error;
      }
    },
  };
}

function fakePrompt(answer) {
  const calls = [];
  return {
    calls,
    prompt: async (question) => {
      calls.push(question);
      return answer;
    },
  };
}

test('explicit harness override wins over detection signals', async () => {
  const choice = await chooseHarness({
    forcedHarness: 'codex',
    env: { PATH: '/usr/bin' },
    fs: fakeFs(),
    prompt: async () => {
      throw new Error('prompt should not be called');
    },
  });

  assert.equal(choice.adapter.id, 'codex');
  assert.equal(choice.source, 'forced');
});

test('vscode aliases resolve to the shared VS Code adapter', async () => {
  const choice = await chooseHarness({
    forcedHarness: 'codex app',
    env: { PATH: '/usr/bin' },
    fs: fakeFs(),
    prompt: async () => {
      throw new Error('prompt should not be called');
    },
  });

  assert.equal(choice.adapter.id, 'vscode');
  assert.equal(choice.source, 'forced');
});

test('detector scores strong environment signals for a single harness', () => {
  const candidates = detectHarnessCandidates({
    env: {
      PATH: '/usr/bin',
      OPENCODE_CONFIG_DIR: '/tmp/opencode-config',
    },
    fs: fakeFs(new Set(['/tmp/opencode-config/opencode.json'])),
  });

  assert.equal(candidates[0].id, 'opencode');
  assert.ok(candidates[0].score > candidates[1].score);
});

test('ambiguous detection asks the user to choose', async () => {
  const chooser = fakePrompt('2');
  const choice = await chooseHarness({
    env: {
      PATH: '/tmp/bin-a:/tmp/bin-b',
    },
    fs: fakeFs(new Set([
      '/tmp/bin-a/codex',
      '/tmp/bin-b/cursor',
    ])),
    prompt: chooser.prompt,
  });

  assert.equal(chooser.calls.length, 1);
  assert.match(chooser.calls[0], /Codex CLI/);
  assert.match(chooser.calls[0], /VS Code/);
  assert.match(chooser.calls[0], /Cursor/);
  assert.ok(['codex', 'vscode', 'cursor'].includes(choice.adapter.id));
  assert.equal(choice.source, 'prompt');
});

test('install without forced harness always prompts even with a strong detection signal', async () => {
  const chooser = fakePrompt('gemini');
  const choice = await chooseHarness({
    env: {
      PATH: '/tmp/bin',
      GOOGLE_GEMINI_CLI: '1',
    },
    fs: fakeFs(new Set(['/tmp/bin/gemini'])),
    prompt: chooser.prompt,
  });

  assert.equal(chooser.calls.length, 1);
  assert.match(chooser.calls[0], /AI assistance/i);
  assert.match(chooser.calls[0], /Gemini CLI/);
  assert.match(chooser.calls[0], /Codex CLI/);
  assert.equal(choice.adapter.id, 'gemini');
  assert.equal(choice.source, 'prompt');
});

test('no detection signals still prompts with the full harness list', async () => {
  const chooser = fakePrompt('1');
  const choice = await chooseHarness({
    env: { PATH: '' },
    fs: fakeFs(),
    prompt: chooser.prompt,
  });

  assert.equal(chooser.calls.length, 1);
  assert.match(chooser.calls[0], /AI assistance/i);
  assert.match(chooser.calls[0], /Claude Code/);
  assert.match(chooser.calls[0], /Gemini CLI/);
  assert.equal(choice.source, 'prompt');
  assert.ok(choice.adapter);
});

test('invalid prompt answer asks again until the user picks a supported harness', async () => {
  const answers = ['99', 'vscode'];
  const calls = [];
  const choice = await chooseHarness({
    env: { PATH: '' },
    fs: fakeFs(),
    prompt: async (question) => {
      calls.push(question);
      return answers.shift();
    },
  });

  assert.equal(calls.length, 2);
  assert.equal(choice.adapter.id, 'vscode');
  assert.equal(choice.source, 'prompt');
});
