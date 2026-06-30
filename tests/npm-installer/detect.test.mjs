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
  assert.match(chooser.calls[0], /Codex/);
  assert.match(chooser.calls[0], /Cursor/);
  assert.ok(['codex', 'cursor'].includes(choice.adapter.id));
  assert.equal(choice.source, 'prompt');
});

test('no candidates produces a short actionable failure', async () => {
  await assert.rejects(
    chooseHarness({
      env: { PATH: '' },
      fs: fakeFs(),
      prompt: async () => 'q',
    }),
    /Could not detect a supported harness/
  );
});
