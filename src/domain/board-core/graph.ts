import type {
  BoardGraph,
  BoardPatch,
  GraphNode,
  NodeId,
  PieceId,
  PieceInstance,
} from './types';

export const cloneGraph = (graph: BoardGraph): BoardGraph =>
  structuredClone(graph);

export const getPieceAtNode = (graph: BoardGraph, nodeId: NodeId): PieceInstance | null => {
  const pieceId = graph.occupancy[nodeId];
  if (!pieceId) {
    return null;
  }
  return graph.pieces[pieceId] ?? null;
};

export const applyPatch = (graph: BoardGraph, patch: BoardPatch): BoardGraph => {
  const next = cloneGraph(graph);

  switch (patch.op) {
    case 'set-node':
      next.nodes[patch.node.id] = {
        ...next.nodes[patch.node.id],
        ...patch.node,
        tags: patch.node.tags ?? next.nodes[patch.node.id]?.tags,
        attrs: patch.node.attrs
          ? { ...(next.nodes[patch.node.id]?.attrs ?? {}), ...patch.node.attrs }
          : next.nodes[patch.node.id]?.attrs,
      };
      if (!(patch.node.id in next.occupancy)) {
        next.occupancy[patch.node.id] = null;
      }
      break;

    case 'remove-node': {
      const pieceId = next.occupancy[patch.nodeId];
      if (pieceId) {
        delete next.pieces[pieceId];
      }
      delete next.nodes[patch.nodeId];
      delete next.occupancy[patch.nodeId];
      next.edges = next.edges.filter(
        (edge) => edge.from !== patch.nodeId && edge.to !== patch.nodeId,
      );
      break;
    }

    case 'add-edge':
      next.edges.push(patch.edge);
      break;

    case 'remove-edge':
      next.edges = next.edges.filter((edge) => edge.id !== patch.edgeId);
      break;

    case 'place-piece': {
      const existing = next.occupancy[patch.piece.nodeId];
      if (existing) {
        delete next.pieces[existing];
      }
      next.pieces[patch.piece.id] = patch.piece;
      next.occupancy[patch.piece.nodeId] = patch.piece.id;
      break;
    }

    case 'remove-piece': {
      const piece = next.pieces[patch.pieceId];
      if (piece) {
        next.occupancy[piece.nodeId] = null;
      }
      delete next.pieces[patch.pieceId];
      break;
    }

    case 'move-piece': {
      const piece = next.pieces[patch.pieceId];
      if (!piece) {
        break;
      }
      next.occupancy[piece.nodeId] = null;
      const occupant = next.occupancy[patch.toNodeId];
      if (occupant) {
        delete next.pieces[occupant];
      }
      piece.nodeId = patch.toNodeId;
      next.occupancy[patch.toNodeId] = patch.pieceId;
      break;
    }

    case 'set-meta':
      next.meta[patch.key] = patch.value;
      break;

    case 'clear-meta-key':
      delete next.meta[patch.key];
      break;

    default:
      break;
  }

  return next;
};

export const applyPatches = (graph: BoardGraph, patches: BoardPatch[]): BoardGraph =>
  patches.reduce((state, patch) => applyPatch(state, patch), graph);

export const listPiecesForOwner = (graph: BoardGraph, owner: string): PieceInstance[] =>
  Object.values(graph.pieces).filter((piece) => piece.owner === owner);

export const rebuildOccupancy = (graph: BoardGraph): BoardGraph => {
  const next = cloneGraph(graph);
  for (const nodeId of Object.keys(next.nodes)) {
    next.occupancy[nodeId] = null;
  }
  for (const piece of Object.values(next.pieces)) {
    next.occupancy[piece.nodeId] = piece.id;
  }
  return next;
};

export const upsertNode = (graph: BoardGraph, node: GraphNode): BoardGraph =>
  applyPatch(graph, { op: 'set-node', node });

export const generatePieceId = (): PieceId =>
  `piece-${crypto.randomUUID()}`;
