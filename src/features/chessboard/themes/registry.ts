import type { BoardAppearance, BoardTheme } from './types';

const registry = new Map<string, BoardTheme>();

export const registerBoardTheme = (theme: BoardTheme): void => {
  if (registry.has(theme.id)) {
    throw new Error(`Board theme already registered: ${theme.id}`);
  }
  registry.set(theme.id, theme);
};

export const getBoardTheme = (id: string): BoardTheme | undefined => registry.get(id);

export const listBoardThemes = (): BoardTheme[] =>
  Array.from(registry.values());

export const resolveBoardAppearance = (
  themeId?: string,
  fallback: BoardAppearance = getBoardTheme('classic') ?? {
    mode: 'classic',
    lightSquare: '#f5deab',
    darkSquare: '#8b5a2b',
  },
): BoardAppearance => {
  if (!themeId) {
    return fallback;
  }
  return getBoardTheme(themeId) ?? fallback;
};
