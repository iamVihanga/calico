import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

import { requestReminderSync } from '@/features/loans/reminders';
import { copy } from '@/i18n/en';
import { mk } from '@/lib/mutations';
import { qk } from '@/lib/queryKeys';
import { toast } from '@/lib/stores/toast';
import { isThemePalette, type ThemePalette, type ThemePreference, useTheme } from '@/theme';

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

/** Settings → Theme: the colour family, instant locally, saved to the profile (queued when offline). */
export function useSetPalette() {
  const { setPalette } = useTheme();
  const update = useUpdateProfile();
  return useCallback(
    (palette: ThemePalette) => {
      setPalette(palette);
      update.mutate({ palette });
    },
    [setPalette, update],
  );
}

/** `profiles.theme` / `profiles.palette` are the source of truth once loaded; MMKV only mirrors them. */
export function useProfileThemeSync() {
  const { data } = useProfile();
  const { preference, setPreference, palette, setPalette } = useTheme();
  const pending = useIsMutating({ mutationKey: mk.profileUpdate });
  const theme = data?.theme as ThemePreference | undefined;
  const savedPalette = isThemePalette(data?.palette) ? data.palette : undefined;
  useEffect(() => {
    if (theme && pending === 0 && theme !== preference) setPreference(theme);
  }, [theme, pending, preference, setPreference]);
  useEffect(() => {
    if (savedPalette && pending === 0 && savedPalette !== palette) setPalette(savedPalette);
  }, [savedPalette, pending, palette, setPalette]);
}
