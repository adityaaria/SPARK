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
