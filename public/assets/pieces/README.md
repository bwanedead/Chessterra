# Chess Piece Sprites

Place piece sprite assets for each visual style inside this folder. The application expects individual image files per piece using the following naming scheme:

```
style-name/
  wP.png  # white pawn
  wN.png  # white knight
  wB.png  # white bishop
  wR.png  # white rook
  wQ.png  # white queen
  wK.png  # white king
  bP.png  # black pawn
  bN.png  # black knight
  bB.png  # black bishop
  bR.png  # black rook
  bQ.png  # black queen
  bK.png  # black king
```

## Guidelines
- Use transparent PNGs sized at least 256×256 to keep the pieces crisp on HiDPI displays. SVGs are also supported if you prefer vector art—reuse the same filenames with `.svg`.
- Keep background transparent.
- Additional styles can be added under `public/assets/pieces/<style-name>/` using the same filenames.
- The default style shipped with the app is currently `style-2`. Update `DEFAULT_PIECE_STYLE` in `src/shared/utils/pieceAssets.ts` or set `NEXT_PUBLIC_PIECE_STYLE` if you want a different default. Update `DEFAULT_PIECE_STYLE` in `src/shared/utils/pieceAssets.ts` if you create new defaults.
- If a file is missing, the app will fall back to the remote Wikipedia set until you replace it.

