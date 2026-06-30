import fs from 'node:fs';
import path from 'node:path';

const VSCODE_PLUGIN_DIR = path.join('.spark', 'vscode-plugin');
const SETTINGS_PATH = path.join('.vscode', 'settings.json');
const COPY_PATHS = [
  '.claude-plugin',
  'assets',
  path.join('hooks', 'hooks.json'),
  path.join('hooks', 'run-hook.cmd'),
  path.join('hooks', 'session-start'),
  'skills',
];

export function installVsCodePlugin({ cwd = process.cwd(), packageRoot, dryRun = false }) {
  const targetRoot = path.join(cwd, VSCODE_PLUGIN_DIR);
  const settingsPath = path.join(cwd, SETTINGS_PATH);

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

    writeVsCodeSettings(settingsPath, targetRoot);
  }

  return {
    targetRoot,
    relativeTargetRoot: VSCODE_PLUGIN_DIR,
    settingsPath,
    relativeSettingsPath: SETTINGS_PATH,
  };
}

function writeVsCodeSettings(settingsPath, targetRoot) {
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });

  let settings = {};
  if (fs.existsSync(settingsPath)) {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  }

  const pluginLocations = isPlainObject(settings['chat.pluginLocations'])
    ? { ...settings['chat.pluginLocations'] }
    : {};

  pluginLocations[targetRoot] = true;
  settings['chat.pluginLocations'] = pluginLocations;

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
