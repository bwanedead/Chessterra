import type { Metadata } from 'next';
import { PlayPageClient } from './PlayPageClient';

export const metadata: Metadata = {
  title: 'Play — Endgame',
  description: 'Local endgame play vs bot (Phase 0)',
};

export default function PlayPage() {
  return <PlayPageClient />;
}
