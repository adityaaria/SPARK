import { spawnSync } from 'node:child_process';
import { InstallerError } from '../errors.js';
import { copyToGlobal } from './global-skills-copy.js';

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
  packageRoot = null,
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

      // Step 1: ALWAYS copy skills + hooks to global directory (primary mechanism)
      let globalCopyResult = { copied: false };
      if (packageRoot) {
        try {
          globalCopyResult = copyToGlobal(id, packageRoot, env);
        } catch { /* global copy failed — will try CLI next */ }
      }

      // Step 2: Try CLI commands (optional bonus — for marketplace integration)
      let cliSuccess = false;
      let cliSkipped = false;
      for (const entry of commandList) {
        const result = runner(entry.file, interpolateArgs(entry.args ?? [], metadata), {
          cwd: entry.cwd ?? cwd,
          env: entry.env ?? env,
          encoding: 'utf8',
        });

        if (result.error) {
          if (result.error.code === 'ENOENT') {
            // CLI not found — not a problem if global copy succeeded
            cliSkipped = true;
            break;
          }
          // Other errors — also non-fatal if global copy succeeded
          if (globalCopyResult.copied) {
            cliSkipped = true;
            break;
          }
          throw new InstallerError(`${label} install failed: ${result.error.message}`);
        }

        if (result.status !== 0) {
          if (globalCopyResult.copied) {
            cliSkipped = true;
            break;
          }
          throw new InstallerError(
            `${label} install failed: ${result.stderr || result.stdout || 'unknown error'}`
          );
        }

        cliSuccess = true;
      }

      // Determine result type
      if (globalCopyResult.copied) {
        return {
          plan: this.planInstall(),
          metadata,
          globalCopy: true,
          globalSkillsPath: globalCopyResult.globalSkillsPath,
          cliSuccess,
          cliSkipped,
        };
      }

      // Neither global copy nor CLI worked — nothing we can do
      if (!cliSuccess && commandList.length > 0) {
        throw new InstallerError(`${label} install failed: unable to copy skills or run CLI.`);
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
