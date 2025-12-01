import createHttpError from 'http-errors';

export function getBearerToken(authHeader?: string): string {
  if (!authHeader) throw createHttpError(401, 'Missing Authorization header');
  const [type, token] = authHeader.split(' ');
  if (type !== 'Bearer' || !token) throw createHttpError(401, 'Invalid Authorization header');
  return token;
}
