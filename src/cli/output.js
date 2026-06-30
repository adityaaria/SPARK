export function printLine(text = '') {
  process.stdout.write(`${text}\n`);
}

export function printHelp() {
  printLine('SPARK npm installer');
  printLine('');
  printLine('Usage: npx spark install [--harness <name>] [--dry-run] [--yes] [--verbose]');
  printLine('');
  printLine('Supported harnesses: Codex, Cursor, Antigravity, Copilot, OpenCode, Gemini, Pi');
}
