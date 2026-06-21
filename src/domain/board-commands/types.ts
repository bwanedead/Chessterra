export interface CommandResult {
  ok: boolean;
  lines: string[];
  /** When set, host should recreate session with this config */
  reloadConfig?: {
    rulesetId: string;
    fen?: string;
  };
}

export interface CommandContext {
  getState: () => import('@/domain/board-session').BoardSessionState;
  apply: (message: import('@/domain/board-session').ProgressMessage) => import('@/domain/board-core/types').ApplyResult;
}

export type CommandHandler = (
  ctx: CommandContext,
  args: string[],
  flags: Record<string, string | boolean>,
) => CommandResult;

export interface CommandDefinition {
  name: string;
  aliases?: string[];
  usage: string;
  description: string;
  handler: CommandHandler;
}
