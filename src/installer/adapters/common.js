import { spawnSync } from 'node:child_process';
import { InstallerError } from '../errors.js';
import fs from 'node:fs';
import path from 'node:path';

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

      const fsImpl = fs ?? nativeFs;
      if (!dryRun) {
        assertBinaryAvailability({ label, binaryNames, env, fsImpl });
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

        if (result.error) {
          throw new InstallerError(`${label} install failed: ${result.error.message}`);
        }

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

const nativeFs = fs;

function normalizeCommandList(commands, command) {
  if (Array.isArray(commands) && commands.length > 0) {
    return commands;
  }

  if (command) {
    return [command];
  }

  return [];
}

function assertBinaryAvailability({ label, binaryNames, env, fsImpl }) {
  if (!binaryNames || binaryNames.length === 0) {
    return;
  }

  for (const binaryName of binaryNames) {
    if (commandExists(binaryName, env, fsImpl)) {
      return;
    }
  }

  throw new InstallerError(`${label} is not installed or not on PATH. Install ${label} first, then rerun SPARK install.`);
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
