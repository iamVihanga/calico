import { currentUserId, supabase } from '@/lib/supabase';
import type { Tables } from '@/types/db';

export type Profile = Tables<'profiles'>;

/** Fields the user can change from the app. */
export type ProfilePatch = Partial<
  Pick<
    Profile,
    | 'display_name'
    | 'lead_script'
    | 'theme'
    | 'reminder_time'
    | 'remind_3d'
    | 'remind_1d'
    | 'default_loan_days'
    | 'default_library'
    | 'reading_goal'
    | 'include_specials'
  >
>;

export async function fetchProfile(): Promise<Profile> {
  const uid = await currentUserId();
  const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single();
  if (error) throw error;
  return data;
}

/** Single-row write, so the table API is fine (CLAUDE.md). Replays are idempotent. */
export async function updateProfile(patch: ProfilePatch): Promise<void> {
  const uid = await currentUserId();
  const { error } = await supabase.from('profiles').update(patch).eq('id', uid);
  if (error) throw error;
}
