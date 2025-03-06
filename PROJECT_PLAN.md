Below is the complete project plan for your **Chessterra** chess analytics web application, tailored for Cursor AI to execute. This plan starts from scratch (as requested) and sets up the project in `C:\Projects\chessterra` with all the features and optimizations we've discussed: Next.js with TypeScript, App Router, `src` directory, Tailwind CSS, Turbopack, `@/*` import alias, and the core functionality (chessboard, PGN import, heatmap). You can copy and paste this entire plan into Cursor AI and save it as `PROJECT_PLAN.md` in your project folder for reference.

---

# Chessterra Project Plan (Starting from Scratch)

This document guides Cursor AI to build **Chessterra**, a chess analytics web application, from the ground up in `C:\Projects\chessterra`. The app will feature a professional chessboard, PGN import, and heatmap with a polished UI, using the Next.js App Router, `src` directory, Tailwind CSS, Turbopack, and a custom `@/*` import alias for maximum professionalism, polish, and flexibility.

## Tech Stack
- **Frontend**: Next.js with TypeScript, Tailwind CSS, Headless UI, Framer Motion
- **Backend**: Supabase
- **Design**: Storybook, Figma (external)
- **Performance**: Vercel, Turbopack (development)

## Project Overview
Initial focus: Professional chessboard, PGN import, heatmap with polished animations. Future: User accounts, saved games, mobile support.

---

## Phase 1: Project Setup

