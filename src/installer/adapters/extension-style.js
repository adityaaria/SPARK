import { createAdapter } from './common.js';
import { installOpenCodePlugin } from './opencode-staging.js';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

export function createOpenCodeAdapter() {
  return createAdapter({
    id: 'opencode',
    label: 'OpenCode',
    kind: 'extension',
    envKeys: ['OPENCODE_CONFIG_DIR'],
    binaryNames: ['opencode'],
    configPaths: ['opencode.json'],
    bootstrap: 'using-spark -> .opencode/plugins/spark.js -> message transform bootstrap',
    installHint: '.opencode/plugins/spark.js + .opencode/INSTALL.md',
    verifyHint: 'Restart OpenCode, then confirm spark loads in a fresh session.',
    successMessage: 'Installed SPARK for OpenCode.',
    automatedSteps: [
      'Install the SPARK package into the OpenCode config directory.',
      'Register the spark plugin entry inside the OpenCode plugins directory.',
      'Restart OpenCode to load the plugin and skills.',
    ],
    customInstall({ env, dryRun }) {
      return installOpenCodePlugin({ packageRoot, env, dryRun });
    },
  });
}

export function createPiAdapter() {
  return createAdapter({
    id: 'pi',
    label: 'Pi',
    kind: 'extension',
    envKeys: ['PI_HOME'],
    binaryNames: ['pi'],
    bootstrap: 'using-spark -> .pi/extensions/spark.ts -> session_start/session_compact bootstrap',
    installHint: '.pi/extensions/spark.ts + package.json pi fields',
    verifyHint: 'Run a fresh Pi session and confirm using-spark loads at session start.',
    command: {
      file: 'pi',
      args: ['install', 'git:github.com/adityaaria/SPARK'],
    },
  });
}

export function createGeminiAdapter() {
  return createAdapter({
    id: 'gemini',
    label: 'Gemini CLI',
    kind: 'context-file',
    packageRoot,
    envKeys: ['GEMINI_HOME', 'GOOGLE_GEMINI_CLI'],
    binaryNames: ['gemini'],
    configPaths: ['GEMINI.md', 'gemini-extension.json'],
    bootstrap: 'using-spark -> gemini-extension.json -> GEMINI.md context file',
    installHint: 'gemini-extension.json + GEMINI.md + references/gemini-tools.md',
    verifyHint: 'Run a fresh Gemini CLI session and confirm using-spark loads at session start.',
    successMessage: 'Installed SPARK for Gemini CLI.',
    automatedSteps: [
      'Install the SPARK extension into Gemini CLI.',
      'Start a fresh Gemini CLI session to confirm using-spark loads at startup.',
    ],
    command: {
      file: 'gemini',
      args: ['extensions', 'install', 'https://github.com/adityaaria/SPARK'],
    },
  });
}

export function createAntigravityAdapter() {
  return createAdapter({
    id: 'antigravity',
    label: 'Antigravity',
    kind: 'context-file',
    packageRoot,
    envKeys: ['ANTIGRAVITY_PLUGIN_ROOT'],
    binaryNames: ['agy'],
    bootstrap: 'using-spark -> agy plugin install -> contextFileName bootstrap',
    installHint: 'skills/using-spark/references/antigravity-tools.md + plugin install flow',
    verifyHint: 'Run a fresh Antigravity session and confirm using-spark loads from the plugin install.',
    successMessage: 'Installed SPARK for Antigravity.',
    automatedSteps: [
      'Install the SPARK plugin into Antigravity.',
      'Start a fresh Antigravity session to confirm using-spark loads before coding.',
    ],
    command: {
      file: 'agy',
      args: ['plugin', 'install', 'https://github.com/adityaaria/SPARK'],
    },
  });
}
