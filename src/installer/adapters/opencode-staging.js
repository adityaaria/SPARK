import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PACKAGE_DIR = 'spark';
const SPARK_PLUGIN_FILE = path.join(PACKAGE_DIR, '.opencode', 'plugins', 'spark.js');

export function installOpenCodePlugin({ packageRoot, env = process.env, dryRun = false }) {
  const homeDir = env.HOME || env.USERPROFILE || os.homedir();
  const configDir = env.OPENCODE_CONFIG_DIR
    ? resolveHomeAwarePath(env.OPENCODE_CONFIG_DIR, homeDir)
    : path.join(homeDir, '.config', 'opencode');

  const sparkRoot = path.join(configDir, PACKAGE_DIR);
  const pluginFile = path.join(configDir, SPARK_PLUGIN_FILE);
  const registeredPlugin = path.join(configDir, 'plugins', 'spark.js');

  if (!dryRun) {
    fs.mkdirSync(sparkRoot, { recursive: true });
    fs.cpSync(path.join(packageRoot, 'skills'), path.join(sparkRoot, 'skills'), { recursive: true });

    fs.mkdirSync(path.dirname(pluginFile), { recursive: true });
    fs.copyFileSync(path.join(packageRoot, '.opencode', 'plugins', 'spark.js'), pluginFile);

    fs.mkdirSync(path.dirname(registeredPlugin), { recursive: true });
    safeReplace(registeredPlugin);
    fs.symlinkSync(pluginFile, registeredPlugin);
  }

  return {
    targetRoot: sparkRoot,
    relativeTargetRoot: simplifyHomePath(sparkRoot, homeDir),
    pluginFile: simplifyHomePath(pluginFile, homeDir),
    registeredPlugin: simplifyHomePath(registeredPlugin, homeDir),
  };
}

function resolveHomeAwarePath(target, homeDir) {
  if (target === '~') {
    return homeDir;
  }
  if (target.startsWith('~/')) {
    return path.join(homeDir, target.slice(2));
  }
  return path.resolve(target);
}

function simplifyHomePath(target, homeDir) {
  if (target.startsWith(`${homeDir}${path.sep}`)) {
    return `~/${path.relative(homeDir, target).split(path.sep).join('/')}`;
  }
  return target;
}

function safeReplace(target) {
  try {
    fs.rmSync(target, { force: true });
  } catch {
    // Ignore missing targets.
  }
}
