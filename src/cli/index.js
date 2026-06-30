import { parseArgs } from './parse-args.js';
import { printHelp, printLine } from './output.js';
import { runInstall } from './install.js';

export async function run(argv, env) {
  const options = parseArgs(argv);

  if (options.help || options.command === 'help') {
    printHelp();
    return;
  }

  if (!options.command) {
    printHelp();
    return;
  }

  if (options.command === 'install') {
    await runInstall(options, env);
    return;
  }

  throw new Error(`Unknown command: ${options.command}`);
}

export { printLine };
