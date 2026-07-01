import { printHelp, printLine } from './output.js';
import { runInstall } from './install.js';

export async function run(argv = [], env = process.env) {
  if (argv.length === 0 || argv[0] === '--help' || argv[0] === '-h' || argv[0] === 'help') {
    printHelp();
    return;
  }

  const [command, ...args] = argv;

  if (command === 'install') {
    await runInstall(args, env);
    return;
  }

  if (command === 'dashboard' || command === 'ui') {
    const { startDashboard } = await import('../dashboard/server.js');
    startDashboard();
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

export { printLine };
