const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  white: '\x1b[38;2;245;245;245m',
  spark: '\x1b[38;2;255;107;53m',
  accent: '\x1b[38;2;0;245;255m',
  success: '\x1b[38;2;46;204;113m',
  warning: '\x1b[38;2;255;215;0m',
  error: '\x1b[38;2;255;71;87m',
  pink: '\x1b[38;2;255;27;107m',
  dimGray: '\x1b[38;2;107;114;128m',
};

const useColor = process.stdout.isTTY && process.env.NO_COLOR !== '1';

export function printLine(text = '') {
  process.stdout.write(`${text}\n`);
}

export function printHelp() {
  printCommandHeader('Install');
  printLine(labelValue('Usage', 'npx @adityaaria/spark install [--harness <name>] [--dry-run] [--yes] [--verbose]'));
  printLine('');
  printMuted('Without --harness, the installer will ask which AI assistance to target.');
  printLine('');
  printLine(labelValue('Supported', 'Codex, Cursor, Antigravity, Copilot, OpenCode, Gemini, Pi'));
}

export function printCommandHeader(title) {
  printLine(styled('⚡', 'warning') + ' ' + styled('SPARK', 'spark', true) + ' ' + styled('›', 'dimGray') + ' ' + styled(title, 'white', true));
  printLine(styled('Skills installer for coding agents', 'dimGray'));
  printLine('');
}

export function printSection(title) {
  printLine(styled(title, 'accent', true));
}

export function printSummary(title, lines = [], tone = 'info') {
  const toneLabel = {
    info: styled('ℹ', 'accent'),
    success: styled('✓', 'success'),
    warning: styled('•', 'warning'),
    error: styled('✕', 'error'),
  }[tone];

  printLine('');
  printLine(`${toneLabel} ${styled(title, tone === 'error' ? 'error' : tone === 'success' ? 'success' : tone === 'warning' ? 'warning' : 'accent', true)}`);
  for (const line of lines) {
    printLine(`  ${line}`);
  }
}

export function labelValue(label, value) {
  return `${styled(`${label}:`, 'dimGray')}${value ? ` ${styled(value, 'white')}` : ''}`;
}

export function bullet(text, tone = 'dimGray') {
  return `${styled('•', tone)} ${styled(text, 'white')}`;
}

export function step(index, total, text) {
  return `${styled(`[${index}/${total}]`, 'spark', true)} ${styled(text, 'white')}`;
}

export function commandText(text) {
  return styled(text, 'warning');
}

export function pathText(text) {
  return styled(text, 'accent');
}

export function statusText(text, tone = 'white') {
  return styled(text, tone);
}

export function printMuted(text) {
  printLine(styled(text, 'dimGray'));
}

export function formatError(message) {
  return `${styled('✕', 'error')} ${styled(message, 'error', true)}`;
}

export function formatPromptBlock(title, lines = [], footer = null) {
  const output = [];
  output.push(styled(title, 'accent', true));
  output.push(styled('Choose the AI assistance you want SPARK to prepare.', 'dimGray'));
  output.push('');
  output.push(...lines);
  if (footer) {
    output.push('');
    output.push(styled(footer, 'dimGray'));
  }
  return output.join('\n');
}

export function formatPromptPrefix() {
  return `${styled('◆', 'spark')} ${styled('Select', 'pink', true)} ${styled('›', 'dimGray')} `;
}

export function promptOption(index, label, id, hint = null) {
  const base = `${styled(`${index}.`, 'spark', true)} ${styled(label, 'white', true)} ${styled(`(${id})`, 'dimGray')}`;
  return hint ? `${base} ${styled(hint, 'warning')}` : base;
}

function styled(text, tone, bold = false) {
  if (!useColor) {
    return text;
  }

  const color = COLORS[tone] ?? '';
  const weight = bold ? COLORS.bold : '';
  return `${weight}${color}${text}${COLORS.reset}`;
}
