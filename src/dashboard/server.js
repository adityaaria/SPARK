import fs from 'fs';
import path from 'path';
import http from 'http';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 4321;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DOCS_DIR = path.join(process.cwd(), '.docs');
const LOCK_FILE = path.join(process.cwd(), '.spark-lock.json');
const RULES_FILE = path.join(process.cwd(), 'docs', 'spark', 'rules', 'KNOWLEDGE_RULES.md');
const MAX_SCAN_FILE_BYTES = 100 * 1024; // skip content-matching on files larger than this
const PLANS_DIR = path.join(process.cwd(), 'docs', 'spark', 'plans');
const PROGRESS_LEDGER = path.join(process.cwd(), '.spark', 'sdd', 'progress.md');

// Must stay identical to the staleness-gate threshold in skills/audit,
// skills/bug-fix, and skills/enhancement (Step 1b) — this badge and that
// gate must never tell a developer contradictory stories.
const STALE_COMMIT_THRESHOLD = 20;
const STALE_DAY_THRESHOLD = 30;

const CONFIDENCE_LABELS = [
  'Confirmed from Code',
  'Inferred from Code Structure',
  'Documentation Conflict',
  'Unverified Pattern',
  'Insufficient Evidence',
  'AI-Risk',
  'Not Applicable',
];

// Shared by /api/docs and /api/memory-health — project-scanner's contract
// only fixes file names, not directory presence, so an empty array (not an
// error) is the correct result when .docs/ doesn't exist yet.
function readDocsFiles() {
  if (!fs.existsSync(DOCS_DIR)) return [];
  return fs.readdirSync(DOCS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(filename => ({ filename, content: fs.readFileSync(path.join(DOCS_DIR, filename), 'utf-8') }));
}

// project-scanner requires these fields to exist but doesn't fix their exact
// written format, so every extraction here is a tolerant best-effort text
// heuristic, not a strict parse — see docs/auto-refresh-project-memory.md
// and skills/project-scanner/SKILL.md for the actual field contract.
function extractLastScanned(content) {
  const m = content.match(/Last\s*Scanned[\s\S]{0,50}?(\d{4}-\d{2}-\d{2})/i);
  return m ? m[1] : null;
}

function extractConfidenceDistribution(content) {
  const confidence = {};
  for (const label of CONFIDENCE_LABELS) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matches = content.match(new RegExp(escaped, 'g'));
    confidence[label] = matches ? matches.length : 0;
  }
  return confidence;
}

