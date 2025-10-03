export type FenString = string;

export interface MoveMetadata {
  san: string;
  from: string;
  to: string;
  color: 'w' | 'b';
  moveNumber: number;
  captured?: string | null;
  promotion?: string;
  fen: FenString;
}

export interface GameTimeline {
  positions: FenString[];
  moves: MoveMetadata[];
}

export interface GameImportRequest {
  kind: string;
  payload: unknown;
}

export interface GameSourceDescriptor {
  id: string;
  label: string;
  description?: string;
}

export type InfluenceMode = 'white' | 'black' | 'net';

export type InfluenceMap = Record<InfluenceMode, number[]>;
