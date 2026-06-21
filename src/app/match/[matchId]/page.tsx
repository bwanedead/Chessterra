import { MatchClient } from './MatchClient';

interface MatchPageProps {
  params: Promise<{ matchId: string }>;
}

export default async function MatchPage({ params }: MatchPageProps) {
  const { matchId } = await params;
  return <MatchClient matchId={matchId} />;
}
