import type { SupabaseClient } from '@supabase/supabase-js';
import type { RatingRecord } from '@/domain/play/rating/types';
import { asRatingBucketId, asUserId, type UserId } from '@/platform/ids';
import { createDefaultRating } from '@/domain/play/rating/glicko2';

const isPersistableUserId = (userId: UserId): boolean => !String(userId).startsWith('guest-');

const rowToRecord = (row: {
  user_id: string;
  bucket_id: string;
  rating: number;
  rating_deviation: number;
  volatility: number;
  games_played: number;
  provisional: boolean;
  updated_at: string;
}): RatingRecord => ({
  userId: asUserId(row.user_id),
  bucketId: asRatingBucketId(row.bucket_id),
  rating: Number(row.rating),
  ratingDeviation: Number(row.rating_deviation),
  volatility: Number(row.volatility),
  gamesPlayed: row.games_played,
  provisional: row.provisional,
  updatedAt: row.updated_at,
});

export const createSupabaseRatingStore = (supabase: SupabaseClient) => ({
  async getOrCreate(userId: UserId, bucketId: string): Promise<RatingRecord> {
    if (!isPersistableUserId(userId)) {
      return createDefaultRating(userId, asRatingBucketId(bucketId));
    }

    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .eq('user_id', userId)
      .eq('bucket_id', bucketId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load rating: ${error.message}`);
    }

    if (data) {
      return rowToRecord(data);
    }

    const created = createDefaultRating(userId, asRatingBucketId(bucketId));
    const { error: insertError } = await supabase.from('ratings').insert({
      user_id: userId,
      bucket_id: bucketId,
      rating: created.rating,
      rating_deviation: created.ratingDeviation,
      volatility: created.volatility,
      games_played: created.gamesPlayed,
      provisional: created.provisional,
      updated_at: created.updatedAt,
    });

    if (insertError) {
      throw new Error(`Failed to create rating: ${insertError.message}`);
    }

    return created;
  },

  async save(record: RatingRecord): Promise<void> {
    if (!isPersistableUserId(record.userId)) {
      return;
    }

    const { error } = await supabase.from('ratings').upsert(
      {
        user_id: record.userId,
        bucket_id: record.bucketId,
        rating: record.rating,
        rating_deviation: record.ratingDeviation,
        volatility: record.volatility,
        games_played: record.gamesPlayed,
        provisional: record.provisional,
        updated_at: record.updatedAt,
      },
      { onConflict: 'user_id,bucket_id' },
    );

    if (error) {
      throw new Error(`Failed to save rating: ${error.message}`);
    }
  },
});

export type SupabaseRatingStore = ReturnType<typeof createSupabaseRatingStore>;
