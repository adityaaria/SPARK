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
    const installPreview = await adapter.install({ dryRun: true, cwd: process.cwd(), env });
    printSection('Preview');
    printLine(labelValue('Mode', 'dry-run'));
    printLine(labelValue('Harness', `${adapter.label} (${adapter.id})`));
    printLine(labelValue('Selection', source));
    printLine(labelValue('Bootstrap', plan.bootstrap));
    printPlanDetails(installPreview.plan, installPreview.metadata ?? {});
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

  // Handle global copy result
  if (installResult?.globalCopy) {
    printSection('Install');
    printLine(labelValue('Harness', adapter.label));

    if (installResult.cliSuccess) {
      // Both global copy AND CLI succeeded — full install
      printLine(statusText(`Installed SPARK for ${adapter.label}.`, 'success'));
    } else {
      // Global copy succeeded, CLI was skipped — still fully functional
      printLine(statusText(`SPARK skills installed to ${installResult.globalSkillsPath}`, 'success'));
    }

    const readyLines = [
      bullet(`SPARK skills and hooks copied to ${installResult.globalSkillsPath}.`),
      bullet(`Open a fresh ${adapter.label} session to confirm using-spark loads before coding.`),
    ];

    if (installResult.cliSkipped) {
      readyLines.push(bullet(`CLI integration skipped (optional — SPARK already works without it).`));
    }

    printSummary('Ready', readyLines, 'success');
    return;
  }

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
      printLine(
        step(
          index + 1,
          plan.commands.length,
          commandText(formatCommand(command, metadata))
        )
      );
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
  if (metadata.relativeMarketplaceRoot) {
    printLine(labelValue('Marketplace path', pathText(metadata.relativeMarketplaceRoot)));
  }
}

function formatCommand(command, metadata = {}) {
  return [command.file, ...(command.args ?? [])]
    .map((part) => interpolatePlanText(part, metadata))
    .join(' ');
}

function interpolatePlanText(text, metadata) {
  return String(text)
    .replaceAll('{targetRoot}', metadata.targetRoot ?? '')
    .replaceAll('{relativeTargetRoot}', metadata.relativeTargetRoot ?? '')
    .replaceAll('{marketplaceRoot}', metadata.marketplaceRoot ?? '')
    .replaceAll('{relativeMarketplaceRoot}', metadata.relativeMarketplaceRoot ?? '')
    .replaceAll('{marketplaceName}', metadata.marketplaceName ?? '');
}

function buildReadyLines(adapter, plan, metadata) {
  const lines = [];

  if (metadata.relativeTargetRoot && adapter.id === 'vscode') {
    lines.push(bullet(`Local VS Code bundle prepared at ${pathText(metadata.relativeTargetRoot)}.`));
  } else if (metadata.relativeTargetRoot) {
    lines.push(bullet(`Plugin bundle staged at ${pathText(metadata.relativeTargetRoot)}.`));
  }

  if (metadata.relativeMarketplaceRoot) {
    lines.push(bullet(`Local marketplace staged at ${pathText(metadata.relativeMarketplaceRoot)}.`));
  }

  if (adapter.id === 'codex') {
    lines.push(bullet('Start a fresh Codex session to confirm using-spark loads before coding.'));
    return lines;
  }

  if (adapter.id === 'vscode') {
    if (metadata.relativeSettingsPath) {
      lines.push(bullet(`VS Code plugin registration was written to ${pathText(metadata.relativeSettingsPath)}.`));
    }
    lines.push(bullet('Open a fresh VS Code agent session to confirm using-spark loads before coding.'));
    return lines;
  }

  lines.push(bullet('Start a fresh session in the selected harness to confirm using-spark loads before coding.'));
  return lines;
}
