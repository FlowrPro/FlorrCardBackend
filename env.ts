import dotenv from 'dotenv';
dotenv.config();

const required = (name: string) => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
};

export const env = {
  PORT: parseInt(process.env.PORT || '8080', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  SUPABASE_URL: required('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: required('SUPABASE_SERVICE_ROLE_KEY'),
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  SOCKET_SERVER_SECRET: process.env.SOCKET_SERVER_SECRET || 'not-set'
};
