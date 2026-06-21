import { getBoardCommand } from './commands';
import { tokenizeCommandLine } from './parser';
import type { CommandContext, CommandResult } from './types';

export const executeBoardCommand = (ctx: CommandContext, input: string): CommandResult => {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: true, lines: [] };
  }

  const tokens = tokenizeCommandLine(trimmed);
  const [commandName, ...args] = tokens;
  const command = getBoardCommand(commandName);

  if (!command) {
    return {
      ok: false,
      lines: [`Unknown command: ${commandName}`, 'Type "help" for available commands.'],
    };
  }

  return command.handler(ctx, args, {});
};
