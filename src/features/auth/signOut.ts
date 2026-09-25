import { Directory, Paths } from 'expo-file-system';
import * as Notifications from 'expo-notifications';

import { useDrafts } from '@/features/capture/drafts';
import { persister, queryClient } from '@/lib/queryClient';
import { clearStorageKeepingTheme } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

import { signOutOfGoogle } from './google';

/** Sign out and forget everything local except the theme (plan §9.3). */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut({ scope: 'local' }); // local: works offline, other devices stay signed in
  await signOutOfGoogle();
  queryClient.clear();
  await persister.removeClient();
  clearStorageKeepingTheme();
  useDrafts.getState().set([]);
  try {
    const drafts = new Directory(Paths.document, 'drafts');
    if (drafts.exists) drafts.delete();
  } catch {
    // no capture drafts yet
  }
  await Notifications.cancelAllScheduledNotificationsAsync();
}
