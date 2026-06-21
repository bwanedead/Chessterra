import { graphFromFen } from '@/domain/board-core/fenCodec';
import { generatePieceId } from '@/domain/board-core/graph';
import type { RulesetId } from '@/domain/board-core/types';
import type { ProgressMessage } from '@/domain/board-session';
import type { BoardVariantConfig } from './types';

export const applyBoardConfig = (
  config: BoardVariantConfig,
  currentRulesetId: string,
): ProgressMessage[] => {
  const rulesetId = (config.rulesetId ?? currentRulesetId) as RulesetId;
  const messages: ProgressMessage[] = [];

  if (config.setup.fen) {
    messages.push({
      type: 'load',
      snapshot: graphFromFen(config.setup.fen, rulesetId),
    });
  } else if (config.setup.pieces && config.setup.pieces.length > 0) {
    messages.push({
      type: 'load',
      snapshot: graphFromFen('8/8/8/8/8/8/8/8 w - - 0 1', rulesetId),
    });
    const patches = config.setup.pieces.map((piece) => ({
      op: 'place-piece' as const,
      piece: {
        id: generatePieceId(),
        kind: piece.kind,
        owner: piece.owner,
        nodeId: piece.square.toLowerCase(),
        attrs: piece.attrs,
      },
    }));
    messages.push({ type: 'patch', patches });
  }

  if (config.setup.meta) {
    for (const [key, value] of Object.entries(config.setup.meta)) {
      messages.push({ type: 'set-meta', key, value });
    }
  }

  if (config.setup.nodeTags) {
    for (const [square, tags] of Object.entries(config.setup.nodeTags)) {
      messages.push({
        type: 'patch',
        patches: [{ op: 'set-node', node: { id: square.toLowerCase(), tags } }],
      });
    }
  }

  if (config.setup.nodeAttrs) {
    for (const [square, attrs] of Object.entries(config.setup.nodeAttrs)) {
      messages.push({
        type: 'patch',
        patches: [{ op: 'set-node', node: { id: square.toLowerCase(), attrs } }],
      });
    }
  }

  if (config.setup.patches?.length) {
    messages.push({ type: 'patch', patches: config.setup.patches });
  }

  return messages;
};
