import fs from 'node:fs';
import path from 'node:path';

const CODEX_MARKETPLACE_DIR = path.join('.spark', 'codex-marketplace');
const CODEX_PLUGIN_DIR = path.join(CODEX_MARKETPLACE_DIR, 'plugins', 'spark');
const COPY_PATHS = [
  '.codex-plugin',
  'assets',
  path.join('hooks', 'hooks-codex.json'),
  path.join('hooks', 'run-hook.cmd'),
  path.join('hooks', 'session-start-codex'),
  'skills',
];

export function stageCodexPlugin({ cwd = process.cwd(), packageRoot, dryRun = false }) {
  const marketplaceRoot = path.join(cwd, CODEX_MARKETPLACE_DIR);
  const targetRoot = path.join(cwd, CODEX_PLUGIN_DIR);

  if (!dryRun) {
    fs.mkdirSync(targetRoot, { recursive: true });
  }

  if (!dryRun) {
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

    writeMarketplaceManifest(marketplaceRoot);
  }

  return {
    targetRoot,
    relativeTargetRoot: CODEX_PLUGIN_DIR,
    marketplaceRoot,
    relativeMarketplaceRoot: `./${CODEX_MARKETPLACE_DIR}`,
  };
}

function writeMarketplaceManifest(marketplaceRoot) {
  const manifestPath = path.join(marketplaceRoot, '.agents', 'plugins', 'marketplace.json');
  const manifest = {
    name: 'spark-local',
    interface: {
      displayName: 'SPARK',
      shortDescription: 'Local SPARK marketplace for Codex CLI',
    },
    plugins: [
      {
        name: 'spark',
        source: {
          source: 'local',
          path: './plugins/spark',
        },
        policy: {
          installation: 'AVAILABLE',
          authentication: 'ON_INSTALL',
        },
        category: 'Productivity',
      },
    ],
  };

  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
}
