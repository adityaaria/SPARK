import fs from 'node:fs';
import path from 'node:path';

const CLAUDE_MARKETPLACE_DIR = path.join('.spark', 'claude-marketplace');
const CLAUDE_PLUGIN_DIR = path.join(CLAUDE_MARKETPLACE_DIR, 'plugins', 'spark');
const COPY_PATHS = [
  '.claude-plugin',
  'assets',
  path.join('hooks', 'hooks.json'),
  path.join('hooks', 'run-hook.cmd'),
  path.join('hooks', 'session-start'),
  'skills',
];

export function stageClaudePlugin({ cwd = process.cwd(), packageRoot, dryRun = false }) {
  const marketplaceRoot = path.join(cwd, CLAUDE_MARKETPLACE_DIR);
  const targetRoot = path.join(cwd, CLAUDE_PLUGIN_DIR);

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

    writeMarketplaceManifest(marketplaceRoot);
  }

  return {
    targetRoot,
    relativeTargetRoot: CLAUDE_PLUGIN_DIR,
    marketplaceRoot,
    relativeMarketplaceRoot: CLAUDE_MARKETPLACE_DIR,
    marketplaceName: 'spark-local',
  };
}

function writeMarketplaceManifest(marketplaceRoot) {
  const manifestPath = path.join(marketplaceRoot, 'marketplace.json');
  const manifest = {
    name: 'spark-local',
    plugins: [
      {
        name: 'spark',
        description: 'SPARK local marketplace for Claude Code',
        version: 'local',
        source: './plugins/spark',
        author: {
          name: 'SPARK',
        },
      },
    ],
  };

  fs.mkdirSync(marketplaceRoot, { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
}
