import type { BoardGraph, GridCoords, NodeCoords, NodeId, TopologyId } from './types';

export type TopologyKind = 'grid' | 'graph';

export interface GridTopologyDefinition {
  id: TopologyId;
  kind: 'grid';
  files: number;
  ranks: number;
  /** file labels, default a-h */
  fileLabels?: string[];
}

export interface GraphTopologyDefinition {
  id: TopologyId;
  kind: 'graph';
  label: string;
}

export type TopologyDefinition = GridTopologyDefinition | GraphTopologyDefinition;

export const GRID_8X8_ID = 'grid-8x8' as TopologyId;

export const GRID_8X8: GridTopologyDefinition = {
  id: GRID_8X8_ID,
  kind: 'grid',
  files: 8,
  ranks: 8,
  fileLabels: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
};

const topologyRegistry = new Map<string, TopologyDefinition>();

export const registerTopology = (topology: TopologyDefinition): void => {
  topologyRegistry.set(topology.id, topology);
};

export const getTopology = (id: string): TopologyDefinition | undefined =>
  topologyRegistry.get(id);

registerTopology(GRID_8X8);

export const isGridCoords = (coords: NodeCoords): coords is GridCoords =>
  'file' in coords && 'rank' in coords;

export const gridNodeId = (file: number, rank: number, labels = GRID_8X8.fileLabels): NodeId => {
  const fileChar = labels?.[file] ?? String.fromCharCode(97 + file);
  return `${fileChar}${rank + 1}`;
};

export const parseGridNodeId = (
  nodeId: NodeId,
  labels = GRID_8X8.fileLabels,
): GridCoords | null => {
  const match = nodeId.match(/^([a-h])([1-8])$/i);
  if (!match) {
    return null;
  }
  const file = labels?.indexOf(match[1].toLowerCase()) ?? match[1].charCodeAt(0) - 97;
  const rank = Number.parseInt(match[2], 10) - 1;
  if (file < 0 || file > 7 || rank < 0 || rank > 7) {
    return null;
  }
  return { file, rank };
};

export const buildGridNodes = (topology: GridTopologyDefinition): Record<NodeId, {
  id: NodeId;
  coords: GridCoords;
  tags: string[];
}> => {
  const nodes: Record<NodeId, { id: NodeId; coords: GridCoords; tags: string[] }> = {};
  const labels = topology.fileLabels ?? GRID_8X8.fileLabels!;

  for (let rank = 0; rank < topology.ranks; rank += 1) {
    for (let file = 0; file < topology.files; file += 1) {
      const id = gridNodeId(file, rank, labels);
      const isLight = (file + rank) % 2 === 0;
      nodes[id] = {
        id,
        coords: { file, rank },
        tags: [isLight ? 'light' : 'dark'],
      };
    }
  }

  return nodes;
};

export const buildGridAdjacencyEdges = (topology: GridTopologyDefinition) => {
  const labels = topology.fileLabels ?? GRID_8X8.fileLabels!;
  const edges = [];
  const directions = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0], [1, 0],
    [-1, 1], [0, 1], [1, 1],
  ];

  for (let rank = 0; rank < topology.ranks; rank += 1) {
    for (let file = 0; file < topology.files; file += 1) {
      const from = gridNodeId(file, rank, labels);
      for (const [df, dr] of directions) {
        const nf = file + df;
        const nr = rank + dr;
        if (nf < 0 || nf >= topology.files || nr < 0 || nr >= topology.ranks) {
          continue;
        }
        const to = gridNodeId(nf, nr, labels);
        edges.push({
          id: `${from}->${to}`,
          from,
          to,
          kind: 'adjacent' as const,
        });
      }
    }
  }

  return edges;
};

export const createEmptyGridGraph = (topology: GridTopologyDefinition = GRID_8X8): BoardGraph => {
  const nodes = buildGridNodes(topology);
  const occupancy = Object.fromEntries(Object.keys(nodes).map((id) => [id, null]));
  return {
    topologyId: topology.id,
    nodes,
    edges: buildGridAdjacencyEdges(topology),
    pieces: {},
    occupancy,
    meta: {},
  };
};
