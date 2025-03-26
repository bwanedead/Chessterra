# Chessterra

Chessterra is a chess analytics web application that allows users to analyze chess games with advanced heatmaps and visualizations.

## Features

- Professional chessboard display
- PGN import functionality
- Heatmap visualization with different modes (White Influence, Black Influence, Net Influence)
- Move navigation
- Responsive design

## Tech Stack

- **Frontend**: Next.js with TypeScript, Tailwind CSS, Headless UI, Framer Motion
- **State Management**: Zustand
- **Chess Logic**: chess.js, react-chessboard
- **Visualization**: D3.js

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3001](http://localhost:3001) in your browser

## Usage

1. Paste a PGN notation into the textarea
2. Click "Load PGN" to load the game
3. Use the "Previous" and "Next" buttons to navigate through the moves
4. Toggle the heatmap visualization and select the desired mode

## License

© 2024 Chessterra. All rights reserved.
