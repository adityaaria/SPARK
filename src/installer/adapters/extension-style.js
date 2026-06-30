import { createAdapter } from './common.js';

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
    verifyHint: 'Run opencode logs or a fresh OpenCode session and confirm bootstrap injection.',
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
    envKeys: ['GEMINI_HOME', 'GOOGLE_GEMINI_CLI'],
    binaryNames: ['gemini'],
    configPaths: ['GEMINI.md', 'gemini-extension.json'],
    bootstrap: 'using-spark -> gemini-extension.json -> GEMINI.md context file',
    installHint: 'gemini-extension.json + GEMINI.md + references/gemini-tools.md',
    verifyHint: 'Run a fresh Gemini CLI session and confirm using-spark loads at session start.',
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
    envKeys: ['ANTIGRAVITY_PLUGIN_ROOT'],
    binaryNames: ['agy'],
    bootstrap: 'using-spark -> agy plugin install -> contextFileName bootstrap',
    installHint: 'skills/using-spark/references/antigravity-tools.md + plugin install flow',
    verifyHint: 'Run a fresh Antigravity session and confirm using-spark loads from the plugin install.',
    command: {
      file: 'agy',
      args: ['plugin', 'install', 'https://github.com/adityaaria/SPARK'],
    },
  });
}
