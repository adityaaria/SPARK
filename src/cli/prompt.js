import readline from 'node:readline/promises';
import { formatPromptPrefix } from './output.js';

export async function askQuestion(question, { input = process.stdin, output = process.stdout } = {}) {
  const rl = readline.createInterface({ input, output });
  try {
    return await rl.question(`${question}\n${formatPromptPrefix()}`);
  } finally {
    rl.close();
  }
}
