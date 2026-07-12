import { describe, expect, it } from 'vitest';
import { MatchApiError } from '../api/matchApi';
import { describeMatchError, isNetworkError, isVersionConflict } from './matchErrorMessages';

describe('describeMatchError', () => {
  it('maps version_conflict to retry guidance', () => {
    const error = new MatchApiError('Match state changed; please retry', 409, 'version_conflict');
    expect(describeMatchError(error, 'fallback')).toContain('refreshed');
  });

  it('maps forbidden to participant message', () => {
    const error = new MatchApiError('Forbidden', 403, 'forbidden');
    expect(describeMatchError(error, 'fallback')).toBe('You are not a participant in this match.');
  });

  it('maps rated_requires_auth to sign-in message', () => {
    const error = new MatchApiError('Rated games require a signed-in account', 403, 'rated_requires_auth');
    expect(describeMatchError(error, 'fallback')).toBe('Rated games require a signed-in account.');
  });

  it('maps rate_limited to slow-down message', () => {
    const error = new MatchApiError('Too many requests', 429, 'rate_limited');
    expect(describeMatchError(error, 'fallback')).toContain('Too many requests');
  });

  it('maps not_found to expired-link message', () => {
    const error = new MatchApiError('Match not found', 404, 'not_found');
    expect(describeMatchError(error, 'fallback')).toContain('expired');
  });

  it('maps 401 without code to session-expired message', () => {
    const error = new MatchApiError('Unauthorized', 401, null);
    expect(describeMatchError(error, 'fallback')).toContain('Session expired');
  });

  it('keeps server message for illegal moves', () => {
    const error = new MatchApiError('Illegal move', 400, 'illegal_state');
    expect(describeMatchError(error, 'fallback')).toBe('Illegal move');
  });

  it('maps network TypeError to connection message', () => {
    expect(describeMatchError(new TypeError('Failed to fetch'), 'fallback')).toContain('Connection problem');
  });

  it('falls back for unknown errors', () => {
    expect(describeMatchError('weird', 'fallback')).toBe('fallback');
    expect(describeMatchError(new Error(''), 'fallback')).toBe('fallback');
  });
});

describe('error type guards', () => {
  it('detects version conflicts by code', () => {
    expect(isVersionConflict(new MatchApiError('x', 409, 'version_conflict'))).toBe(true);
    expect(isVersionConflict(new MatchApiError('x', 409, 'not_found'))).toBe(false);
    expect(isVersionConflict(new Error('x'))).toBe(false);
  });

  it('detects network errors', () => {
    expect(isNetworkError(new TypeError('Failed to fetch'))).toBe(true);
    expect(isNetworkError(new Error('x'))).toBe(false);
  });
});
