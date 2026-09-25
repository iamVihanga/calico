// ISBN → book details (plan §8.3). Logic in handler.ts.
import { requireUser } from '../_shared/auth.ts';

import { handle } from './handler.ts';

Deno.serve((req) => handle(req, { requireUser, fetch, env: (k) => Deno.env.get(k) }));
