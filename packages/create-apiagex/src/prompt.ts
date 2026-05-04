import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

import type { PromptIO, PromptOption } from './prompt.type.js';

export function createPromptIO(): PromptIO {
  const rl = readline.createInterface({ input, output });

  return {
    async ask(message: string, defaultValue?: string): Promise<string> {
      const suffix = defaultValue ? ` (${defaultValue})` : '';
      const answer = await rl.question(`${message}${suffix}: `);
      return answer.trim() || defaultValue || '';
    },
    async choose(message: string, options: PromptOption[]): Promise<string> {
      const menu = options.map((option, index) => `${index + 1}. ${option.label}`).join('\n');
      const answer = await rl.question(`${message}\n${menu}\nChoose 1-${options.length}: `);
      const selected = Number.parseInt(answer.trim(), 10);

      if (Number.isInteger(selected) && selected >= 1 && selected <= options.length) {
        const choice = options[selected - 1];
        if (choice) {
          return choice.value;
        }
      }

      return options[0]?.value ?? '';
    },
    async confirm(message: string, defaultValue = true): Promise<boolean> {
      const suffix = defaultValue ? ' (Y/n)' : ' (y/N)';
      const answer = await rl.question(`${message}${suffix}: `);
      const normalized = answer.trim().toLowerCase();

      if (!normalized) {
        return defaultValue;
      }

      return normalized === 'y' || normalized === 'yes';
    },
    async close(): Promise<void> {
      rl.close();
    },
  };
}
