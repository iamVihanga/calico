import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { HttpError } from './http.ts';

const env = (k: string) => Deno.env.get(k);
// Newer projects expose publishable/secret keys; fall back to the legacy names.
const anonKey = () => env('SUPABASE_ANON_KEY') ?? env('SUPABASE_PUBLISHABLE_KEY') ?? '';
const serviceKey = () => env('SUPABASE_SERVICE_ROLE_KEY') ?? env('SUPABASE_SECRET_KEY') ?? '';

export async function requireUser(req: Request): Promise<{ uid: string; userClient: SupabaseClient; admin: SupabaseClient }> {
  const url = env('SUPABASE_URL')!;
  const userClient = createClient(url, anonKey(), {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) throw new HttpError(401, 'unauthorized');
  const admin = createClient(url, serviceKey());
  return { uid: data.user.id, userClient, admin };
}
