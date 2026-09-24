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

  it('names the missing or invalid keys', () => {
    expect(() =>
      parseEnv({ ...ok, EXPO_PUBLIC_SUPABASE_URL: 'not a url', EXPO_PUBLIC_SUPABASE_KEY: undefined }),
    ).toThrow(/EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_KEY/);
  });
});
