import { spawnSync } from 'node:child_process';
import { InstallerError } from '../errors.js';

export function createAdapter({
  id,
  label,
  kind,
  bootstrap,
  installHint,
  verifyHint,
  command = null,
  envKeys = [],
  binaryNames = [],
  configPaths = [],
}) {
  return {
    id,
    label,
    envKeys,
    binaryNames,
    configPaths,
    command,
    planInstall() {
      return {
        kind,
        bootstrap,
        installHint,
        verifyHint,
        command,
      };
    },
    async install({ runner = spawnSync, dryRun = false } = {}) {
      if (dryRun) {
        return this.planInstall();
      }

      if (!command) {
        throw new InstallerError(`${label} install is not fully automatable yet.`);
      }

      const result = runner(command.file, command.args ?? [], {
        cwd: command.cwd ?? process.cwd(),
        env: command.env ?? process.env,
        encoding: 'utf8',
      });

      if (result.status !== 0) {
        throw new InstallerError(
          `${label} install failed: ${result.stderr || result.stdout || 'unknown error'}`
        );
      }

      return this.planInstall();
    },
    async verify() {
      return verifyHint;
    },
  };
}
