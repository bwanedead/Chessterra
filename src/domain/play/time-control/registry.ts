import type { TimeControlDefinition } from './types';

const registry = new Map<string, TimeControlDefinition>();

export const registerTimeControl = (definition: TimeControlDefinition): void => {
  if (registry.has(definition.id)) {
    throw new Error(`Time control already registered: ${definition.id}`);
  }
  registry.set(definition.id, definition);
};

export const getTimeControl = (id: string): TimeControlDefinition | undefined =>
  registry.get(id);

export const listTimeControls = (): TimeControlDefinition[] =>
  Array.from(registry.values()).sort((a, b) => a.order - b.order);
