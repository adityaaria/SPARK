import {
  createClaudeCodeAdapter,
  createCodexAdapter,
  createCopilotAdapter,
  createCursorAdapter,
  createVsCodeAdapter,
} from './adapters/shell-hook.js';
import {
  createAntigravityAdapter,
  createGeminiAdapter,
  createOpenCodeAdapter,
  createPiAdapter,
} from './adapters/extension-style.js';

const ADAPTERS = [
  createClaudeCodeAdapter(),
  createCodexAdapter(),
  createVsCodeAdapter(),
  createCursorAdapter(),
  createCopilotAdapter(),
  createOpenCodeAdapter(),
  createGeminiAdapter(),
  createPiAdapter(),
  createAntigravityAdapter(),
];

export function listAdapters() {
  return ADAPTERS.map((adapter) => ({ ...adapter }));
}

export function getAdapterById(id) {
  return ADAPTERS.find((adapter) => adapter.id === id) ?? null;
}

export function getAdapterLabels() {
  return ADAPTERS.map((adapter) => adapter.label);
}
