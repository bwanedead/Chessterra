import { createContext, memo, useContext, useMemo, useState, type ReactNode } from 'react';
import type { HeatmapTraceMode } from '@/features/chessboard/overlays/types';
import type { HeatmapSchemeId } from '@/features/chessboard/overlays/schemes';
import {
  DEFAULT_HEATMAP_SCHEME_ID,
  listHeatmapSchemes,
} from '@/features/chessboard/overlays/schemes';
import {
  DEFAULT_HEATMAP_COLOR_PROFILE_ID,
  type HeatmapColorOverrides,
  type HeatmapColorProfileId,
  listColorProfiles,
} from '@/features/chessboard/overlays/colors';
import type { ChessPieceDescriptor } from '@/features/chessboard/types';

export interface HeatmapSettingsState {
  activeToggleIds: Set<string>;
  schemeId: HeatmapSchemeId;
  subScheme: HeatmapTraceMode;
  includeBothSides: boolean;
  showPieces: boolean;
  normalizedBoard: boolean;
  colorProfileId: HeatmapColorProfileId;
  colorOverrides: HeatmapColorOverrides | null;
  checkHighlightsEnabled: boolean;
  showIntensityLabels: boolean;
}

export interface HeatmapSettingsActions {
  togglePiece(id: string): void;
  clearPieces(): void;
  setSchemeId(id: HeatmapSchemeId): void;
  setSubScheme(mode: HeatmapTraceMode): void;
  setIncludeBothSides(value: boolean): void;
  setShowPieces(value: boolean): void;
  setNormalizedBoard(value: boolean): void;
  setColorProfileId(id: HeatmapColorProfileId): void;
  setColorOverrides(overrides: HeatmapColorOverrides | null): void;
  setCheckHighlightsEnabled(value: boolean): void;
  setShowIntensityLabels(value: boolean): void;
}

const HeatmapSettingsStateContext = createContext<HeatmapSettingsState | null>(null);
const HeatmapSettingsActionsContext = createContext<HeatmapSettingsActions | null>(null);

const defaultScheme = DEFAULT_HEATMAP_SCHEME_ID;
const defaultSubScheme: HeatmapTraceMode = listHeatmapSchemes().find(
  (scheme) => scheme.id === defaultScheme,
)?.supportedSubSchemes[0] ?? 'line-of-sight';

const defaultColorProfile = DEFAULT_HEATMAP_COLOR_PROFILE_ID;

const createInitialState = (): HeatmapSettingsState => ({
  activeToggleIds: new Set<string>(),
  schemeId: defaultScheme,
  subScheme: defaultSubScheme,
  includeBothSides: true,
  showPieces: true,
  normalizedBoard: false,
  colorProfileId: defaultColorProfile,
  colorOverrides: null,
  checkHighlightsEnabled: true,
  showIntensityLabels: false,
});

export const HeatmapSettingsProvider = memo(({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<HeatmapSettingsState>(createInitialState);

  const actions = useMemo<HeatmapSettingsActions>(
    () => ({
      togglePiece: (id) => {
        setState((prev) => {
          const active = new Set(prev.activeToggleIds);
          if (active.has(id)) {
            active.delete(id);
          } else {
            active.add(id);
          }
          return { ...prev, activeToggleIds: active };
        });
      },
      clearPieces: () => {
        setState((prev) => ({ ...prev, activeToggleIds: new Set() }));
      },
      setSchemeId: (id) => {
        setState((prev) => {
          const scheme = listHeatmapSchemes().find((item) => item.id === id);
          const supported = scheme?.supportedSubSchemes ?? [];
          const current = supported.includes(prev.subScheme) ? prev.subScheme : supported[0] ?? 'line-of-sight';
          return { ...prev, schemeId: id, subScheme: current ?? 'line-of-sight' };
        });
      },
      setSubScheme: (mode) => {
        setState((prev) => {
          const scheme = listHeatmapSchemes().find((item) => item.id === prev.schemeId);
          const supported = scheme?.supportedSubSchemes ?? [];
          if (!supported.includes(mode)) {
            return prev;
          }
          return { ...prev, subScheme: mode };
        });
      },
      setIncludeBothSides: (value) => {
        setState((prev) => ({ ...prev, includeBothSides: value }));
      },
      setShowPieces: (value) => {
        setState((prev) => ({ ...prev, showPieces: value }));
      },
      setNormalizedBoard: (value) => {
        setState((prev) => ({ ...prev, normalizedBoard: value }));
      },
      setColorProfileId: (id) => {
        const available = listColorProfiles().some((profile) => profile.id === id);
        setState((prev) => ({
          ...prev,
          colorProfileId: available ? id : prev.colorProfileId,
        }));
      },
      setColorOverrides: (overrides) => {
        setState((prev) => ({ ...prev, colorOverrides: overrides }));
      },
      setCheckHighlightsEnabled: (value) => {
        setState((prev) => ({ ...prev, checkHighlightsEnabled: value }));
      },
      setShowIntensityLabels: (value) => {
        setState((prev) => ({ ...prev, showIntensityLabels: value }));
      },
    }),
    [],
  );

  return (
    <HeatmapSettingsStateContext.Provider value={state}>
      <HeatmapSettingsActionsContext.Provider value={actions}>{children}</HeatmapSettingsActionsContext.Provider>
    </HeatmapSettingsStateContext.Provider>
  );
});

HeatmapSettingsProvider.displayName = 'HeatmapSettingsProvider';

export const useHeatmapSettingsState = () => {
  const context = useContext(HeatmapSettingsStateContext);
  if (!context) {
    throw new Error('useHeatmapSettingsState must be used within HeatmapSettingsProvider');
  }
  return context;
};

export const useHeatmapSettingsActions = () => {
  const context = useContext(HeatmapSettingsActionsContext);
  if (!context) {
    throw new Error('useHeatmapSettingsActions must be used within HeatmapSettingsProvider');
  }
  return context;
};

export const buildToggleId = (piece: ChessPieceDescriptor) => `${piece.color}-${piece.type}`;
