import type { HeatmapSchemeDefinition, HeatmapSchemeId } from '@/features/chessboard/overlays/schemes/types';
import { neutralCancelScheme } from '@/features/chessboard/overlays/schemes/neutralCancelScheme';
import { contestedMixedScheme } from '@/features/chessboard/overlays/schemes/contestedMixedScheme';
import { contestedFlagScheme } from '@/features/chessboard/overlays/schemes/contestedFlagScheme';

const definitions: HeatmapSchemeDefinition[] = [
  neutralCancelScheme,
  contestedMixedScheme,
  contestedFlagScheme,
];

const schemeMap = new Map<HeatmapSchemeId, HeatmapSchemeDefinition>(
  definitions.map((definition) => [definition.id, definition]),
);

export const DEFAULT_HEATMAP_SCHEME_ID: HeatmapSchemeId = 'neutral-cancel';

export const listHeatmapSchemes = () =>
  definitions.map(({ id, label, description, supportedSubSchemes, tags }) => ({
    id,
    label,
    description,
    supportedSubSchemes,
    tags,
  }));

export const getHeatmapScheme = (id: HeatmapSchemeId): HeatmapSchemeDefinition =>
  schemeMap.get(id) ?? schemeMap.get(DEFAULT_HEATMAP_SCHEME_ID)!;
