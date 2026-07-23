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
const DEFAULT_HEADER_WIDTH = 64;

export function printLine(text = '') {
  process.stdout.write(`${text}\n`);
}

export function printHelp() {
  printCommandHeader('Install');
  printLine(labelValue('Usage', 'npx @adityaaria/spark install [options]'));
  printLine('');
  printMuted('Wraps the native SPARK installer (bin/spark-install.sh).');
  printMuted('Optional integrations: npx @adityaaria/spark integration install rudis');
  printLine('');
  printLine(labelValue('Options', '-g, --global    Install to global agent config (~/.agents/skills/)'));
  printLine(labelValue('       ', '--force         Re-install even if already installed'));
  printLine(labelValue('       ', '--dry-run       Show what would be done without making changes'));
  printLine(labelValue('       ', '-h, --help      Show this help message'));
}

export function printCommandHeader(title) {
  const lines = buildCommandHeader(title);
  for (const line of lines) {
    printLine(line);
  }
}

export function buildCommandHeader(title, options = {}) {
  const width = Math.max(44, options.width ?? getTerminalWidth());
  const colorize = options.colorize ?? useColor;
  const titleText = `SPARK ${title}`;
  const subtitle = 'Skills installer for coding agents';

  return [
    colorize ? styled('═'.repeat(width), 'dimGray') : '═'.repeat(width),
    centerLine(titleText, width, { tone: 'white', accentTone: 'spark', accentWord: 'SPARK', bold: true, colorize }),
    centerLine(subtitle, width, { tone: 'dimGray', colorize }),
    colorize ? styled('═'.repeat(width), 'dimGray') : '═'.repeat(width),
    '',
  ];
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

export function promptOption(index, label, id, hint = null, detail = null) {
  const base = `${styled(`${index}.`, 'spark', true)} ${styled(label, 'white', true)} ${styled(`(${id})`, 'dimGray')}`;
  const header = hint ? `${base} ${styled(hint, 'warning')}` : base;

  if (!detail) {
    return header;
  }

  return `${header}\n   ${styled(detail, 'dimGray')}`;
}

function styled(text, tone, bold = false) {
  if (!useColor) {
    return text;
  }

  const color = COLORS[tone] ?? '';
  const weight = bold ? COLORS.bold : '';
  return `${weight}${color}${text}${COLORS.reset}`;
}

function centerLine(text, width, options = {}) {
  const tone = options.tone ?? 'white';
  const colorize = options.colorize ?? useColor;
  const raw = text.length >= width ? text : text.padStart(Math.floor((width + text.length) / 2)).padEnd(width);

  if (!colorize) {
    return raw;
  }

  if (options.accentWord) {
    const accentWord = options.accentWord;
    const start = raw.indexOf(accentWord);
    if (start >= 0) {
      const before = raw.slice(0, start);
      const highlighted = styled(accentWord, options.accentTone ?? tone, options.bold ?? false);
      const after = styled(raw.slice(start + accentWord.length), tone, options.bold ?? false);
      return `${styled(before, tone, options.bold ?? false)}${highlighted}${after}`;
    }
  }

  return styled(raw, tone, options.bold ?? false);
}

function getTerminalWidth() {
  if (!process.stdout.isTTY || !Number.isFinite(process.stdout.columns)) {
    return DEFAULT_HEADER_WIDTH;
  }

  return Math.min(DEFAULT_HEADER_WIDTH, Math.max(44, process.stdout.columns));
}