function extractGaps(content) {
  const headingMatch = content.match(/^#{2,3}\s*Gaps\s*\/\s*Unknowns.*$/im);
  if (!headingMatch) return [];

  const startIdx = headingMatch.index + headingMatch[0].length;
  const rest = content.slice(startIdx);
  const nextHeadingMatch = rest.match(/^#{1,6}\s+\S/m);
  const section = nextHeadingMatch ? rest.slice(0, nextHeadingMatch.index) : rest;

  return section
    .split('\n')
    .map(l => l.trim())
    .filter(l => /^[-*]\s+/.test(l))
    .map(l => l.replace(/^[-*]\s+/, '').trim())
    .filter(Boolean);
}

function countCommitsSince(dateStr) {
  if (!dateStr) return null;
  try {
    const out = execSync(`git rev-list --count --since="${dateStr}" HEAD`, { cwd: process.cwd(), encoding: 'utf-8' });
    return parseInt(out.trim(), 10);
  } catch (e) {
    return null; // not a git repo, git not installed, etc. — not a fatal error
  }
}

function analyzeMemoryFile(filename, content) {
  const lastScanned = extractLastScanned(content);
  const confidence = extractConfidenceDistribution(content);
  const totalLabels = Object.values(confidence).reduce((a, b) => a + b, 0);
  const gaps = extractGaps(content);

  const result = {
    filename,
    lastScanned,
    commitsSinceLastScan: countCommitsSince(lastScanned),
    confidence,
    gaps,
  };

  if (totalLabels === 0) {
    result.insufficientData = true;
    result.score = null;
  } else {
    result.insufficientData = false;
    result.score = Math.round((confidence['Confirmed from Code'] / totalLabels) * 100) / 100;
  }

  return result;
}

function buildMemoryHealth() {
  const docs = readDocsFiles();
  const files = docs.map(d => analyzeMemoryFile(d.filename, d.content));

  const scored = files.filter(f => !f.insufficientData);
  const totalConfirmed = scored.reduce((sum, f) => sum + f.confidence['Confirmed from Code'], 0);
  const totalLabels = scored.reduce((sum, f) => sum + Object.values(f.confidence).reduce((a, b) => a + b, 0), 0);
  const overallScore = totalLabels === 0 ? null : Math.round((totalConfirmed / totalLabels) * 100) / 100;
  const totalGaps = files.reduce((sum, f) => sum + f.gaps.length, 0);

  return { files, overallScore, totalGaps };
}

// Same heading pattern as skills/subagent-driven-development/scripts/task-brief:
// any heading level, "Task <N>", followed by a non-digit or end of line.
const TASK_HEADING_RE = /^#+\s+Task\s+(\d+)\s*:?\s*(.*)$/m;
const TASK_HEADING_RE_G = /^#+\s+Task\s+(\d+)\s*:?\s*(.*)$/gm;

function parsePlanFilename(filename) {
  const m = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
  return m ? { date: m[1], featureName: m[2] } : { date: null, featureName: null };
}

function listPlans() {
  if (!fs.existsSync(PLANS_DIR)) return [];

  const files = fs.readdirSync(PLANS_DIR).filter(f => f.endsWith('.md'));
  const plans = files.map(filename => {
    const content = fs.readFileSync(path.join(PLANS_DIR, filename), 'utf-8');
    const { date, featureName } = parsePlanFilename(filename);
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const taskCount = (content.match(TASK_HEADING_RE_G) || []).length;

    return {
      filename,
      date,
      featureName,
      title: titleMatch ? titleMatch[1].trim() : filename,
      taskCount,
    };
  });

  plans.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return plans;
}

function readPlan(filename) {
  // Guard against path traversal — only allow a bare filename within PLANS_DIR.
  const safeName = path.basename(filename);
  const fullPath = path.join(PLANS_DIR, safeName);
  if (!fs.existsSync(fullPath)) return null;

  const content = fs.readFileSync(fullPath, 'utf-8');
  const tasks = [];
  let match;
  const re = new RegExp(TASK_HEADING_RE_G);
  while ((match = re.exec(content)) !== null) {
    tasks.push({ number: parseInt(match[1], 10), title: match[2].trim() });
  }

  return { filename: safeName, content, tasks };
}

// Ledger lines look like: "Task N: complete (commits <base7>..<head7>, review clean)".
// Anything that doesn't match is kept verbatim as { raw } so no line is silently dropped.
const LEDGER_LINE_RE = /^Task\s+(\d+):\s*(complete)\s*\(([^)]*)\)\s*$/;

function parseProgressLedger() {
  if (!fs.existsSync(PROGRESS_LEDGER)) return { exists: false, entries: [], planPath: null };

  const rawContent = fs.readFileSync(PROGRESS_LEDGER, 'utf-8');
  const lines = rawContent.split('\n').filter(l => l.trim() !== '');

  // Ledgers written by the current skill version start with "Plan: <path>".
  // Older ledgers won't have it — planPath stays null, never an error.
  let planPath = null;
  const planLineMatch = lines[0] && lines[0].match(/^Plan:\s*(.+)$/);
  const taskLines = planLineMatch ? lines.slice(1) : lines;
  if (planLineMatch) planPath = planLineMatch[1].trim();

  const entries = taskLines.map(line => {
    const m = line.match(LEDGER_LINE_RE);
    if (!m) return { raw: line };
    return { taskNumber: parseInt(m[1], 10), status: m[2], commits: m[3].split(',')[0].trim(), note: m[3] };
  });

  return { exists: true, entries, rawContent, planPath };
}

// Parse docs/spark/rules/KNOWLEDGE_RULES.md into structured rule objects.
// Simple block-based parsing on purpose — the file format is a fixed
// "## RULE-xxx: title" + "- Field: value" list, no need for a markdown parser.
function parseKnowledgeRules() {
  if (!fs.existsSync(RULES_FILE)) return [];

  const content = fs.readFileSync(RULES_FILE, 'utf-8');
  const blocks = content.split(/^## /m).slice(1);
  const rules = [];

  for (const block of blocks) {
    const headingMatch = block.match(/^(RULE-\d{3}):\s*(.+)$/m);
    if (!headingMatch) continue;

    const getField = (field) => {
      const m = block.match(new RegExp(`^- ${field}:\\s*(.*)$`, 'm'));
      return m ? m[1].trim() : '';
    };

    rules.push({
      id: headingMatch[1],
      title: headingMatch[2].trim(),
      severity: getField('Severity'),
      source: getField('Source'),
      added: getField('Added'),
      lastVerified: getField('Last-Verified'),
      rationale: getField('Rationale'),
      detection: getField('Detection'),
      enforcedVia: getField('Enforced-Via'),
      fixGuidance: getField('Fix Guidance'),
    });
  }

  return rules;
}

const RULES_FILE_HEADER = `<!--
About This File — Knowledge Rules

This file holds explicit coding-standard rules for this project, enforced during
review (audit, bug-fix) and implementation (enhancement). Unlike .docs/ (stable,
descriptive project memory built by project-scanner), every entry here is
prescriptive — a rule the project has decided to hold code to.

Managed by the knowledge-rules skill. You can also edit this file by hand.
Rules with Source: manual are permanent developer decisions — refreshing this
file may only add or update Source: auto-detected entries; it must never
delete or overwrite a manual entry.
-->

# Knowledge Rules
`;

function nextRuleId(rules) {
  const max = rules.reduce((acc, r) => {
    const n = parseInt(r.id.replace('RULE-', ''), 10);
    return Number.isNaN(n) ? acc : Math.max(acc, n);
  }, 0);
  return `RULE-${String(max + 1).padStart(3, '0')}`;
}

function formatRuleBlock(rule) {
  return `\n## ${rule.id}: ${rule.title}
- Severity: ${rule.severity}
- Source: ${rule.source}
- Added: ${rule.added}
- Last-Verified: ${rule.lastVerified}
- Rationale: ${rule.rationale}
- Detection: ${rule.detection}
- Enforced-Via: ${rule.enforcedVia}
- Fix Guidance: ${rule.fixGuidance}
`;
}

function appendManualRule({ title, severity, rationale, detection, fixGuidance }) {
  const existingRules = parseKnowledgeRules();
  const today = new Date().toISOString().slice(0, 10);
  const rule = {
    id: nextRuleId(existingRules),
    title: title || 'Untitled rule',
    severity: severity === 'Should' ? 'Should' : 'Must',
    source: 'manual',
    added: today,
    lastVerified: today,
    rationale: rationale || '',
    detection: detection || '',
    // Created via the dashboard API, not the knowledge-rules skill's
    // interactive Lint-Mapping flow — there is no one to confirm a linter
    // config edit against here, so default to agent-review.
    enforcedVia: 'agent-review',
    fixGuidance: fixGuidance || '',
  };

  fs.mkdirSync(path.dirname(RULES_FILE), { recursive: true });
  if (!fs.existsSync(RULES_FILE)) {
    fs.writeFileSync(RULES_FILE, RULES_FILE_HEADER, 'utf-8');
  }
  fs.appendFileSync(RULES_FILE, formatRuleBlock(rule), 'utf-8');
  return rule;
}

// Returns 'not-found', 'not-manual', or 'deleted'.
function deleteRuleById(id) {
  if (!fs.existsSync(RULES_FILE)) return 'not-found';

  const content = fs.readFileSync(RULES_FILE, 'utf-8');
  const blockRegex = new RegExp(`\\n## ${id}:[\\s\\S]*?(?=\\n## RULE-\\d{3}:|$)`);
  const match = content.match(blockRegex);
  if (!match) return 'not-found';

  const sourceMatch = match[0].match(/^- Source:\s*(.*)$/m);
  if (!sourceMatch || sourceMatch[1].trim() !== 'manual') return 'not-manual';

  const updated = content.replace(blockRegex, '');
  fs.writeFileSync(RULES_FILE, updated, 'utf-8');
  return 'deleted';
}

// A rule's Detection field is a plain keyword/phrase or a small regex fragment.
// Try it as a regex first; fall back to a literal substring match if it
// doesn't compile (e.g. an unescaped word like "watch" or "any").
function detectionMatches(detection, text) {
  if (!detection) return false;
  try {
    return new RegExp(detection, 'i').test(text);
  } catch (e) {
    return text.toLowerCase().includes(detection.toLowerCase());
  }
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Handle JSON body for POST
  const getBody = (request) => new Promise((resolve) => {
    let body = '';
    request.on('data', chunk => body += chunk.toString());
    request.on('end', () => {
      try { resolve(JSON.parse(body)); } catch(e) { resolve({}); }
    });
  });

  // API Route: Get all markdown docs
  if (req.url === '/api/docs' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    if (!fs.existsSync(DOCS_DIR)) {
      return res.end(JSON.stringify({ error: 'No .docs/ directory found in this project. Please run project-scanner skill first.' }));
    }

    try {
      return res.end(JSON.stringify({ docs: readDocsFiles() }));
    } catch (e) {
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // API Route: Aggregated Last Scanned / Confidence / Gaps health view
  if (req.url === '/api/memory-health' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    try {
      return res.end(JSON.stringify(buildMemoryHealth()));
    } catch (e) {
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // API Route: List all writing-plans plans
  if (req.url === '/api/plans' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    try {
      return res.end(JSON.stringify({ plans: listPlans() }));
    } catch (e) {
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // API Route: Get one plan's content and task list
  if (req.url.startsWith('/api/plans/') && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    const filename = decodeURIComponent(req.url.slice('/api/plans/'.length));
    try {
      const plan = readPlan(filename);
      if (!plan) return res.end(JSON.stringify({ error: `Plan file not found: ${filename}` }));
      return res.end(JSON.stringify(plan));
    } catch (e) {
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // API Route: Get the subagent-driven-development progress ledger
  if (req.url === '/api/progress' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    try {
      return res.end(JSON.stringify(parseProgressLedger()));
    } catch (e) {
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // API Route: Get File Tree (for Heatmap)
  if (req.url === '/api/tree' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');

    const rulesConfigured = fs.existsSync(RULES_FILE);
    const rules = rulesConfigured ? parseKnowledgeRules().filter(r => r.detection) : [];

    // Match an item against every rule with a mechanical Detection pattern.
    // Checks the name always; checks file content too, for files under the
    // size guard, so content-only patterns (e.g. "any", "console.log") work.
    const findViolatedRule = (item, fullPath, stat) => {
      for (const rule of rules) {
        if (detectionMatches(rule.detection, item)) return rule;

        if (stat.isFile() && stat.size <= MAX_SCAN_FILE_BYTES) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            if (detectionMatches(rule.detection, content)) return rule;
          } catch (e) {
            // binary or unreadable file — skip content check
          }
        }
      }
      return null;
    };

    const getDirectoryTree = (dirPath, relativePath = '') => {
      const items = fs.readdirSync(dirPath);
      let result = [];

      for (const item of items) {
        if (['node_modules', '.git', '.docs', '.agents', '.spark'].includes(item)) continue;

        const fullPath = path.join(dirPath, item);
        const itemRelativePath = path.join(relativePath, item);
        const stat = fs.statSync(fullPath);

        let isDanger = false;
        let dangerReason = '';

        if (rulesConfigured) {
          const violated = findViolatedRule(item, fullPath, stat);
          if (violated) {
            isDanger = true;
            dangerReason = `${violated.id}: ${violated.title} — ${violated.rationale} ${violated.fixGuidance}`.trim();
          }
        }

        if (stat.isDirectory()) {
          const children = getDirectoryTree(fullPath, itemRelativePath);
          result.push({
            name: item,
            path: itemRelativePath,
            type: 'dir',
            isDanger,
            dangerReason,
            children
          });
        } else {
          result.push({
            name: item,
            path: itemRelativePath,
            type: 'file',
            isDanger,
            dangerReason
          });
        }
      }
      return result;
    };

    return res.end(JSON.stringify({ tree: getDirectoryTree(process.cwd()), rulesConfigured }));
  }

  // API Route: Get SPARK Readme (for Guide)
  if (req.url === '/api/readme' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    const readmePath = path.join(__dirname, '../../README.md');
    if (fs.existsSync(readmePath)) {
      return res.end(JSON.stringify({ content: fs.readFileSync(readmePath, 'utf-8') }));
    }
    return res.end(JSON.stringify({ content: '# Documentation not found' }));
  }

  // API Route: Save Custom Skill (for Skill Studio)
  if (req.url === '/api/skills' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    let skills = [];
    
    // 1. Core skills
    const coreDir = path.join(__dirname, '../../skills');
    if (fs.existsSync(coreDir)) {
      try {
        const items = fs.readdirSync(coreDir);
        for (const item of items) {
          const stat = fs.statSync(path.join(coreDir, item));
          if (stat.isDirectory()) skills.push({ name: item, type: 'core' });
        }
      } catch (e) {}
    }
    
    // 2. Custom skills
    const customDir = path.join(process.cwd(), '.agents', 'skills');
    if (fs.existsSync(customDir)) {
      try {
        const items = fs.readdirSync(customDir);
        for (const item of items) {
          const stat = fs.statSync(path.join(customDir, item));
          if (stat.isDirectory()) skills.push({ name: item, type: 'custom' });
        }
      } catch (e) {}
    }
    
    return res.end(JSON.stringify({ skills }));
  }

  if (req.url === '/api/skills' && req.method === 'POST') {
    res.setHeader('Content-Type', 'application/json');
    getBody(req).then(data => {
      if (!data.name || !data.content) {
        return res.end(JSON.stringify({ error: 'Missing name or content' }));
      }
      
      // Save to a safe, user-level directory that SPARK updates won't touch
      // The Anthropic/Gemini standard allows putting skills in .agents/skills/
      const customSkillsDir = path.join(process.cwd(), '.agents', 'skills', data.name);
      
      try {
        fs.mkdirSync(customSkillsDir, { recursive: true });
        fs.writeFileSync(path.join(customSkillsDir, 'SKILL.md'), data.content, 'utf-8');
        return res.end(JSON.stringify({ success: true, path: customSkillsDir }));
      } catch (e) {
        return res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // API Route: Get all Knowledge Rules
  if (req.url === '/api/rules' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ rules: parseKnowledgeRules(), rulesConfigured: fs.existsSync(RULES_FILE) }));
  }

  // API Route: Add a manual Knowledge Rule
  if (req.url === '/api/rules' && req.method === 'POST') {
    res.setHeader('Content-Type', 'application/json');
    getBody(req).then(data => {
      if (!data.title || !data.rationale) {
        return res.end(JSON.stringify({ error: 'Missing title or rationale' }));
      }
      try {
        const rule = appendManualRule(data);
        return res.end(JSON.stringify({ success: true, rule }));
      } catch (e) {
        return res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // API Route: Delete a manual Knowledge Rule
  if (req.url.match(/^\/api\/rules\/RULE-\d{3}$/) && req.method === 'DELETE') {
    res.setHeader('Content-Type', 'application/json');
    const id = req.url.split('/').pop();
    try {
      const result = deleteRuleById(id);
      if (result === 'not-found') {
        return res.end(JSON.stringify({ error: `${id} not found.` }));
      }
      if (result === 'not-manual') {
        return res.end(JSON.stringify({ error: `${id} is auto-detected, not manual. Re-run the knowledge-rules skill to refresh auto-detected rules instead of deleting them from the dashboard.` }));
      }
      return res.end(JSON.stringify({ success: true }));
    } catch (e) {
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // API Route: Get Spark Lock status
  if (req.url === '/api/status' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    let status = { installed: false, agents: [] };
    if (fs.existsSync(LOCK_FILE)) {
      try {
        status = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf-8'));
        status.installed = true;
      } catch (e) {}
    }
    return res.end(JSON.stringify(status));
  }

  // Static File Server
  let filePath = req.url === '/' ? '/index.html' : req.url;
  // Prevent path traversal
  filePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
  const ext = path.extname(filePath);
  
  const contentTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
  };

  const contentType = contentTypes[ext] || 'text/plain';
  const fullPath = path.join(PUBLIC_DIR, filePath);

  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(fullPath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('404 Not Found');
  }
});

export function startDashboard() {
  server.listen(PORT, async () => {
    console.log(`\n🚀 SPARK Dashboard running at http://localhost:${PORT}`);
    console.log(`Open this URL in your browser to view the AI Knowledge Base.`);
    console.log(`Press Ctrl+C to stop.\n`);
    
    // Attempt to open browser automatically
    const { exec } = await import('child_process');
    const startCmd = process.platform == 'darwin' ? 'open' : process.platform == 'win32' ? 'start' : 'xdg-open';
    exec(`${startCmd} http://localhost:${PORT}`);
  });
}
