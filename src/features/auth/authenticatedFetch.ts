export interface AuthenticatedFetchOptions extends RequestInit {
  playerId?: string | null;
}

/**
 * Fetch wrapper for Endgame API routes.
 * Sends session cookies and optional guest X-Player-Id fallback.
 */
export const authenticatedFetch = (
  input: RequestInfo | URL,
  options: AuthenticatedFetchOptions = {},
): Promise<Response> => {
  const { playerId, headers, ...rest } = options;
  const mergedHeaders = new Headers(headers);

  if (playerId) {
    mergedHeaders.set('X-Player-Id', playerId);
  }

  return fetch(input, {
    ...rest,
    headers: mergedHeaders,
    credentials: 'same-origin',
  });
};
