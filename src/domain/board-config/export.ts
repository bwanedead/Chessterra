import { getFenFromSnapshot } from '@/domain/board-core/fenCodec';
import type { BoardSessionState } from '@/domain/board-session';
import { BOARD_VARIANT_CONFIG_VERSION, type BoardVariantConfig } from './types';

export const exportBoardConfig = (state: BoardSessionState): BoardVariantConfig => {
  const graph = state.snapshot.graph;
  const pieces = Object.values(graph.pieces).map((piece) => ({
    square: piece.nodeId,
    owner: piece.owner,
    kind: piece.kind,
    attrs: piece.attrs,
  }));

  const nodeTags: Record<string, string[]> = {};
  const nodeAttrs: Record<string, Record<string, unknown>> = {};
  for (const node of Object.values(graph.nodes)) {
    if (node.tags?.length) {
      nodeTags[node.id] = node.tags;
    }
    if (node.attrs && Object.keys(node.attrs).length > 0) {
      nodeAttrs[node.id] = node.attrs;
    }
  }

  return {
    version: BOARD_VARIANT_CONFIG_VERSION,
    label: 'exported-variant',
    rulesetId: state.rulesetId,
    setup: {
      fen: getFenFromSnapshot(state.snapshot) ?? undefined,
      meta: { ...graph.meta },
      pieces: pieces.length > 0 ? pieces : undefined,
      nodeTags: Object.keys(nodeTags).length > 0 ? nodeTags : undefined,
      nodeAttrs: Object.keys(nodeAttrs).length > 0 ? nodeAttrs : undefined,
    },
  };
};
