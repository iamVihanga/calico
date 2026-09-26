import { parseEnv } from '../env';

describe('parseEnv', () => {
  const ok = {
    EXPO_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
    EXPO_PUBLIC_SUPABASE_KEY: 'sb_publishable_x',
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: 'id.apps.googleusercontent.com',
  };

  it('accepts a complete environment', () => {
    expect(parseEnv(ok).EXPO_PUBLIC_SUPABASE_URL).toBe('https://abc.supabase.co');
  });

  it('defaults the app environment and rejects unknown ones', () => {
    expect(parseEnv(ok).EXPO_PUBLIC_APP_ENV).toBe('development');
    expect(parseEnv({ ...ok, EXPO_PUBLIC_APP_ENV: 'production' }).EXPO_PUBLIC_APP_ENV).toBe('production');
    expect(() => parseEnv({ ...ok, EXPO_PUBLIC_APP_ENV: 'staging' })).toThrow(/EXPO_PUBLIC_APP_ENV/);
    expect(() => parseEnv({ ...ok, EXPO_PUBLIC_SENTRY_DSN: 'not a dsn' })).toThrow(/EXPO_PUBLIC_SENTRY_DSN/);
  });

  it('names the missing or invalid keys', () => {
    expect(() =>
      parseEnv({ ...ok, EXPO_PUBLIC_SUPABASE_URL: 'not a url', EXPO_PUBLIC_SUPABASE_KEY: undefined }),
    ).toThrow(/EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_KEY/);
  });
});
