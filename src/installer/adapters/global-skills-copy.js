import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Mapping of harness ID to its global directory structure.
 * Each entry defines where skills and hooks should be copied
 * so the harness discovers SPARK at session start.
 */
const GLOBAL_TARGETS = {
  codex: {
    skillsDir: path.join('.codex', 'skills'),
    hooksDir: path.join('.codex', 'hooks'),
    hookFiles: [
      { src: 'hooks/hooks-codex.json', dest: 'hooks.json' },
      { src: 'hooks/session-start-codex', dest: 'session-start-codex' },
      { src: 'hooks/run-hook.cmd', dest: 'run-hook.cmd' },
    ],
    pluginDir: path.join('.codex', '.codex-plugin'),
    pluginSrc: '.codex-plugin',
  },
  claude: {
    skillsDir: path.join('.claude', 'skills'),
    hooksDir: path.join('.claude', 'hooks'),
    hookFiles: [
      { src: 'hooks/hooks.json', dest: 'hooks.json' },
      { src: 'hooks/session-start', dest: 'session-start' },
      { src: 'hooks/run-hook.cmd', dest: 'run-hook.cmd' },
    ],
    pluginDir: path.join('.claude', '.claude-plugin'),
    pluginSrc: '.claude-plugin',
  },
};

/**
 * Copy SPARK skills and hooks directly to a harness's global directory.
 * This is a fallback mechanism used when the harness CLI is not available.
 *
 * @param {string} id - The harness identifier (e.g. 'codex', 'claude')
 * @param {string} packageRoot - Absolute path to the SPARK package root
 * @param {object} env - Process environment (to resolve HOME)
 * @returns {{ globalSkillsPath: string, globalHooksPath: string, copied: boolean }}
 */
export function copyToGlobal(id, packageRoot, env = process.env) {
  const target = GLOBAL_TARGETS[id];
  if (!target) {
    return { globalSkillsPath: null, globalHooksPath: null, copied: false };
  }

  const homeDir = env.HOME || env.USERPROFILE || os.homedir();
  const globalSkillsPath = path.join(homeDir, target.skillsDir);
  const globalHooksPath = path.join(homeDir, target.hooksDir);

  // 1. Copy skills
  const sourceSkills = path.join(packageRoot, 'skills');
  fs.cpSync(sourceSkills, globalSkillsPath, { recursive: true });

  // 2. Copy hooks
  fs.mkdirSync(globalHooksPath, { recursive: true });
  for (const hookFile of target.hookFiles) {
    const src = path.join(packageRoot, hookFile.src);
    const dest = path.join(globalHooksPath, hookFile.dest);
    fs.copyFileSync(src, dest);
    // Preserve executable permission for shell scripts
    const stat = fs.statSync(src);
    fs.chmodSync(dest, stat.mode);
  }

  // 3. Copy plugin descriptor (e.g. .codex-plugin/)
  if (target.pluginDir && target.pluginSrc) {
    const srcPlugin = path.join(packageRoot, target.pluginSrc);
    const destPlugin = path.join(homeDir, target.pluginDir);
    fs.cpSync(srcPlugin, destPlugin, { recursive: true });
  }

  return { globalSkillsPath, globalHooksPath, copied: true };
}
