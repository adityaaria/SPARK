import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CURSOR_PLUGIN_DIR = path.join('.cursor', 'plugins', 'spark');
const COPY_PATHS = [
  '.cursor-plugin',
  'assets',
  path.join('hooks', 'hooks-cursor.json'),
  path.join('hooks', 'run-hook.cmd'),
  path.join('hooks', 'session-start'),
  'skills',
];

export function installCursorPlugin({ packageRoot, env = process.env, dryRun = false }) {
  const homeDir = env.HOME || env.USERPROFILE || os.homedir();
  const targetRoot = path.join(homeDir, CURSOR_PLUGIN_DIR);

  if (!dryRun) {
    fs.mkdirSync(targetRoot, { recursive: true });

    for (const relativePath of COPY_PATHS) {
      const sourcePath = path.join(packageRoot, relativePath);
      const targetPath = path.join(targetRoot, relativePath);
      const stat = fs.statSync(sourcePath);

      if (stat.isDirectory()) {
        fs.cpSync(sourcePath, targetPath, { recursive: true });
        continue;
      }

      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.copyFileSync(sourcePath, targetPath);
      fs.chmodSync(targetPath, stat.mode);
    }
  }

  return {
    targetRoot,
    relativeTargetRoot: `~/${CURSOR_PLUGIN_DIR}`,
  };
}
