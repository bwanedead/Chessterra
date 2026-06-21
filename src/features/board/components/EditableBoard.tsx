'use client';

import { useCallback, useMemo, useState } from 'react';
import '@/domain/board-rules';
import { executeBoardCommand } from '@/domain/board-commands';
import type { BoardSessionConfig } from '@/domain/board-session';
import { DEV_START_FEN } from '@/domain/endgame/devPosition';
import { useBoardSession } from '../hooks/useBoardSession';
import { BoardConsole } from './BoardConsole';
import { BoardSessionView } from './BoardSessionView';

export interface EditableBoardProps {
  initialConfig?: BoardSessionConfig;
  boardSize?: number;
  themeId?: string;
  playerColor?: 'w' | 'b' | null;
}

const WELCOME_LINES = [
  '>> Editable board ready. Type "help" for commands.',
  '>> Agents: use "config apply" with BoardVariantConfig JSON.',
];

export const EditableBoard = ({
  initialConfig,
  boardSize = 480,
  themeId = 'endgame-slate',
  playerColor = null,
}: EditableBoardProps) => {
  const config = useMemo<BoardSessionConfig>(
    () =>
      initialConfig ?? {
        rulesetId: 'standard-fide',
        fen: DEV_START_FEN,
      },
    [initialConfig],
  );

  const { state, apply, resetSession, getSession } = useBoardSession(config);
  const [consoleLines, setConsoleLines] = useState<string[]>(WELCOME_LINES);
  const [theme, setTheme] = useState(themeId);

  const appendLines = useCallback((lines: string[]) => {
    setConsoleLines((prev) => [...prev, ...lines]);
  }, []);

  const runCommand = useCallback(
    (input: string) => {
      appendLines([`> ${input}`]);
      const result = executeBoardCommand(
        {
          getState: () => getSession().getState(),
          apply,
        },
        input,
      );

      appendLines(result.lines.map((line) => (result.ok ? line : `!! ${line}`)));

      if (result.reloadConfig) {
        resetSession({
          rulesetId: result.reloadConfig.rulesetId,
          fen: result.reloadConfig.fen ?? DEV_START_FEN,
        });
      }

      if (input.startsWith('config apply')) {
        try {
          const json = input.replace(/^config apply\s+/, '');
          const parsed = JSON.parse(json) as { themeId?: string };
          if (parsed.themeId) {
            setTheme(parsed.themeId);
          }
        } catch {
          // ignore theme parse
        }
      }
    },
    [appendLines, apply, getSession, resetSession],
  );

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start justify-center w-full">
      <div className="w-[min(92vw,480px)] aspect-square shrink-0">
        <BoardSessionView
          state={state}
          apply={apply}
          boardSize={boardSize}
          playerColor={playerColor}
          themeId={theme}
          moveMode
        />
      </div>
      <div className="w-full max-w-md lg:max-w-sm">
        <BoardConsole lines={consoleLines} onSubmit={runCommand} className="w-full" />
      </div>
    </div>
  );
};
