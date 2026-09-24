import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';

GoogleSignin.configure({ webClientId: env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID });

export class SignInCancelled extends Error {}

/** Native Google sign-in → Supabase ID-token session (plan §9.3). */
export async function signInWithGoogle(): Promise<void> {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const res = await GoogleSignin.signIn();
    if (!isSuccessResponse(res)) throw new SignInCancelled();
    if (!res.data.idToken) throw new Error('Google returned no ID token');
    const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: res.data.idToken });
    if (error) throw error;
  } catch (e) {
    if (isErrorWithCode(e) && (e.code === statusCodes.SIGN_IN_CANCELLED || e.code === statusCodes.IN_PROGRESS)) {
      throw new SignInCancelled();
    }
    throw e;
  }
}

export async function signOutOfGoogle(): Promise<void> {
  try {
    await GoogleSignin.signOut();
  } catch {
    // not signed in with Google on this device (e.g. dev seed user)
  }
}

/** Local development only: the seed user from supabase/seed.sql. */
export async function devSignInAsSeedUser(): Promise<void> {
  if (!__DEV__) return;
  const { error } = await supabase.auth.signInWithPassword({ email: 'dilan@calico.test', password: 'calico-dev' });
  if (error) throw error;
}
