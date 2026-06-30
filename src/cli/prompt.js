import readline from 'node:readline/promises';

export async function askQuestion(question, { input = process.stdin, output = process.stdout } = {}) {
  const rl = readline.createInterface({ input, output });
  try {
    return await rl.question(`${question}\n> `);
  } finally {
    rl.close();
  }
}
