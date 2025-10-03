import { VisualizationToolbar } from '@/features/chessboard/components/VisualizationToolbar';

export const AnalysisControls = () => {
  return (
    <div className="glass-effect rounded-2xl border border-white/10 bg-gray-900/70 p-6 shadow-[0_18px_45px_-15px_rgba(0,0,0,0.6)]">
      <h3 className="mb-5 flex items-center text-xl font-semibold text-gray-100">
        <span className="mr-3 rounded-full bg-blue-500/15 p-2 text-blue-400">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path d="M2 10a8 8 0 1114.906 3.37l1.387 1.386a1 1 0 01-1.414 1.415l-1.386-1.387A8 8 0 012 10zm8-6a6 6 0 100 12 6 6 0 000-12z" />
            <path d="M11 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zM10 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </span>
        Visual Insights
      </h3>
      <VisualizationToolbar asPanel={false} />
    </div>
  );
};
