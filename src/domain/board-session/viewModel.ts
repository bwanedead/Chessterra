import type { PieceColor } from '@/features/chessboard/types';
import { getFenFromSnapshot } from '@/domain/board-core/fenCodec';
import { getPieceAtNode } from '@/domain/board-core/graph';
import { GRID_8X8, gridNodeId } from '@/domain/board-core/topology';
import type { BoardGraph, NodeId } from '@/domain/board-core/types';
import { getRuleset } from '@/domain/board-rules/registry';
import type { BoardSessionState } from './types';

export interface BoardCellViewModel {
  nodeId: NodeId;
  squareColor: 'light' | 'dark';
  piece?: {
    kind: string;
    owner: string;
  };
}

export interface BoardViewModel {
  rulesetId: string;
  topologyId: string;
  fen: string | null;
  cells: BoardCellViewModel[];
  activePlayer: string | null;
  legalTargetsByFrom: Record<string, string[]>;
  allLegalTargets: string[];
  lastMove: { from: string; to: string } | null;
  revision: number;
  terminal: boolean;
}

const buildGridCells = (graph: BoardGraph): BoardCellViewModel[] => {
  const labels = GRID_8X8.fileLabels!;
  const cells: BoardCellViewModel[] = [];

  for (let rank = 7; rank >= 0; rank -= 1) {
    for (let file = 0; file < 8; file += 1) {
      const nodeId = gridNodeId(file, rank, labels);
      const node = graph.nodes[nodeId];
      const piece = getPieceAtNode(graph, nodeId);
      const isLight = node?.tags?.includes('light') ?? (file + rank) % 2 === 0;
      cells.push({
        nodeId,
        squareColor: isLight ? 'light' : 'dark',
        piece: piece
          ? { kind: piece.kind, owner: piece.owner }
          : undefined,
      });
    }
  }

  return cells;
};

export const buildBoardViewModel = (
  state: BoardSessionState,
  perspective: PieceColor | null = null,
): BoardViewModel => {
  const ruleset = getRuleset(state.rulesetId);
  const graph = state.snapshot.graph;
  const activePlayer = ruleset?.getActivePlayer(graph) ?? null;

  const legalMoves = ruleset?.legalMoves(graph) ?? [];
  const legalTargetsByFrom: Record<string, string[]> = {};
  for (const move of legalMoves) {
    if (!legalTargetsByFrom[move.from]) {
      legalTargetsByFrom[move.from] = [];
    }
    legalTargetsByFrom[move.from].push(move.to);
  }

  const lastHistory = state.history[state.history.length - 1];
  const lastApplied = lastHistory?.applied?.intent;

  const canInteract =
    perspective === null || (activePlayer !== null && activePlayer === perspective);

  return {
    rulesetId: state.rulesetId,
    topologyId: graph.topologyId,
    fen: getFenFromSnapshot(state.snapshot),
    cells: buildGridCells(graph),
    activePlayer,
    legalTargetsByFrom: canInteract ? legalTargetsByFrom : {},
    allLegalTargets: canInteract ? legalMoves.map((m) => m.to) : [],
    lastMove: lastApplied ? { from: lastApplied.from, to: lastApplied.to } : null,
    revision: state.revision,
    terminal: state.outcome.kind === 'terminal',
  };
};
