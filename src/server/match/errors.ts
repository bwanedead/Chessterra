export type MatchServiceErrorCode =
  | 'forbidden'
  | 'version_conflict'
  | 'rated_requires_auth'
  | 'not_found'
  | 'invalid_request'
  | 'illegal_state'
  | 'internal';

export interface MatchServiceError {
  code: MatchServiceErrorCode;
  message: string;
}

export const matchServiceError = (
  code: MatchServiceErrorCode,
  message: string,
): MatchServiceError => ({ code, message });

export const matchErrorStatus = (code: MatchServiceErrorCode): number => {
  switch (code) {
    case 'forbidden':
    case 'rated_requires_auth':
      return 403;
    case 'version_conflict':
      return 409;
    case 'not_found':
      return 404;
    case 'invalid_request':
    case 'illegal_state':
    case 'internal':
    default:
      return 400;
  }
};

export const matchErrorResponse = (error: MatchServiceError) => ({
  error: error.message,
  code: error.code,
});