### 1. Initialize Next.js Project
- **Task**: Set up a new Next.js project in the existing `C:\Projects\chessterra` folder.
- **Instructions**:
  1. Open Command Prompt or PowerShell.
  2. Navigate to the project folder (ensure it's empty):
     ```bash
     cd C:\Projects\chessterra
     ```
  3. Initialize the Next.js project:
     ```bash
     npx create-next-app . --typescript
     ```
  4. When prompted, respond with:
     - `? Would you like to use ESLint? Yes`
     - `? Would you like to use Tailwind CSS? Yes`
     - `? Would you like your code inside a src directory? Yes`
     - `? Would you like to use App Router? Yes`
     - `? Would you like to use Turbopack for Next.js dev? Yes`
     - `? Would you like to customize the import alias? Yes`
     - `What import alias would you like configured? (e.g., @/*)`: Enter `@/*`
  5. Verify the setup:
     ```bash
     npm run dev
     ```
     - Visit `http://localhost:3000` to see the default Next.js welcome page.

### 2. Install Additional Libraries
- **Task**: Add libraries for UI, animations, state management, and design.
- **Instructions**:
  - Run these commands in `C:\Projects\chessterra`:
    ```bash
    npm install @headlessui/react framer-motion zustand @storybook/react
    ```

### 3. Set Up Supabase
- **Task**: Integrate Supabase for future backend functionality.
- **Instructions**:
  1. Sign up at [Supabase](https://supabase.com) and create a project named "chessterra".
  2. From the Supabase dashboard (Settings > API), copy your **Project URL** and **API Key (anon public)**.
  3. Install the Supabase client:
     ```bash
     npm install @supabase/supabase-js
     ```
  4. Create `src/lib/supabaseClient.ts` with:
     ```typescript
     import { createClient } from '@supabase/supabase-js';

     const supabaseUrl = 'YOUR_SUPABASE_URL'; // Replace with your Project URL
     const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your API Key

     export const supabase = createClient(supabaseUrl, supabaseKey);
     ```
     - Replace `'YOUR_SUPABASE_URL'` and `'YOUR_SUPABASE_ANON_KEY'` with your actual Supabase credentials.

### 4. Configure Tailwind and Design System
- **Task**: Customize Tailwind CSS for **Chessterra**'s branding.
- **Instructions**:
  - Create `tailwind.config.ts`:
    ```typescript
    import type { Config } from 'tailwindcss';

    const config: Config = {
      content: [
        './src/**/*.{ts,tsx}',
      ],
      theme: {
        extend: {
          colors: {
            'chess-blue': '#1e3a8a',
            'chess-gold': '#d4a017',
            'chess-gray': '#4a5568',
          },
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
          },
          animation: {
            'slide-in': 'slideIn 0.5s ease-out',
          },
          keyframes: {
            slideIn: {
              '0%': { transform: 'translateY(20px)', opacity: 0 },
              '100%': { transform: 'translateY(0)', opacity: 1 },
            },
          },
        },
      },
      plugins: [],
    };
    export default config;
    ```
  - Update `app/globals.css`:
    ```css
    @tailwind base;
    @tailwind components;
    @tailwind utilities;

    :root {
      --foreground-rgb: 0, 0, 0;
      --background-start-rgb: 214, 219, 220;
      --background-end-rgb: 255, 255, 255;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --foreground-rgb: 255, 255, 255;
        --background-start-rgb: 0, 0, 0;
        --background-end-rgb: 0, 0, 0;
      }
    }

    body {
      color: rgb(var(--foreground-rgb));
      background: linear-gradient(to bottom, transparent, rgb(var(--background-end-rgb))) rgb(var(--background-start-rgb));
    }
    ```

---

## Phase 2: Build Core Components

### 1. Create Layout Component
- **Task**: Define the root layout for the app with metadata and styling.
- **Instructions**:
  - Create `src/app/layout.tsx`:
    ```typescript
    import type { Metadata } from 'next';
    import { Inter } from 'next/font/google';

    const inter = Inter({ subsets: ['latin'] });

    export const metadata: Metadata = {
      title: 'Chessterra - Chess Analytics',
      description: 'Analyze chess games with advanced heatmaps and visualizations',
    };

    export default function RootLayout({
      children,
    }: {
      children: React.ReactNode;
    }) {
      return (
        <html lang="en">
          <body className={`${inter.className} min-h-screen bg-gradient-to-b from-chess-gray/10 to-white dark:from-gray-900 dark:to-black`}>
            {children}
          </body>
        </html>
      );
    }
    ```

### 2. Create Homepage
- **Task**: Update the homepage to include the chess game component.
- **Instructions**:
  - Create `src/app/page.tsx`:
    ```typescript
    import ChessGame from '@/components/ChessGame';

    export default function Home() {
      return (
        <div className="container mx-auto p-6">
          <h1 className="text-4xl font-bold text-chess-blue mb-8 text-center">Chessterra</h1>
          <ChessGame />
        </div>
      );
    }
    ```

### 3. Create ChessGame Component
- **Task**: Build the main component for chessboard display, PGN import, and heatmap visualization.
- **Instructions**:
  - Create `src/components/ChessGame.tsx`:
    ```typescript
    import React, { useState, useEffect } from 'react';
    import { Chess } from 'chess.js';
    import { Chessboard } from 'react-chessboard';
    import { motion } from 'framer-motion';
    import { Button } from '@headlessui/react';
    import * as d3 from 'd3';

    const squareToIndex = (square: string): number => {
      const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
      const rank = parseInt(square[1]) - 1;
      return rank * 8 + file;
    };

    const calculateInfluence = (game: Chess, color: 'w' | 'b'): number[] => {
      const fen = game.fen();
      const parts = fen.split(' ');
      parts[1] = color;
      const modifiedFen = parts.join(' ');
      const tempGame = new Chess(modifiedFen);
      const moves = tempGame.moves({ verbose: true });
      const influence = new Array(64).fill(0);
      moves.forEach((move) => {
        const squareIndex = squareToIndex(move.to);
        influence[squareIndex]++;
      });
      return influence;
    };

    const ChessGame: React.FC = () => {
      const [game, setGame] = useState(new Chess());
      const [pgn, setPgn] = useState('');
      const [fens, setFens] = useState<string[]>([]);
      const [currentMove, setCurrentMove] = useState(0);
      const [whiteInfluence, setWhiteInfluence] = useState<number[]>([]);
      const [blackInfluence, setBlackInfluence] = useState<number[]>([]);
      const [heatmapMode, setHeatmapMode] = useState<'white' | 'black' | 'net'>('net');
      const [showHeatmap, setShowHeatmap] = useState(false);

      const loadPgn = () => {
        const newGame = new Chess();
        newGame.load_pgn(pgn);
        const history = newGame.history({ verbose: true });
        const fensList = [new Chess().fen()];
        let tempGame = new Chess();
        history.forEach((move) => {
          tempGame.move(move);
          fensList.push(tempGame.fen());
        });
        setFens(fensList);
        setCurrentMove(fensList.length - 1);
      };

      useEffect(() => {
        if (fens.length > 0) {
          setGame(new Chess(fens[currentMove]));
        }
      }, [currentMove, fens]);

      useEffect(() => {
        const whiteInf = calculateInfluence(game, 'w');
        const blackInf = calculateInfluence(game, 'b');
        setWhiteInfluence(whiteInf);
        setBlackInfluence(blackInf);
      }, [game.fen()]);

      return (
        <div className="container mx-auto p-4">
          <div className="mb-4 flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showHeatmap}
                onChange={() => setShowHeatmap(!showHeatmap)}
                className="h-4 w-4"
              />
              Show Heatmap
            </label>
            <select
              value={heatmapMode}
              onChange={(e) => setHeatmapMode(e.target.value as 'white' | 'black' | 'net')}
              className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-chess-blue"
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
          />
          <Button
            onClick={loadPgn}
            className="mb-4 px-4 py-2 bg-chess-blue text-white rounded-md hover:bg-chess-blue/80 transition-colors duration-200"
          >
            Load PGN
          </Button>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative w-[400px] h-[400px]"
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
            <Button
              onClick={() => setCurrentMove((prev) => Math.max(prev - 1, 0))}
              disabled={currentMove === 0}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 disabled:bg-gray-200 disabled:text-gray-500 transition-colors duration-200"
            >
              Previous
            </Button>
            <Button
              onClick={() => setCurrentMove((prev) => Math.min(prev + 1, fens.length - 1))}
              disabled={currentMove === fens.length - 1}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 disabled:bg-gray-200 disabled:text-gray-500 transition-colors duration-200"
            >
              Next
            </Button>
          </div>
        </div>
      );
    };

    export default ChessGame;
    ```

### 4. Set Up State Management (Optional for Now)
- **Task**: Create a basic state management store for future scalability.
- **Instructions**:
  - Create `src/lib/gameStore.ts`:
    ```typescript
    import { create } from 'zustand';

    interface GameState {
      pgn: string;
      setPgn: (pgn: string) => void;
      currentMove: number;
      setCurrentMove: (move: number) => void;
    }

    export const useGameStore = create<GameState>((set) => ({
      pgn: '',
      setPgn: (pgn) => set({ pgn }),
      currentMove: 0,
      setCurrentMove: (move) => set({ currentMove: move }),
    }));
    ```

### 5. Set Up Storybook for Design System
- **Task**: Initialize Storybook to document and test components.
- **Instructions**:
  - Run:
    ```bash
    npx storybook@latest init --type react
    ```
  - Create `stories/ChessGame.stories.tsx` (in `C:\Projects\chessterra\stories`):
    ```typescript
    import ChessGame from '@/components/ChessGame';

    export default {
      title: 'Components/ChessGame',
      component: ChessGame,
    };

    export const Default = () => <ChessGame />;
    ```

## Progress Update - Phase 2 Completed

We have successfully completed Phase 2 of the Chessterra project:

1. ✅ Created the Layout Component with metadata and styling
2. ✅ Created the Homepage with the ChessGame component
3. ✅ Created the ChessGame Component with full functionality
4. ✅ Set up State Management with Zustand
5. ✅ Set up Storybook for component documentation
6. ✅ Installed all required chess libraries:
   - chess.js for chess logic
   - react-chessboard for the visual chessboard
   - d3 for heatmap visualization

The application is now running successfully on http://localhost:3001 with all core features implemented:
- PGN import functionality
- Chessboard display
- Move navigation
- Heatmap visualization with different modes

---

## Phase 3: Testing and Polishing

### 1. Test the App
- **Task**: Verify functionality and performance.
- **Instructions**:
  - Test PGN import with various PGN formats
  - Test move navigation for correctness
  - Test heatmap visualization in all modes
  - Test responsive design on different screen sizes
  - Check for any console errors or warnings

### 2. Deploy to Vercel
- **Task**: Deploy the app for a professional production environment.
- **Instructions**:
  - Run:
    ```bash
    npx vercel
    ```
  - Follow Vercel's prompts to deploy and get a live URL.

### 3. Final Polishing
- **Task**: Make final improvements for production.
- **Instructions**:
  - Add loading states for better UX
  - Improve error handling for invalid PGNs
  - Add a sample PGN button for easy testing
  - Ensure all accessibility features are working correctly
  - Add a footer with credits and links

---

## File Tree Structure
```
C:\Projects\chessterra\
├── src\
│   ├── app\
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components\
│   │   └── ChessGame.tsx
│   └── lib\
│       ├── supabaseClient.ts
│       └── gameStore.ts
├── public\
├── stories\
│   └── ChessGame.stories.tsx
├── tailwind.config.ts
├── app\
│   └── globals.css
├── package.json
├── tsconfig.json
└── PROJECT_PLAN.md
```

---

## Final Notes for Cursor AI
- **Execution**: Create all files with the exact code provided, using `@/*` for imports (e.g., `import ChessGame from '@/components/ChessGame'`).
- **Styling**: Use Tailwind for UI, Headless UI for components, Framer Motion for animations.
- **Flexibility**: Ensure responsive design (e.g., `md:w-[600px]`).
- **Professionalism**: Add accessibility (e.g., `aria-label` on buttons) and test with Lighthouse for WCAG compliance.
- **Turbopack**: Use for `npm run dev` for faster development; monitor for any experimental issues.
- **Troubleshooting**: If errors occur (e.g., import alias issues), ensure `tsconfig.json` has:
  ```json
  {
    "compilerOptions": {
      "baseUrl": "src",
      "paths": {
        "@/*": ["*"]
      }
    }
  }
  ```

This plan starts **Chessterra** from scratch, delivering a professional, polished, flexible app. Copy this into Cursor AI, save as `PROJECT_PLAN.md`, and execute it to begin development. Let me know if you encounter any issues, and we'll tackle them together!