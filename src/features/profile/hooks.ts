import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

import { requestReminderSync } from '@/features/loans/reminders';
import { copy } from '@/i18n/en';
import { mk } from '@/lib/mutations';
import { qk } from '@/lib/queryKeys';
import { toast } from '@/lib/stores/toast';
import { type ThemePreference, useTheme } from '@/theme';

import { fetchProfile, type Profile, type ProfilePatch } from './api';

export function useProfile() {
  return useQuery({ queryKey: qk.profile, queryFn: fetchProfile });
}

/** Optimistic profile update (mutationFn registered in lib/mutations.ts). */
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation<void, Error, ProfilePatch, { prev?: Profile }>({
    mutationKey: mk.profileUpdate,
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: qk.profile });
      const prev = qc.getQueryData<Profile>(qk.profile);
      if (prev) qc.setQueryData<Profile>(qk.profile, { ...prev, ...patch });
      return { prev };
    },
    onError: (_e, _patch, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.profile, ctx.prev);
      toast({ message: copy.errors.saveFailed });
    },
    onSettled: (_d, _e, patch) => {
      if (REMINDER_FIELDS.some((k) => k in patch)) requestReminderSync();
      return qc.invalidateQueries({ queryKey: qk.profile });
    },
  });
}

/** Profile fields that change what or when reminders fire (plan §9.5). */
const REMINDER_FIELDS = ['reminder_time', 'remind_3d', 'remind_1d', 'lead_script'] as const;

/** Change night reading: instant locally, saved to the profile (queued when offline). */
export function useSetTheme() {
  const { setPreference } = useTheme();
  const update = useUpdateProfile();
  return useCallback(
    (pref: ThemePreference, { announce = false } = {}) => {
      setPreference(pref);
      update.mutate({ theme: pref });
      if (announce) {
        toast({
          message: pref === 'night' ? copy.theme.nightOn : copy.theme.nightOff,
          action: { label: copy.common.dismiss, onPress: () => undefined },
        });
      }
    },
    [setPreference, update],
  );
}

/** `profiles.theme` is the source of truth once loaded; MMKV only mirrors it for the first frame. */
export function useProfileThemeSync() {
  const { data } = useProfile();
  const { preference, setPreference } = useTheme();
  const pending = useIsMutating({ mutationKey: mk.profileUpdate });
  const theme = data?.theme as ThemePreference | undefined;
  useEffect(() => {
    if (theme && pending === 0 && theme !== preference) setPreference(theme);
  }, [theme, pending, preference, setPreference]);
}
