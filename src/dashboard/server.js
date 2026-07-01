import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 4321;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DOCS_DIR = path.join(process.cwd(), '.docs');
const LOCK_FILE = path.join(process.cwd(), '.spark-lock.json');

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
      const files = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md'));
      const docs = files.map(filename => {
        const content = fs.readFileSync(path.join(DOCS_DIR, filename), 'utf-8');
        return { filename, content };
      });
      return res.end(JSON.stringify({ docs }));
    } catch (e) {
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // API Route: Get File Tree (for Heatmap)
  if (req.url === '/api/tree' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    const ignoreDirs = ['node_modules', '.git', '.docs', '.claude', '.cursor', '.codex', 'dist', 'build'];
    
    function scanDir(dir, base = '') {
      let results = [];
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          if (ignoreDirs.includes(item) || item.startsWith('.')) continue;
          const fullPath = path.join(dir, item);
          const relPath = path.join(base, item);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            results.push({ name: item, type: 'dir', path: relPath, children: scanDir(fullPath, relPath) });
          } else {
            results.push({ name: item, type: 'file', path: relPath });
          }
        }
      } catch (e) {}
      return results;
    }
    
    return res.end(JSON.stringify({ tree: scanDir(process.cwd()) }));
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
    const customDir = path.join(process.cwd(), '.agent', 'skills');
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
      // The Anthropic standard allows putting skills in .agent/skills/
      const customSkillsDir = path.join(process.cwd(), '.agent', 'skills', data.name);
      
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
