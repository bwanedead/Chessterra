'use client';

import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/gameStore';
import * as d3 from 'd3';

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
  // Use the game store for state management
  const { pgn, setPgn, currentMove, setCurrentMove } = useGameStore();
  
  // Local state
  const [game, setGame] = useState<Chess>(new Chess());
  const [fens, setFens] = useState<string[]>([]);
  const [whiteInfluence, setWhiteInfluence] = useState<number[]>(new Array(64).fill(0));
  const [blackInfluence, setBlackInfluence] = useState<number[]>(new Array(64).fill(0));
  const [heatmapMode, setHeatmapMode] = useState<'white' | 'black' | 'net'>('net');
  const [showHeatmap, setShowHeatmap] = useState(false);

  const loadPgn = () => {
    if (!pgn) return;
    
    try {
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
      alert('Invalid PGN format. Please check and try again.');
    }
  };

  useEffect(() => {
    if (fens.length > 0) {
      setGame(new Chess(fens[currentMove]));
    }
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
    <div className="container mx-auto p-4">
      <div className="mb-4 flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showHeatmap}
            onChange={() => setShowHeatmap(!showHeatmap)}
            className="h-4 w-4"
            aria-label="Toggle heatmap visualization"
          />
          Show Heatmap
        </label>
        <select
          value={heatmapMode}
          onChange={(e) => setHeatmapMode(e.target.value as 'white' | 'black' | 'net')}
          className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-chess-blue"
          aria-label="Select heatmap mode"
        >
          <option value="white">White Influence</option>
          <option value="black">Black Influence</option>
          <option value="net">Net Influence</option>
        </select>
      </div>
      <textarea
        value={pgn}
        onChange={(e) => setPgn(e.target.value)}
        placeholder="Paste your PGN here"
        rows={5}
        className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-chess-blue"
        aria-label="PGN input"
      />
      <button
        onClick={loadPgn}
        className="mb-4 px-4 py-2 bg-chess-blue text-white rounded-md hover:bg-chess-blue/80 transition-colors duration-200"
        aria-label="Load PGN"
      >
        Load PGN
      </button>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-[400px] h-[400px] md:w-[600px] md:h-[600px]"
      >
        <Chessboard position={game.fen()} boardWidth={400} />
        {showHeatmap && (
          <svg className="absolute top-0 left-0 w-full h-full">
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
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setCurrentMove(Math.max(currentMove - 1, 0))}
          disabled={currentMove === 0 || fens.length === 0}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 disabled:bg-gray-200 disabled:text-gray-500 transition-colors duration-200"
          aria-label="Previous move"
        >
          Previous
        </button>
        <button
          onClick={() => setCurrentMove(Math.min(currentMove + 1, fens.length - 1))}
          disabled={currentMove === fens.length - 1 || fens.length === 0}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 disabled:bg-gray-200 disabled:text-gray-500 transition-colors duration-200"
          aria-label="Next move"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ChessGame; 