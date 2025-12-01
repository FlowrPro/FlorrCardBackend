import Joi from 'joi';
import createHttpError from 'http-errors';

export function validateBody<T>(schema: Joi.ObjectSchema, payload: unknown): T {
  const { value, error } = schema.validate(payload, { abortEarly: false, stripUnknown: true });
  if (error) throw createHttpError(400, `Validation failed: ${error.details.map(d => d.message).join('; ')}`);
  return value as T;
}
