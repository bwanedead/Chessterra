import { asRatingBucketId } from '@/platform/ids';
import type { RatingBucketKey } from './types';

export const buildRatingBucketId = (key: RatingBucketKey): string => {
  const parts = [key.gameModeId, key.timeControlId];
  if (key.subdivision) {
    parts.push(key.subdivision);
  }
  return parts.join('::');
};

export const parseRatingBucketId = (bucketId: string): RatingBucketKey => {
  const [gameModeId, timeControlId, subdivision] = bucketId.split('::');
  return { gameModeId, timeControlId, subdivision };
};

export const toRatingBucketId = (key: RatingBucketKey) =>
  asRatingBucketId(buildRatingBucketId(key));

export const listBucketKeysForMode = (
  gameModeId: string,
  timeControlIds: string[],
  subdivisions?: string[],
): RatingBucketKey[] => {
  const keys: RatingBucketKey[] = [];
  for (const timeControlId of timeControlIds) {
    if (!subdivisions || subdivisions.length === 0) {
      keys.push({ gameModeId, timeControlId });
      continue;
    }
    for (const subdivision of subdivisions) {
      keys.push({ gameModeId, timeControlId, subdivision });
    }
  }
  return keys;
};
