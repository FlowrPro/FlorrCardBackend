import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

export function supabaseForToken(jwt: string) {
  return createClient(env.SUPABASE_URL, jwt);
}
