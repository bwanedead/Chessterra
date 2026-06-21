import type { PieceColor, PieceType } from '@/features/chessboard/types';
import { generatePieceId } from './graph';
import { createEmptyGridGraph, GRID_8X8, gridNodeId } from './topology';
import type {
  BoardCodecSnapshot,
  BoardGraph,
  BoardSnapshot,
  PieceInstance,
  RulesetId,
} from './types';

const PIECE_SYMBOL_TO_TYPE: Record<string, PieceType> = {
  p: 'p',
  n: 'n',
  b: 'b',
  r: 'r',
  q: 'q',
  k: 'k',
};

export const graphFromFen = (
  fen: string,
  rulesetId: RulesetId = 'standard-fide',
): BoardSnapshot => {
  const graph: BoardGraph = createEmptyGridGraph(GRID_8X8);
  const parts = fen.split(' ');
  const placement = parts[0];
  const activeColor = (parts[1] ?? 'w') as PieceColor;
  const castling = parts[2] ?? '-';
  const enPassant = parts[3] ?? '-';
  const halfmove = Number.parseInt(parts[4] ?? '0', 10);
  const fullmove = Number.parseInt(parts[5] ?? '1', 10);

  const rows = placement.split('/');
  const labels = GRID_8X8.fileLabels!;

  for (let rankIndex = 0; rankIndex < rows.length; rankIndex += 1) {
    const rank = 7 - rankIndex;
    let file = 0;
    for (const char of rows[rankIndex]) {
      if (/\d/.test(char)) {
        file += Number(char);
        continue;
      }
      const isWhite = char === char.toUpperCase();
      const kind = PIECE_SYMBOL_TO_TYPE[char.toLowerCase()];
      if (!kind) {
        continue;
      }
      const nodeId = gridNodeId(file, rank, labels);
      const piece: PieceInstance = {
        id: generatePieceId(),
        kind,
        owner: isWhite ? 'w' : 'b',
        nodeId,
      };
      graph.pieces[piece.id] = piece;
      graph.occupancy[nodeId] = piece.id;
      file += 1;
    }
  }

  graph.meta = {
    activeColor,
    castling,
    enPassant,
    halfmove,
    fullmove,
  };

  return {
    version: 1,
    rulesetId,
    graph,
    codec: { kind: 'fen', value: fen },
  };
};

export const fenFromGraph = (graph: BoardGraph): string | null => {
  if (graph.topologyId !== GRID_8X8.id) {
    return null;
  }

  const labels = GRID_8X8.fileLabels!;
  const rows: string[] = [];

  for (let rank = 7; rank >= 0; rank -= 1) {
    let row = '';
    let emptyRun = 0;
    for (let file = 0; file < 8; file += 1) {
      const nodeId = gridNodeId(file, rank, labels);
      const pieceId = graph.occupancy[nodeId];
      const piece = pieceId ? graph.pieces[pieceId] : null;
      if (!piece) {
        emptyRun += 1;
        continue;
      }
      if (emptyRun > 0) {
        row += String(emptyRun);
        emptyRun = 0;
      }
      const symbol = piece.kind;
      row += piece.owner === 'w' ? symbol.toUpperCase() : symbol;
    }
    if (emptyRun > 0) {
      row += String(emptyRun);
    }
    rows.push(row);
  }

  const activeColor = (graph.meta.activeColor as string) ?? 'w';
  const castling = (graph.meta.castling as string) ?? '-';
  const enPassant = (graph.meta.enPassant as string) ?? '-';
  const halfmove = (graph.meta.halfmove as number) ?? 0;
  const fullmove = (graph.meta.fullmove as number) ?? 1;

  return `${rows.join('/')} ${activeColor} ${castling} ${enPassant} ${halfmove} ${fullmove}`;
};

export const syncFenCodec = (snapshot: BoardSnapshot): BoardSnapshot => {
  const fen = fenFromGraph(snapshot.graph);
  if (!fen) {
    return snapshot;
  }
  return {
    ...snapshot,
    codec: { kind: 'fen', value: fen },
  };
};

export const getFenFromSnapshot = (snapshot: BoardSnapshot): string | null => {
  if (snapshot.codec?.kind === 'fen') {
    return snapshot.codec.value;
  }
  return fenFromGraph(snapshot.graph);
};

export const createSnapshot = (
  rulesetId: RulesetId,
  graph: BoardGraph,
  codec?: BoardCodecSnapshot,
): BoardSnapshot => ({
  version: 1,
  rulesetId,
  graph,
  codec,
});
