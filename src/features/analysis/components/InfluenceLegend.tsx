import { InfluenceMode } from '@/domain/models/game';

interface InfluenceLegendProps {
  mode: InfluenceMode;
}

const labels: Record<InfluenceMode, string> = {
  white: 'White legal move coverage',
  black: 'Black legal move coverage',
  net: 'Net advantage (white - black)',
};

export const InfluenceLegend = ({ mode }: InfluenceLegendProps) => (
  <div className="text-sm text-gray-300">
    <span className="font-semibold text-gray-100 mr-2">Heatmap:</span>
    {labels[mode]}
  </div>
);
