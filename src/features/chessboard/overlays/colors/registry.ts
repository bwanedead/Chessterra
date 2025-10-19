import { defaultProfiles } from '@/features/chessboard/overlays/colors/defaultProfiles';
import type {
  HeatmapColorOverrides,
  HeatmapColorProfileDefinition,
  HeatmapColorProfileId,
  PieceColorConfig,
  ResolvedHeatmapColorProfile,
} from '@/features/chessboard/overlays/colors/types';

const profileMap = new Map<HeatmapColorProfileId, HeatmapColorProfileDefinition>(
  defaultProfiles.map((profile) => [profile.id, profile]),
);

export const DEFAULT_HEATMAP_COLOR_PROFILE_ID: HeatmapColorProfileId = 'classic';

export interface HeatmapColorProfileSummary {
  id: HeatmapColorProfileId;
  label: string;
  description?: string;
}

const cloneProfile = (profile: HeatmapColorProfileDefinition): HeatmapColorProfileDefinition =>
  JSON.parse(JSON.stringify(profile));

const applyPieceOverrides = (
  pieces: Record<'white' | 'black', Record<string, PieceColorConfig>>,
  overrides: HeatmapColorOverrides['pieces'],
) => {
  if (!overrides) {
    return;
  }

  (['white', 'black'] as const).forEach((color) => {
    const colorOverrides = overrides[color];
    if (!colorOverrides) {
      return;
    }

    Object.entries(colorOverrides).forEach(([pieceType, override]) => {
      if (!override) {
        return;
      }

      const target = pieces[color][pieceType];
      if (!target) {
        return;
      }

      if (typeof override === 'string') {
        target.primary = override;
        return;
      }

      if (override.primary) {
        target.primary = override.primary;
      }
      if (override.accent) {
        target.accent = override.accent;
      }
    });
  });
};

export const listColorProfiles = (): HeatmapColorProfileSummary[] =>
  defaultProfiles.map(({ id, label, description }) => ({ id, label, description }));

export const getColorProfileDefinition = (
  id: HeatmapColorProfileId,
): HeatmapColorProfileDefinition => profileMap.get(id) ?? profileMap.get(DEFAULT_HEATMAP_COLOR_PROFILE_ID)!;

export const resolveColorProfile = (
  id: HeatmapColorProfileId,
  overrides?: HeatmapColorOverrides,
): ResolvedHeatmapColorProfile => {
  const base = cloneProfile(getColorProfileDefinition(id));

  if (overrides?.pieces) {
    applyPieceOverrides(base.pieces, overrides.pieces);
  }
  if (overrides?.contested) {
    base.contested = {
      ...base.contested,
      ...overrides.contested,
    };
  }
  if (overrides?.check) {
    base.check = {
      ...base.check,
      ...overrides.check,
    };
  }

  return base;
};
