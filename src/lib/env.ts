import { z } from 'zod';

/**
 * Client environment (safe to ship). Expo inlines `process.env.EXPO_PUBLIC_*` only for static
 * member access, so every key is read explicitly. Server secrets live in Supabase (plan §8.6).
 */
const schema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.url(),
  EXPO_PUBLIC_SUPABASE_KEY: z.string().min(1),
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: z.string().min(1),
  /** Crash reporting is off when unset (and always off in development). */
  EXPO_PUBLIC_SENTRY_DSN: z.url().optional(),
  /** Set per EAS build profile (eas.json); tags Sentry events. */
  EXPO_PUBLIC_APP_ENV: z.enum(['development', 'preview', 'production']).default('development'),
  /** Hosted privacy policy and terms (Play listing needs them; rows are hidden until set). */
  EXPO_PUBLIC_PRIVACY_URL: z.url().optional(),
  EXPO_PUBLIC_TERMS_URL: z.url().optional(),
});

export type Env = z.infer<typeof schema>;

export function parseEnv(raw: Record<string, string | undefined>): Env {
  const result = schema.safeParse(raw);
  if (!result.success) {
    const keys = result.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Invalid environment: ${keys}. Copy .env.example to .env and fill it in.`);
  }
  return result.data;
}

export const env = parseEnv({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_KEY: process.env.EXPO_PUBLIC_SUPABASE_KEY,
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN || undefined,
  EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV || undefined,
  EXPO_PUBLIC_PRIVACY_URL: process.env.EXPO_PUBLIC_PRIVACY_URL || undefined,
  EXPO_PUBLIC_TERMS_URL: process.env.EXPO_PUBLIC_TERMS_URL || undefined,
});
