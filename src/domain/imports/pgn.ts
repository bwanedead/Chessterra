import { Chess, Move } from 'chess.js';
import { GameImportRequest, GameTimeline, MoveMetadata } from '@/domain/models/game';
import { GameSource } from './types';

export const PGN_SOURCE_ID = 'pgn-text';

const getInitialFen = () => new Chess().fen();

const toMoveMetadata = (move: Move, index: number, fen: string): MoveMetadata => ({
  san: move.san,
  from: move.from,
  to: move.to,
  color: move.color,
  moveNumber: Math.ceil((index + 1) / 2),
  captured: move.captured ?? null,
  promotion: move.promotion,
  fen,
});

export const parseTimelineFromPgn = (rawPgn: string): GameTimeline => {
  const pgn = rawPgn.trim();
  if (!pgn) {
    throw new Error('PGN input is empty.');
  }

  const loader = new Chess();
  try {
    loader.loadPgn(pgn);
  } catch (error) {
    const details = error instanceof Error ? error.message : undefined;
    throw new Error(details ? `Invalid PGN format: ${details}` : 'Invalid PGN format.');
  }

  const history = loader.history({ verbose: true }) as Move[];
  const playbackGame = new Chess();
  const positions = [getInitialFen()];
  const moves: MoveMetadata[] = [];

  history.forEach((move, index) => {
    const result = playbackGame.move(move);
    if (!result) {
      return;
    }
    const positionFen = playbackGame.fen();
    positions.push(positionFen);
    moves.push(toMoveMetadata(move, index, positionFen));
  });

  return {
    positions,
    moves,
  };
};

export const pgnTextSource: GameSource = {
  id: PGN_SOURCE_ID,
  label: 'PGN Upload',
  description: 'Paste PGN notation manually.',
  canHandle: (request: GameImportRequest) => request.kind === PGN_SOURCE_ID,
  load: async (request: GameImportRequest) => {
    if (typeof request.payload !== 'string') {
      throw new Error('PGN source expects a string payload.');
    }
    return parseTimelineFromPgn(request.payload);
  },
};
