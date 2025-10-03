'use client';

import * as d3 from 'd3';
import { useMemo } from 'react';
import { registerOverlay, registerOverlayToolbar } from '@/features/chessboard/overlays/registry';
import {
  OverlayOptionsRecord,
  OverlayRenderContext,
  OverlayToolbarProps,
} from '@/features/chessboard/overlays/types';
import { InfluenceMode } from '@/domain/models/game';
import { mobilityStrategy } from '@/domain/analysis/strategies/mobilityBasic';
import { useHeatmapData } from '@/features/analysis/hooks/useHeatmapData';
import { InfluenceLegend } from '@/features/analysis/components/InfluenceLegend';

const OVERLAY_ID = 'influence-heatmap';

type HeatmapMode = InfluenceMode;

interface HeatmapOverlayOptions extends OverlayOptionsRecord {
  mode: HeatmapMode;
  strategyId: string;
  intensity: number;
}

const BOARD_SIZE = 8;
const SQUARE_COUNT = BOARD_SIZE * BOARD_SIZE;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

const createColorScale = (mode: HeatmapMode, alpha: number) => {
  if (mode === 'net') {
    return d3
      .scaleLinear<string>()
      .domain([-1, 0, 1])
      .range([
        `rgba(59, 130, 246, ${alpha})`,
        'rgba(255, 255, 255, 0)',
        `rgba(239, 68, 68, ${alpha})`,
      ]);
  }

  return d3
    .scaleLinear<string>()
    .domain([0, 1])
    .range(['rgba(255, 255, 255, 0)', `rgba(239, 68, 68, ${alpha})`]);
};

const normalizeValues = (values: number[], mode: HeatmapMode) => {
  const maxMagnitude = values.reduce((max, value) => {
    const magnitude = Math.abs(value);
    return magnitude > max ? magnitude : max;
  }, 0);

  const safeMax = maxMagnitude === 0 ? 1 : maxMagnitude;

  return values.map((value) => {
    if (mode === 'net') {
      return clamp(value / safeMax, -1, 1);
    }

    return clamp(value / safeMax, 0, 1);
  });
};

const HeatmapLayer = ({ fen, orientation, options }: OverlayRenderContext<HeatmapOverlayOptions>) => {
  const data = useHeatmapData(fen, { strategyId: options.strategyId });
  const values = data[options.mode] ?? new Array<number>(SQUARE_COUNT).fill(0);
  const normalized = useMemo(() => normalizeValues(values, options.mode), [values, options.mode]);
  const intensity = clamp(options.intensity, 0, 1);
  const alpha = 0.25 + intensity * 0.55;
  const colorScale = useMemo(() => createColorScale(options.mode, alpha), [options.mode, alpha]);

  const squareSizePercent = 100 / BOARD_SIZE;

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full rounded-xl"
      style={{
        transform: orientation === 'black' ? 'rotate(180deg)' : undefined,
        transformOrigin: 'center',
      }}
    >
      {normalized.map((value, index) => {
        const rank = Math.floor(index / BOARD_SIZE);
        const file = index % BOARD_SIZE;
        const x = `${file * squareSizePercent}%`;
        const y = `${(BOARD_SIZE - 1 - rank) * squareSizePercent}%`;
        const fill = colorScale(value ?? 0) ?? 'transparent';

        return (
          <rect
            key={index}
            x={x}
            y={y}
            width={`${squareSizePercent}%`}
            height={`${squareSizePercent}%`}
            fill={fill}
            style={{ opacity: intensity }}
          />
        );
      })}
    </svg>
  );
};

const HeatmapToolbar = ({ overlayId, options, active, setActive, updateOptions }: OverlayToolbarProps<HeatmapOverlayOptions>) => {
  const handleSelectMode = (mode: HeatmapMode) => setActive(true) || updateOptions({ mode });

  return (
    <div className="flex w-full flex-col gap-3 text-sm text-gray-200">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={active}
          onChange={(event) => setActive(event.target.checked)}
          className="h-4 w-4 rounded border-gray-500 text-blue-500 focus:ring-blue-400"
        />
        <span className="font-medium">Show influence heatmap</span>
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-wide text-gray-400">Mode</span>
        <div className="flex flex-col gap-2">
          {(['net', 'white', 'black'] as HeatmapMode[]).map((mode) => {
            const isSelected = options.mode === mode;
            return (
              <button
                key={`${overlayId}-mode-${mode}`}
                type="button"
                onClick={() => handleSelectMode(mode)}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isSelected
                    ? 'border-blue-500/80 bg-blue-500/10 text-white'
                    : 'border-gray-700 bg-gray-900/40 text-gray-300 hover:bg-gray-900/70'
                }`}
              >
                <span className="capitalize">{mode === 'net' ? 'Net advantage' : `${mode} influence`}</span>
                {isSelected && <span className="text-xs text-blue-300">Active</span>}
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-wide text-gray-400">Intensity</span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(options.intensity * 100)}
          onChange={(event) => updateOptions({ intensity: Number(event.target.value) / 100 })}
          className="accent-blue-400"
          aria-label="Heatmap intensity"
        />
      </label>

      <div className="mt-2 rounded-lg border border-white/5 bg-gray-900/50 p-2 text-xs text-gray-300">
        <InfluenceLegend mode={options.mode} />
      </div>
    </div>
  );
};

registerOverlay<HeatmapOverlayOptions>({
  id: OVERLAY_ID,
  label: 'Influence Heatmap',
  description: 'Highlights legal move coverage as a heatmap overlay.',
  type: 'board-layer',
  order: 100,
  zIndex: 20,
  defaultActive: false,
  defaultOptions: {
    mode: 'net',
    strategyId: mobilityStrategy.id,
    intensity: 0.75,
  },
  group: {
    id: 'board-heatmaps',
    exclusive: true,
  },
  pointerEvents: 'none',
  render: (context) => <HeatmapLayer {...context} />,
});

registerOverlayToolbar<HeatmapOverlayOptions>({
  overlayId: OVERLAY_ID,
  render: (props) => <HeatmapToolbar {...props} />,
});

export type { HeatmapOverlayOptions };
export const HEATMAP_OVERLAY_ID = OVERLAY_ID;
