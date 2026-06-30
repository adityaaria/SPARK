import { printLine } from './output.js';
import { askQuestion } from './prompt.js';
import { chooseHarness } from '../installer/detect.js';
import { InstallerError } from '../installer/errors.js';
import fs from 'node:fs';

export async function runInstall(options, env) {
  const selection = await chooseHarness({
    forcedHarness: normalizeHarness(options.harness),
    env,
    fs,
    prompt: async (question) => askQuestion(question),
  });
  const { adapter, source } = selection;
  const plan = adapter.planInstall();

  if (options.dryRun) {
    printLine(`dry-run: selected adapter ${adapter.label} (${adapter.id})`);
    printLine(`dry-run: selection source ${source}`);
    printLine(`dry-run: would install SPARK for ${adapter.label}`);
    printLine(`dry-run: bootstrap ${plan.bootstrap}`);
    printLine('dry-run: no filesystem changes made');
    return;
  }

  if (typeof adapter.install !== 'function') {
    throw new InstallerError(`Install flow for ${adapter.label} is not implemented yet.`);
  }

  if (!plan.command) {
    printLine(`No fully automated install command is available for ${adapter.label}.`);
    printLine(`Install hint: ${plan.installHint}`);
    printLine(`Verify hint: ${plan.verifyHint}`);
    return;
  }

  await adapter.install({ options, env });
  if (typeof adapter.verify === 'function') {
    await adapter.verify({ options, env });
  }
  printLine(`Installed SPARK for ${adapter.label}.`);
}

function normalizeHarness(harness) {
  if (!harness) return null;
  return String(harness).trim().toLowerCase();
}
