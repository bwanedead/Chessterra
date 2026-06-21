import type { LeaderboardEntry, RatingRecord } from './types';

export const sortLeaderboard = (
  records: RatingRecord[],
  displayNames: Record<string, string>,
): LeaderboardEntry[] =>
  [...records]
    .sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      return b.gamesPlayed - a.gamesPlayed;
    })
    .map((record, index) => ({
      rank: index + 1,
      userId: record.userId,
      displayName: displayNames[record.userId] ?? 'Anonymous',
      rating: record.rating,
      gamesPlayed: record.gamesPlayed,
      provisional: record.provisional,
    }));

export const filterProvisional = (
  entries: LeaderboardEntry[],
  includeProvisional: boolean,
): LeaderboardEntry[] =>
  includeProvisional ? entries : entries.filter((entry) => !entry.provisional);
