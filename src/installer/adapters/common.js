import { spawnSync } from 'node:child_process';
import { InstallerError } from '../errors.js';

export function createAdapter({
  id,
  label,
  kind,
  bootstrap,
  installHint,
  verifyHint,
  successMessage = `Installed SPARK for ${label}.`,
  command = null,
  commands = [],
  customInstall = null,
  manualSteps = [],
  automatedSteps = [],
  envKeys = [],
  binaryNames = [],
  configPaths = [],
}) {
  const commandList = normalizeCommandList(commands, command);
  const automated = commandList.length > 0 || typeof customInstall === 'function';

  return {
    id,
    label,
    envKeys,
    binaryNames,
    configPaths,
    command: commandList[0] ?? null,
    commands: commandList,
    manualSteps,
    planInstall() {
      return {
        kind,
        bootstrap,
        installHint,
        verifyHint,
        successMessage,
        command: commandList[0] ?? null,
        commands: commandList,
        manualSteps,
        automatedSteps,
        automated,
      };
    },
    async install({ runner = spawnSync, dryRun = false, cwd = process.cwd(), env = process.env, fs = null } = {}) {
      if (!automated) {
        throw new InstallerError(`${label} install is not fully automatable yet.`);
      }

      let metadata = {};

      if (typeof customInstall === 'function') {
        metadata = (await customInstall({ cwd, env, fs, dryRun })) ?? {};
      }

      if (dryRun) {
        return { plan: this.planInstall(), metadata };
      }

      for (const entry of commandList) {
        const result = runner(entry.file, interpolateArgs(entry.args ?? [], metadata), {
          cwd: entry.cwd ?? cwd,
          env: entry.env ?? env,
          encoding: 'utf8',
        });

        if (result.status !== 0) {
          throw new InstallerError(
            `${label} install failed: ${result.stderr || result.stdout || 'unknown error'}`
          );
        }
      }

      return { plan: this.planInstall(), metadata };
    },
    async verify() {
      return verifyHint;
    },
  };
}

function normalizeCommandList(commands, command) {
  if (Array.isArray(commands) && commands.length > 0) {
    return commands;
  }

  if (command) {
    return [command];
  }

  return [];
}

function interpolateArgs(args, metadata) {
  return args.map((arg) =>
    String(arg)
      .replaceAll('{targetRoot}', metadata.targetRoot ?? '')
      .replaceAll('{relativeTargetRoot}', metadata.relativeTargetRoot ?? '')
      .replaceAll('{marketplaceRoot}', metadata.marketplaceRoot ?? '')
      .replaceAll('{relativeMarketplaceRoot}', metadata.relativeMarketplaceRoot ?? '')
      .replaceAll('{marketplaceName}', metadata.marketplaceName ?? '')
  );
}
