import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function runInstall(args = [], env = process.env) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(__dirname, '../../bin/spark-install.sh');
    const child = spawn('bash', [scriptPath, ...args], {
      stdio: 'inherit',
      env,
    });

    let settled = false;

    child.on('error', (err) => {
      if (settled) return;
      settled = true;
      if (err.code === 'ENOENT') {
        process.stderr.write(
          'Error: "bash" command not found.\n\n' +
          'SPARK native installer requires bash to run.\n' +
          'If you are on Windows, please run this command inside WSL, Git Bash, or check README.md for manual installation instructions.\n'
        );
        process.exitCode = 1;
        resolve();
        return;
      }
      reject(err);
    });

    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      process.exitCode = code ?? 1;
      resolve();
    });
  });
}
