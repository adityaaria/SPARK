#!/usr/bin/env node
import { run } from '../src/cli/index.js';
import { formatError } from '../src/cli/output.js';

run(process.argv.slice(2), process.env).catch((error) => {
  process.stderr.write(`${formatError(error instanceof Error ? error.message : String(error))}\n`);
  process.exitCode = 1;
});
