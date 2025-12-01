import createHttpError from 'http-errors';
export const Forbidden = (msg = 'Forbidden') => createHttpError(403, msg);
export const NotFound = (msg = 'Not found') => createHttpError(404, msg);
export const Conflict = (msg = 'Conflict') => createHttpError(409, msg);
export const BadRequest = (msg = 'Bad request') => createHttpError(400, msg);
export const Unauthorized = (msg = 'Unauthorized') => createHttpError(401, msg);
