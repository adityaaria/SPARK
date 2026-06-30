import fs from 'node:fs';
import path from 'node:path';

const CODEX_STAGE_DIR = path.join('.spark', 'codex-plugin');
const COPY_PATHS = [
  '.codex-plugin',
  'assets',
  path.join('hooks', 'hooks-codex.json'),
  path.join('hooks', 'run-hook.cmd'),
  path.join('hooks', 'session-start-codex'),
  'skills',
];

export function stageCodexPlugin({ cwd = process.cwd(), packageRoot }) {
  const targetRoot = path.join(cwd, CODEX_STAGE_DIR);

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

  return {
    targetRoot,
    relativeTargetRoot: CODEX_STAGE_DIR,
  };
}
