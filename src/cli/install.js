import {
  bullet,
  commandText,
  labelValue,
  pathText,
  printCommandHeader,
  printLine,
  printSection,
  printSummary,
  statusText,
  step,
} from './output.js';
import { askQuestion } from './prompt.js';
import { chooseHarness } from '../installer/detect.js';
import { InstallerError } from '../installer/errors.js';
import fs from 'node:fs';

export async function runInstall(options, env) {
  printCommandHeader('Install');
  const selection = await chooseHarness({
    forcedHarness: normalizeHarness(options.harness),
    env,
    fs,
    prompt: async (question) => askQuestion(question),
  });
  const { adapter, source } = selection;
  const plan = adapter.planInstall();

  if (options.dryRun) {
    printSection('Preview');
    printLine(labelValue('Mode', 'dry-run'));
    printLine(labelValue('Harness', `${adapter.label} (${adapter.id})`));
    printLine(labelValue('Selection', source));
    printLine(labelValue('Bootstrap', plan.bootstrap));
    printPlanDetails(plan, {});
    printSummary('Nothing changed', [bullet('No filesystem changes were made.')], 'info');
    return;
  }

  if (typeof adapter.install !== 'function') {
    throw new InstallerError(`Install flow for ${adapter.label} is not implemented yet.`);
  }

  if (!plan.automated) {
    printSection('Install');
    printLine(labelValue('Harness', adapter.label));
    printLine(statusText(`Interactive install is required for ${adapter.label}.`, 'warning'));
    printPlanDetails(plan, {});
    printSummary(
      'Next step',
      [bullet(`Complete the steps above inside ${adapter.label} and then start a fresh session.`)],
      'warning'
    );
    return;
  }

  const installResult = await adapter.install({ options, env });
  if (typeof adapter.verify === 'function') {
    await adapter.verify({ options, env });
  }
  const resolvedPlan = installResult?.plan ?? plan;
  const metadata = installResult?.metadata ?? {};

  printSection('Install');
  printLine(labelValue('Harness', adapter.label));
  printLine(statusText(resolvedPlan.successMessage ?? plan.successMessage, 'success'));
  printPlanDetails(resolvedPlan, metadata);
  printSummary(
    'Ready',
    buildReadyLines(adapter, resolvedPlan, metadata),
    'success'
  );
}

function normalizeHarness(harness) {
  if (!harness) return null;
  return String(harness).trim().toLowerCase();
}

function printPlanDetails(plan, metadata) {
  if (plan.automated && plan.commands?.length) {
    printLine('');
    printSection('Commands');
    for (const [index, command] of plan.commands.entries()) {
      printLine(step(index + 1, plan.commands.length, commandText(formatCommand(command))));
    }
  }

  if (plan.automated && plan.automatedSteps?.length) {
    printLine('');
    printSection('Steps');
    for (const [index, automatedStep] of plan.automatedSteps.entries()) {
      printLine(step(index + 1, plan.automatedSteps.length, interpolatePlanText(automatedStep, metadata)));
    }
  }

  if (!plan.automated && plan.manualSteps?.length) {
    printLine('');
    printSection('Steps');
    for (const [index, manualStep] of plan.manualSteps.entries()) {
      printLine(step(index + 1, plan.manualSteps.length, manualStep));
    }
  }

  printLine('');
  printSection('Notes');
  printLine(labelValue('Install hint', plan.installHint));
  printLine(labelValue('Verify hint', plan.verifyHint));
  if (metadata.relativeTargetRoot) {
    printLine(labelValue('Bundle path', pathText(metadata.relativeTargetRoot)));
  }
}

function formatCommand(command) {
  return [command.file, ...(command.args ?? [])].join(' ');
}

function interpolatePlanText(text, metadata) {
  return String(text).replaceAll('{targetRoot}', metadata.targetRoot ?? '').replaceAll(
    '{relativeTargetRoot}',
    metadata.relativeTargetRoot ?? ''
  );
}

function buildReadyLines(adapter, plan, metadata) {
  const lines = [];

  if (metadata.relativeTargetRoot) {
    lines.push(bullet(`Plugin bundle staged at ${pathText(metadata.relativeTargetRoot)}.`));
  }

  if (adapter.id === 'codex') {
    lines.push(bullet(`In Codex, install or import the local plugin from ${pathText(metadata.relativeTargetRoot ?? '.spark/codex-plugin')}.`));
    lines.push(bullet('Start a fresh Codex session to confirm using-spark loads before coding.'));
    return lines;
  }

  lines.push(bullet('Start a fresh session in the selected harness to confirm using-spark loads before coding.'));
  return lines;
}
