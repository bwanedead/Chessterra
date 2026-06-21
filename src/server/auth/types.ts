import type { UserId } from '@/platform/ids';

export interface RequestActor {
  userId: UserId;
  isGuest: boolean;
  email?: string;
  displayName?: string;
}

export interface UserProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}
