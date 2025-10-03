'use client';

import { motion } from 'framer-motion';
import { ChessboardPanel } from '@/features/chessboard/components/ChessboardPanel';
import { BoardModePanel } from '@/features/chessboard/components/BoardModePanel';
import { MoveControls } from '@/features/chessboard/components/MoveControls';
import { GameStats } from '@/features/chessboard/components/GameStats';
import { AnalysisControls } from '@/features/analysis/components/AnalysisControls';
import { PgnUploadPanel } from '@/features/import/components/PgnUploadPanel';
import { NavigationHeader } from '@/features/dashboard/components/NavigationHeader';
import { FooterSection } from '@/features/dashboard/components/FooterSection';

export const ChessDashboard = () => {
  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-b from-[rgb(15,23,42)] to-[rgb(17,24,39)]">
      <NavigationHeader />

      <main className="max-w-7xl mx-auto px-6 py-10 flex-1 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card-base overflow-hidden"
        >
          <div className="p-8">
            <h2 className="text-3xl font-semibold text-gray-100 mb-8 text-center">Chess Analytics Dashboard</h2>

            <div className="grid md:grid-cols-[2fr_1fr] gap-10">
              <div className="flex flex-col items-center">
                <ChessboardPanel />
                <BoardModePanel />
                <MoveControls />
                <GameStats />
              </div>

              <div className="flex flex-col gap-6">
                <AnalysisControls />
                <PgnUploadPanel />
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <FooterSection />
    </div>
  );
};
