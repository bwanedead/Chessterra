/** Universal board graph — topology-agnostic node/piece/edge model. */

export type EntityId = string;
export type NodeId = string;
export type PieceId = string;
export type EdgeId = string;
export type PlayerId = string;
export type PieceKind = string;
export type RulesetId = string;
export type TopologyId = string;

export interface GridCoords {
  file: number;
  rank: number;
}

export interface CartesianCoords {
  x: number;
  y: number;
}

export type NodeCoords = GridCoords | CartesianCoords;

export interface GraphNode {
  id: NodeId;
  coords?: NodeCoords;
  tags?: string[];
  attrs?: Record<string, unknown>;
}

export type EdgeKind = 'adjacent' | 'line' | 'jump' | 'directed' | 'custom';

export interface GraphEdge {
  id: EdgeId;
  from: NodeId;
  to: NodeId;
  kind: EdgeKind;
  attrs?: Record<string, unknown>;
}

export interface PieceInstance {
  id: PieceId;
  kind: PieceKind;
  owner: PlayerId;
  nodeId: NodeId;
  attrs?: Record<string, unknown>;
}

export interface BoardGraph {
  topologyId: TopologyId;
  nodes: Record<NodeId, GraphNode>;
  edges: GraphEdge[];
  pieces: Record<PieceId, PieceInstance>;
  /** nodeId → pieceId | null */
  occupancy: Record<NodeId, PieceId | null>;
  /** Rules-global state: turn, castling, en passant, counters, custom flags */
  meta: Record<string, unknown>;
}

export const BOARD_SNAPSHOT_VERSION = 1 as const;

export interface BoardSnapshot {
  version: typeof BOARD_SNAPSHOT_VERSION;
  rulesetId: RulesetId;
  graph: BoardGraph;
  /** Optional derived codec (e.g. FEN for standard chess renderers) */
  codec?: BoardCodecSnapshot;
}

export interface BoardCodecSnapshot {
  kind: 'fen';
  value: string;
}

export type BoardPatch =
  | { op: 'set-node'; node: GraphNode }
  | { op: 'remove-node'; nodeId: NodeId }
  | { op: 'add-edge'; edge: GraphEdge }
  | { op: 'remove-edge'; edgeId: EdgeId }
  | { op: 'place-piece'; piece: PieceInstance }
  | { op: 'remove-piece'; pieceId: PieceId }
  | { op: 'move-piece'; pieceId: PieceId; toNodeId: NodeId }
  | { op: 'set-meta'; key: string; value: unknown }
  | { op: 'clear-meta-key'; key: string };

export interface MoveIntent {
  from: NodeId;
  to: NodeId;
  promotion?: PieceKind;
  metadata?: Record<string, unknown>;
}

export interface AppliedMove {
  intent: MoveIntent;
  san?: string;
  capturedPieceId?: PieceId;
}

export interface LegalMove extends MoveIntent {
  san?: string;
}

export interface RuleOutcome {
  kind: 'ongoing' | 'terminal';
  winner?: PlayerId;
  reason?: string;
}

export interface ApplyResult {
  ok: boolean;
  error?: string;
  snapshot?: BoardSnapshot;
  appliedMove?: AppliedMove;
  outcome?: RuleOutcome;
}
