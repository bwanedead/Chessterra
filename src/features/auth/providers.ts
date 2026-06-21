/** OAuth providers enabled in Supabase dashboard. Microsoft = `azure`. */
export type OAuthProvider = 'facebook' | 'azure' | 'google';

export const OAUTH_PROVIDERS: {
  id: OAuthProvider;
  label: string;
}[] = [
  { id: 'azure', label: 'Microsoft' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'google', label: 'Google' },
];

export const getAuthCallbackUrl = (): string => {
  if (typeof window === 'undefined') {
    return '/auth/callback';
  }
  return `${window.location.origin}/auth/callback`;
};
