'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { motion } from 'framer-motion';
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
  const [moveMode, setMoveMode] = useState<boolean>(true);
  const [boardWidth, setBoardWidth] = useState<number>(480);
  const boardRef = useRef<HTMLDivElement>(null);

  // Update board width on client side only
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        // Standard board size
        setBoardWidth(Math.min(window.innerWidth * 0.7, 480));
      }
    };

    // Initial calculation
    handleResize();

    // Add resize event listener
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
    }

    // Clean up event listener
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);
  
  // Handle making moves on the board
  const onDrop = (sourceSquare: string, targetSquare: string) => {
    try {
      if (!moveMode) return false;
      
      // Get possible moves for the piece at sourceSquare
      const piece = game.get(sourceSquare as any);
      if (!piece) {
        console.log("No piece at source square");
        return false;
      }
      
      // Check if it's the piece's turn to move
      if (piece.color !== game.turn()) {
        console.log("Not this piece's turn to move");
        return false;
      }
      
      // Try to make the move
      const moveAttempt = {
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q', // Always promote to queen for simplicity
      };
      
      console.log("Attempting move:", moveAttempt);
      
      // Check if this is a valid move
      const possibleMoves = game.moves({ verbose: true });
      const validMove = possibleMoves.some(
        (m: any) => m.from === sourceSquare && m.to === targetSquare
      );
      
      if (!validMove) {
        console.log("Invalid move");
        return false;
      }
      
      // Make the move
      const move = game.move(moveAttempt);
      
      // If the move is invalid, return false
      if (move === null) {
        console.log("Move rejected by chess.js");
        return false;
      }
      
      // Create a new game instance with the updated position
      const updatedGame = new Chess(game.fen());
      setGame(updatedGame);
      
      // If we're analyzing a PGN, add this move to the history
      if (fens.length > 0) {
        // Get all existing moves up to the current one
        const newFens = fens.slice(0, currentMove + 1);
        // Add the new position
        newFens.push(updatedGame.fen());
        setFens(newFens);
        setCurrentMove(newFens.length - 1);
      }
      
      return true;
    } catch (error) {
      console.error('Error making move:', error);
      return false;
    }
  };

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

  // Create custom piece components to control size directly
  const getCustomPieceComponent = (piece: string) => {
    // Function to return a custom piece component that matches the expected type signature
    return ({ squareWidth }: { squareWidth: number }) => {
      console.log(`Square width for ${piece}: ${squareWidth}`); // Debug log
      // Calculate the size based on square width
      const pieceSize = Math.floor(squareWidth * 0.85);
      
      // Get the correct SVG URL based on piece type
      const pieceImageUrl = 
        piece === 'wP' ? 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg' :
        piece === 'wN' ? 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg' :
        piece === 'wB' ? 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg' :
        piece === 'wR' ? 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg' :
        piece === 'wQ' ? 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg' :
        piece === 'wK' ? 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg' :
        piece === 'bP' ? 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg' :
        piece === 'bN' ? 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg' :
        piece === 'bB' ? 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg' :
        piece === 'bR' ? 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg' :
        piece === 'bQ' ? 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg' :
        piece === 'bK' ? 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg' :
        '';
      
      return (
        <div 
          style={{ 
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          <img 
            src={pieceImageUrl}
            alt={piece}
            style={{
              width: `${pieceSize}px`,
              height: `${pieceSize}px`,
              position: 'absolute',
              zIndex: 5,
            }}
          />
        </div>
      );
    };
  };

  // Define all custom piece components
  const customPieces = {
    wP: getCustomPieceComponent('wP'),
    wN: getCustomPieceComponent('wN'),
    wB: getCustomPieceComponent('wB'),
    wR: getCustomPieceComponent('wR'),
    wQ: getCustomPieceComponent('wQ'),
    wK: getCustomPieceComponent('wK'),
    bP: getCustomPieceComponent('bP'),
    bN: getCustomPieceComponent('bN'),
    bB: getCustomPieceComponent('bB'),
    bR: getCustomPieceComponent('bR'),
    bQ: getCustomPieceComponent('bQ'),
    bK: getCustomPieceComponent('bK'),
  };

  // Use client-side only rendering for the Chessboard
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-b from-[rgb(15,23,42)] to-[rgb(17,24,39)]">
      {/* Navigation Bar - Simplified */}
      <nav className="glass-effect sticky top-0 z-50 backdrop-blur-lg border-b border-gray-700/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent text-center">
            Chessterra
          </h1>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10 flex-1">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card-base overflow-hidden"
        >
          <div className="p-8">
            <h2 className="text-3xl font-semibold text-gray-100 mb-8 text-center">
              Chess Analytics Dashboard
            </h2>

            <div className="grid md:grid-cols-[2fr_1fr] gap-10">
              {/* Left Column - Chessboard */}
              <div className="flex flex-col items-center">
                <motion.div
                  ref={boardRef}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative w-full max-w-[480px] aspect-square mb-8 rounded-xl overflow-hidden shadow-[0_10px_30px_-5px_rgba(0,0,0,0.3)]"
                >
                  {isClient && (
                    <Chessboard 
                      position={game.fen()}
                      boardWidth={boardWidth}
                      customBoardStyle={{
                        borderRadius: '0.75rem',
                        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.2)',
                      }}
                      customDarkSquareStyle={{ backgroundColor: '#8B5A2B' }}
                      customLightSquareStyle={{ backgroundColor: '#F5DEB3' }}
                      id="StandardChessBoard"
                      areArrowsAllowed={false}
                      arePiecesDraggable={moveMode}
                      onPieceDrop={onDrop}
                      boardOrientation="white"
                      animationDuration={200}
                      customPieces={customPieces}
                    />
                  )}
                  {showHeatmap && (
                    <svg className="absolute top-0 left-0 w-full h-full rounded-lg overflow-hidden">
                      {Array.from({ length: 64 }, (_, i) => {
                        const rank = Math.floor(i / 8);
                        const file = i % 8;
                        const squareSize = 100 / 8;
                        const x = file * squareSize + '%';
                        const y = (7 - rank) * squareSize + '%';
                        const value =
                          heatmapMode === 'white'
                            ? Math.min(5, whiteInfluence[i] || 0)
                            : heatmapMode === 'black'
                            ? Math.min(5, blackInfluence[i] || 0)
                            : Math.max(-5, Math.min(5, (whiteInfluence[i] || 0) - (blackInfluence[i] || 0)));
                        const colorScale =
                          heatmapMode === 'net'
                            ? d3.scaleLinear<string>().domain([-5, 0, 5]).range(['rgba(59, 130, 246, 0.7)', 'rgba(255, 255, 255, 0.1)', 'rgba(239, 68, 68, 0.7)'])
                            : d3.scaleLinear<string>().domain([0, 5]).range(['rgba(255, 255, 255, 0.1)', 'rgba(239, 68, 68, 0.7)']);
                        const color = colorScale(value);
                        return (
                          <rect
                            key={i}
                            x={x}
                            y={y}
                            width={squareSize + '%'}
                            height={squareSize + '%'}
                            fill={color}
                            className="transition-opacity duration-300"
                          />
                        );
                      })}
                    </svg>
                  )}
                </motion.div>
                
                {/* Game Mode Controls */}
                <div className="glass-effect p-4 rounded-lg w-full max-w-[480px] mb-4">
                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-3 text-gray-200 p-2 rounded-lg hover:bg-gray-700/30 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={moveMode}
                        onChange={() => setMoveMode(!moveMode)}
                        className="w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800"
                      />
                      <span>Play Mode{moveMode ? ' (Pieces are draggable)' : ' (Analysis only)'}</span>
                    </label>
                    <button
                      onClick={() => {
                        setGame(new Chess());
                        if (fens.length > 0) {
                          setFens([new Chess().fen()]);
                          setCurrentMove(0);
                        }
                      }}
                      className="btn px-3 py-2 bg-blue-600/80 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-lg"
                    >
                      Reset Board
                    </button>
                  </div>
                </div>

                {/* Move Controls */}
                <div className="flex gap-4 w-full max-w-[480px] justify-center mb-8">
                  <button
                    onClick={() => setCurrentMove(0)}
                    disabled={currentMove === 0 || fens.length === 0}
                    className="p-2 bg-gray-700/70 text-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>
                  </button>
                  <button
                    onClick={() => setCurrentMove(Math.max(currentMove - 1, 0))}
                    disabled={currentMove === 0 || fens.length === 0}
                    className="btn px-5 py-3 bg-blue-600/80 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-lg"
                  >
                    Previous Move
                  </button>
                  <button
                    onClick={() => setCurrentMove(Math.min(currentMove + 1, fens.length - 1))}
                    disabled={currentMove === fens.length - 1 || fens.length === 0}
                    className="btn px-5 py-3 bg-blue-600/80 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-lg"
                  >
                    Next Move
                  </button>
                  <button
                    onClick={() => setCurrentMove(fens.length - 1)}
                    disabled={currentMove === fens.length - 1 || fens.length === 0}
                    className="p-2 bg-gray-700/70 text-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>
                  </button>
                </div>

                {/* Game Stats */}
                {fens.length > 0 && (
                  <div className="glass-effect p-4 rounded-lg w-full max-w-[480px] mb-8">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-300">
                        <span className="font-semibold">Move:</span> {Math.floor((currentMove + 1) / 2)}{currentMove % 2 === 0 ? '' : '...'}
                      </div>
                      <div className="text-sm text-gray-300">
                        <span className="font-semibold">To Move:</span> {game.turn() === 'w' ? 'White' : 'Black'}
                      </div>
                      <div className="text-sm text-gray-300">
                        <span className="font-semibold">Total Moves:</span> {Math.ceil((fens.length - 1) / 2)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Controls */}
              <div className="flex flex-col gap-6">
                <div className="glass-effect rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-semibold text-gray-200 mb-4 flex items-center">
                    <span className="icon-sm text-blue-400 mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                      </svg>
                    </span>
                    Visualization Options
                  </h3>
                  <div className="flex flex-col gap-4">
                    <label className="flex items-center gap-3 text-gray-200 p-2 rounded-lg hover:bg-gray-700/30 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showHeatmap}
                        onChange={() => setShowHeatmap(!showHeatmap)}
                        className="w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800"
                      />
                      <span>Show Board Influence</span>
                    </label>
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Heatmap Mode</label>
                      <select
                        value={heatmapMode}
                        onChange={(e) => setHeatmapMode(e.target.value as 'white' | 'black' | 'net')}
                        className="w-full p-3 bg-gray-700/80 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={!showHeatmap}
                      >
                        <option value="white">White Influence</option>
                        <option value="black">Black Influence</option>
                        <option value="net">Net Influence</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="glass-effect rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-semibold text-gray-200 mb-4 flex items-center">
                    <span className="icon-sm text-blue-400 mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H5.5z" />
                      </svg>
                    </span>
                    Game Import
                  </h3>
                  <textarea
                    value={pgn}
                    onChange={(e) => setPgn(e.target.value)}
                    placeholder="Paste your PGN notation here..."
                    rows={5}
                    className="w-full p-4 bg-gray-700/70 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                  />
                  {errorMessage && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 flex items-start">
                      <span className="icon-sm text-red-400 mr-2 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <span>{errorMessage}</span>
                    </div>
                  )}
                  <button
                    onClick={loadPgn}
                    className="btn w-full py-3 bg-blue-600/90 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg"
                  >
                    Load PGN
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">© 2024 Chessterra. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-gray-300">Terms</a>
              <a href="#" className="text-gray-400 hover:text-gray-300">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-gray-300">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ChessGame;