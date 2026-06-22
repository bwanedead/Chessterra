/** Maps match service errors to HTTP status codes for API routes. */
export const matchErrorStatus = (message: string): number => {
  if (message.includes('Forbidden')) {
    return 403;
  }
  if (message.includes('please retry')) {
    return 409;
  }
  if (message.includes('signed-in account')) {
    return 403;
  }
  return 400;
};
