'use client';

import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { motion } from 'framer-motion';
import { Button } from '@headlessui/react';
import * as d3 from 'd3';
import { useGameStore } from '@/lib/gameStore';

const squareToIndex = (square: string): number => {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = parseInt(square[1]) - 1;
  return rank * 8 + file;
};

const calculateInfluence = (game: Chess, color: 'w' | 'b'): number[] => {
  if (!game || !game.fen) return new Array(64).fill(0);
  try {
    const fen = game.fen();
    const parts = fen.split(' ');
    parts[1] = color;
    const modifiedFen = parts.join(' ');
    const tempGame = new Chess(modifiedFen);
    const moves = tempGame.moves({ verbose: true });
    const influence = new Array(64).fill(0);
    moves.forEach((move: any) => {
      const squareIndex = squareToIndex(move.to);
      influence[squareIndex]++;
    });
    return influence;
  } catch (error) {
    console.error('Error calculating influence:', error);
    return new Array(64).fill(0);
  }
};

const ChessGame: React.FC = () => {
  const { pgn, setPgn, currentMove, setCurrentMove } = useGameStore();
  const [game, setGame] = useState<Chess>(new Chess());
  const [fens, setFens] = useState<string[]>([]);
  const [whiteInfluence, setWhiteInfluence] = useState<number[]>(new Array(64).fill(0));
  const [blackInfluence, setBlackInfluence] = useState<number[]>(new Array(64).fill(0));
  const [heatmapMode, setHeatmapMode] = useState<'white' | 'black' | 'net'>('net');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadPgn = () => {
    if (!pgn) {
      setErrorMessage('Please enter a PGN to load');
      return;
    }
    try {
      setErrorMessage(null);
      const newGame = new Chess();
      newGame.loadPgn(pgn);
      const history = newGame.history({ verbose: true });
      const fensList = [new Chess().fen()];
      let tempGame = new Chess();
      history.forEach((move: any) => {
        tempGame.move(move);
        fensList.push(tempGame.fen());
      });
      setFens(fensList);
      setCurrentMove(fensList.length - 1);
    } catch (error) {
      console.error('Error loading PGN:', error);
      setErrorMessage('Invalid PGN format. Please check and try again.');
    }
  };

  useEffect(() => {
    if (fens.length > 0) setGame(new Chess(fens[currentMove]));
  }, [currentMove, fens]);

  useEffect(() => {
    if (game) {
      const whiteInf = calculateInfluence(game, 'w');
      const blackInf = calculateInfluence(game, 'b');
      setWhiteInfluence(whiteInf);
      setBlackInfluence(blackInf);
    }
  }, [game]);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navigation Bar */}
      <nav className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <h1 className="text-2xl font-bold text-white">Chessterra</h1>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 mb-8">
          <h2 className="text-3xl font-semibold text-white mb-6 text-center">
            Chess Analytics Dashboard
          </h2>

          <div className="grid md:grid-cols-[2fr_1fr] gap-8">
            {/* Left Column - Chessboard */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative w-full max-w-[600px] aspect-square mb-6"
              >
                <Chessboard 
                  position={game.fen()} 
                  boardWidth={Math.min(window.innerWidth * 0.8, 600)}
                  customBoardStyle={{
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                {showHeatmap && (
                  <svg className="absolute top-0 left-0 w-full h-full rounded-lg overflow-hidden">
                    {Array.from({ length: 64 }, (_, i) => {
                      const rank = Math.floor(i / 8);
                      const file = i % 8;
                      const x = file * 50;
                      const y = (7 - rank) * 50;
                      const value =
                        heatmapMode === 'white'
                          ? Math.min(5, whiteInfluence[i] || 0)
                          : heatmapMode === 'black'
                          ? Math.min(5, blackInfluence[i] || 0)
                          : Math.max(-5, Math.min(5, (whiteInfluence[i] || 0) - (blackInfluence[i] || 0)));
                      const colorScale =
                        heatmapMode === 'net'
                          ? d3.scaleLinear<string>().domain([-5, 0, 5]).range(['blue', 'white', 'red'])
                          : d3.scaleLinear<string>().domain([0, 5]).range(['white', 'red']);
                      const color = colorScale(value);
                      return (
                        <rect
                          key={i}
                          x={x}
                          y={y}
                          width={50}
                          height={50}
                          fill={color}
                          opacity={0.5}
                          className="transition-opacity duration-300"
                        />
                      );
                    })}
                  </svg>
                )}
              </motion.div>

              {/* Move Controls */}
              <div className="flex gap-3 w-full max-w-[600px] justify-center">
                <Button
                  onClick={() => setCurrentMove(Math.max(currentMove - 1, 0))}
                  disabled={currentMove === 0 || fens.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:text-gray-200 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  ← Previous
                </Button>
                <Button
                  onClick={() => setCurrentMove(Math.min(currentMove + 1, fens.length - 1))}
                  disabled={currentMove === fens.length - 1 || fens.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:text-gray-200 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Next →
                </Button>
              </div>
            </div>

            {/* Right Column - Controls */}
            <div className="flex flex-col gap-4">
              <div className="bg-gray-700 rounded-lg p-4 shadow-lg">
                <h3 className="text-lg font-medium text-white mb-3">Visualization Options</h3>
                <div className="flex flex-col gap-4">
                  <label className="flex items-center gap-3 text-gray-200">
                    <input
                      type="checkbox"
                      checked={showHeatmap}
                      onChange={() => setShowHeatmap(!showHeatmap)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Show Heatmap
                  </label>
                  <select
                    value={heatmapMode}
                    onChange={(e) => setHeatmapMode(e.target.value as 'white' | 'black' | 'net')}
                    className="w-full p-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="white">White Influence</option>
                    <option value="black">Black Influence</option>
                    <option value="net">Net Influence</option>
                  </select>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4 shadow-lg">
                <h3 className="text-lg font-medium text-white mb-3">Game Import</h3>
                <textarea
                  value={pgn}
                  onChange={(e) => setPgn(e.target.value)}
                  placeholder="Paste your PGN notation here..."
                  rows={5}
                  className="w-full p-3 bg-gray-600 border border-gray-500 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                />
                {errorMessage && (
                  <div className="mb-3 p-3 bg-red-900/50 border border-red-500 rounded-md text-red-200">
                    {errorMessage}
                  </div>
                )}
                <Button
                  onClick={loadPgn}
                  className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Load PGN
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-gray-400">
          <p>© 2024 Chessterra. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default ChessGame;