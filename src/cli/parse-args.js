export function parseArgs(argv) {
  const args = [...argv];
  const options = {
    command: null,
    help: false,
    dryRun: false,
    yes: false,
    verbose: false,
    harness: null,
  };

  while (args.length) {
    const arg = args.shift();
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }
    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (arg === '--yes' || arg === '-y') {
      options.yes = true;
      continue;
    }
    if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
      continue;
    }
    if (arg === '--harness') {
      options.harness = args.shift() ?? null;
      continue;
    }
    if (arg.startsWith('--harness=')) {
      options.harness = arg.slice('--harness='.length) || null;
      continue;
    }
    if (!options.command) {
      options.command = arg;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}
