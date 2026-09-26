/**
 * What Calico sends to Sentry (privacy policy: "crash data"): stack traces, device and app
 * version, the screen path and the anonymous user id. Never book titles, search terms, notes,
 * emails or signed cover URLs. These pure helpers strip them before an event leaves the phone.
 */

type Crumb = { category?: string; message?: string; data?: Record<string, unknown> };
type Ev = {
  request?: { url?: string; query_string?: unknown; cookies?: unknown; headers?: unknown; data?: unknown };
  user?: { id?: string | number; [k: string]: unknown };
  breadcrumbs?: Crumb[];
};

/** Drop the query string and fragment: PostgREST filters carry search text, storage URLs carry tokens. */
export function scrubUrl(url: string): string {
  const cut = url.search(/[?#]/);
  return cut === -1 ? url : url.slice(0, cut);
}

const URL_KEYS = ['url', 'from', 'to'] as const;

/** Console logs can echo anything (titles, notes); network and navigation crumbs keep only paths. */
export function scrubBreadcrumb<B extends Crumb>(crumb: B): B | null {
  if (crumb.category === 'console') return null;
  if (!crumb.data) return crumb;
  const data = { ...crumb.data };
  for (const k of URL_KEYS) if (typeof data[k] === 'string') data[k] = scrubUrl(data[k] as string);
  delete data.params;
  return { ...crumb, data };
}

export function scrubEvent<E extends Ev>(event: E): E {
  const out = { ...event };
  if (out.request) {
    out.request = { url: out.request.url ? scrubUrl(out.request.url) : undefined };
  }
  if (out.user) out.user = out.user.id === undefined ? undefined : { id: out.user.id };
  if (out.breadcrumbs) {
    out.breadcrumbs = out.breadcrumbs.map(scrubBreadcrumb).filter((b): b is Crumb => b !== null);
  }
  return out;
}
