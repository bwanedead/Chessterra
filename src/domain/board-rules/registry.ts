import type { RulesetDefinition } from './types';

const rulesetRegistry = new Map<string, RulesetDefinition>();
const pieceRuleIndex = new Map<string, RulesetDefinition['pieceRules'][string]>();

export const registerRuleset = (ruleset: RulesetDefinition): void => {
  if (rulesetRegistry.has(ruleset.id)) {
    throw new Error(`Ruleset already registered: ${ruleset.id}`);
  }
  rulesetRegistry.set(ruleset.id, ruleset);
  for (const rule of Object.values(ruleset.pieceRules)) {
    pieceRuleIndex.set(`${ruleset.id}::${rule.kind}`, rule);
  }
};

export const getRuleset = (id: string): RulesetDefinition | undefined =>
  rulesetRegistry.get(id);

export const listRulesets = (): RulesetDefinition[] =>
  Array.from(rulesetRegistry.values());

export const getPieceRule = (
  rulesetId: string,
  kind: string,
): RulesetDefinition['pieceRules'][string] | undefined =>
  pieceRuleIndex.get(`${rulesetId}::${kind}`);
