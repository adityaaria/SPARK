import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { printCommandHeader, printLine, printMuted, printSummary, commandText, pathText } from './output.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../..');

const INTEGRATIONS = {
  rudis: {
    markerPath: '.spark/integrations/rudis.json',
    skillSource: 'integrations/rudis/skills/rudis-adapter',
    skillTarget: '.agents/skills/rudis-adapter',
    marker: {
      enabled: true,
      mode: 'read-only',
      constitution: '.rudis/memory/constitution.md',
      specs: 'specs',
      adapter: '.agents/skills/rudis-adapter',
    },
  },
};

export async function runIntegration(args = []) {
  const [action, name, ...rest] = args;

  if (!action || action === '--help' || action === '-h' || action === 'help') {
    printIntegrationHelp();
    return;
  }

  if (action !== 'install') {
    throw new Error(`Unknown integration action: ${action}`);
  }

  if (!name) {
    throw new Error('Missing integration name. Usage: spark integration install rudis');
  }

  const integration = INTEGRATIONS[name];
  if (!integration) {
    throw new Error(`Unknown integration: ${name}`);
  }

  const dryRun = rest.includes('--dry-run');
  const markerPath = resolve(process.cwd(), integration.markerPath);
  const markerJson = `${JSON.stringify(integration.marker, null, 2)}\n`;

  printCommandHeader('Integration');

  if (dryRun) {
    printMuted(`[DRY-RUN] Would write ${integration.markerPath}`);
    printMuted(`[DRY-RUN] Would install adapter skill at ${integration.skillTarget}`);
    printMuted('[DRY-RUN] Would not install or execute the external tool.');
    return;
  }

  await mkdir(resolve(process.cwd(), '.spark/integrations'), { recursive: true });
  await writeFile(markerPath, markerJson, 'utf8');
  await copyDirectory(
    resolve(REPO_ROOT, integration.skillSource),
    resolve(process.cwd(), integration.skillTarget),
  );

  printSummary('Optional integration enabled', [
    `Integration: ${name}`,
    `Marker: ${pathText(integration.markerPath)}`,
    `Adapter: ${pathText(integration.skillTarget)}`,
    'Mode: read-only',
    `Next: ${commandText('Use the rudis-adapter skill when Rudis context is needed.')}`,
  ], 'success');
}

function printIntegrationHelp() {
  printCommandHeader('Integration');
  printLine('Usage: spark integration install rudis [--dry-run]');
  printLine('');
  printMuted('Enables optional, read-only external knowledge adapters for the current project.');
}

async function copyDirectory(source, target) {
  await mkdir(target, { recursive: true });

  const entries = await readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = resolve(source, entry.name);
    const targetPath = resolve(target, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, targetPath);
      continue;
    }

    if (entry.isFile()) {
      const sourceStat = await stat(sourcePath);
      const content = await readFile(sourcePath);
      await writeFile(targetPath, content, { mode: sourceStat.mode });
    }
  }
}
