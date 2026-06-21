'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface BoardConsoleProps {
  lines: string[];
  onSubmit: (command: string) => void;
  className?: string;
}

export const BoardConsole = ({ lines, onSubmit, className }: BoardConsoleProps) => {
  const [input, setInput] = useState('');
  const consoleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [lines]);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }
    onSubmit(trimmed);
    setInput('');
  }, [input, onSubmit]);

  return (
    <div
      className={[
        'flex flex-col rounded-lg border border-slate-700 bg-slate-950/95 font-mono text-xs text-slate-200 shadow-lg',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="border-b border-slate-800 px-3 py-2 text-[10px] uppercase tracking-widest text-slate-500">
        Board CLI
      </div>
      <div
        ref={consoleRef}
        className="max-h-48 min-h-[120px] flex-1 overflow-y-auto px-3 py-2 space-y-0.5"
      >
        {lines.map((line, index) => (
          <div
            key={`${index}-${line.slice(0, 24)}`}
            className={line.startsWith('>') ? 'text-sky-300' : line.startsWith('Unknown') ? 'text-amber-400' : ''}
          >
            {line}
          </div>
        ))}
      </div>
      <form
        className="flex border-t border-slate-800"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <span className="px-3 py-2 text-slate-500 select-none">&gt;</span>
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder='help | status | piece place e4 w q | config apply {...}'
          className="flex-1 bg-transparent py-2 pr-3 text-slate-100 placeholder:text-slate-600 outline-none"
          spellCheck={false}
          autoComplete="off"
        />
      </form>
    </div>
  );
};
