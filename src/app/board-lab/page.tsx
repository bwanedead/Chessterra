import type { Metadata } from 'next';
import { BoardLabClient } from './BoardLabClient';

export const metadata: Metadata = {
  title: 'Board Lab — Chessterra',
  description: 'Design and edit board variants via CLI',
};

export default function BoardLabPage() {
  return <BoardLabClient />;
}
