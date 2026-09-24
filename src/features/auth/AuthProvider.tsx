import type { Session } from '@supabase/supabase-js';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type AuthStatus = 'loading' | 'signedIn' | 'signedOut';
type AuthValue = { status: AuthStatus; session: Session | null };

const AuthContext = createContext<AuthValue>({ status: 'loading', session: null });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<AuthValue>({ status: 'loading', session: null });

  useEffect(() => {
    // Fires INITIAL_SESSION right away with the stored session (works offline).
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setValue({ status: session ? 'signedIn' : 'signedOut', session });
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
