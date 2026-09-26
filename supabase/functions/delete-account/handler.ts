import { corsPreflight, errorResponse, HttpError } from '../_shared/http.ts';
import { corsHeaders } from '../_shared/cors.ts';

/** Service-role operations the deletion needs. */
export type AccountAdmin = {
  /** Every object path under `covers/{uid}/`. */
  listCovers: (uid: string) => Promise<string[]>;
  removeCovers: (paths: string[]) => Promise<void>;
  /** Deleting the auth user cascades to every table (plan §7.1). */
  deleteUser: (uid: string) => Promise<void>;
};

export type Deps = { requireUser: (req: Request) => Promise<{ uid: string; admin: AccountAdmin }> };

const BATCH = 100; // storage.remove takes a list; keep requests small

/**
 * POST {} with the user's JWT (plan §8.5): remove the user's cover photos, then the auth user; all
 * rows cascade. 204 on success. The app then signs out locally and clears its cache and reminders.
 */
export async function handle(req: Request, deps: Deps): Promise<Response> {
  if (req.method === 'OPTIONS') return corsPreflight();
  try {
    if (req.method !== 'POST') throw new HttpError(405, 'method_not_allowed');
    const { uid, admin } = await deps.requireUser(req);
    const paths = await admin.listCovers(uid);
    // Never touch anything outside this user's folder, whatever the listing returned.
    const own = paths.filter((p) => p.startsWith(`${uid}/`));
    for (let i = 0; i < own.length; i += BATCH) await admin.removeCovers(own.slice(i, i + BATCH));
    await admin.deleteUser(uid);
    return new Response(null, { status: 204, headers: corsHeaders });
  } catch (e) {
    return errorResponse(e);
  }
}
