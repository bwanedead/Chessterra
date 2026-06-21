import type { Metadata } from 'next';
import { AuthPageClient } from './AuthPageClient';

export const metadata: Metadata = {
  title: 'Account — Endgame',
  description: 'Sign in to Endgame',
};

export default function AuthPage() {
  return <AuthPageClient />;
}
