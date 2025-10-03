import { Chess, Move } from 'chess.js';
import { FenString, GameTimeline, MoveMetadata } from '@/domain/models/game';

export const DEFAULT_START_FEN = new Chess().fen();

export const createEmptyTimeline = (): GameTimeline => ({
  positions: [DEFAULT_START_FEN],
  moves: [],
});

export const getFenAtPly = (timeline: GameTimeline | null, ply: number): FenString => {
  if (!timeline || timeline.positions.length === 0) {
    return DEFAULT_START_FEN;
  }

  const boundedIndex = Math.max(0, Math.min(ply, timeline.positions.length - 1));
  return timeline.positions[boundedIndex];
};

const toMoveMetadata = (move: Move, fen: string, plyIndex: number): MoveMetadata => ({
  san: move.san,
  from: move.from,
  to: move.to,
  color: move.color,
  moveNumber: Math.ceil((plyIndex + 1) / 2),
  captured: move.captured ?? null,
  promotion: move.promotion,
  fen,
});

export const appendMoveToTimeline = (
  timeline: GameTimeline,
  move: Move,
  resultingFen: string,
  currentPly: number,
): GameTimeline => {
  const keepPositions = timeline.positions.slice(0, currentPly + 1);
  const keepMoves = timeline.moves.slice(0, currentPly);
  const nextMoves = keepMoves.length;

  return {
    positions: [...keepPositions, resultingFen],
    moves: [...keepMoves, toMoveMetadata(move, resultingFen, nextMoves)],
  };
};

export const buildTimelineFromGame = (game: Chess): GameTimeline => {
  const history = game.history({ verbose: true }) as Move[];
  const playback = new Chess();
  const positions = [DEFAULT_START_FEN];
  const moves: MoveMetadata[] = [];

  history.forEach((move, index) => {
    const result = playback.move(move);
    if (!result) return;
    const fen = playback.fen();
    positions.push(fen);
    moves.push(toMoveMetadata(move, fen, index));
  });

  return {
    positions,
    moves,
  };
};
