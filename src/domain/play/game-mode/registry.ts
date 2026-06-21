import type { GameModeDefinition } from './types';

const registry = new Map<string, GameModeDefinition>();

export const registerGameMode = (definition: GameModeDefinition): void => {
  if (registry.has(definition.id)) {
    throw new Error(`Game mode already registered: ${definition.id}`);
  }
  registry.set(definition.id, definition);
};

export const getGameMode = (id: string): GameModeDefinition | undefined =>
  registry.get(id);

export const listGameModes = (): GameModeDefinition[] =>
  Array.from(registry.values()).sort((a, b) => a.order - b.order);

export const listGameModesByCategory = (
  category: GameModeDefinition['category'],
): GameModeDefinition[] => listGameModes().filter((mode) => mode.category === category);

export const isTimeControlSupported = (
  modeId: string,
  timeControlId: string,
): boolean => {
  const mode = getGameMode(modeId);
  return mode?.supportedTimeControlIds.includes(timeControlId) ?? false;
};
