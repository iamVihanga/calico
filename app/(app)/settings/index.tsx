import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { initials } from '@/components/ds/Avatar';
import { Button } from '@/components/ds/Button';
import { IconButton } from '@/components/ds/IconButton';
import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { signOut } from '@/features/auth/signOut';
import { useAuth } from '@/features/auth/AuthProvider';
import { fmtTime } from '@/features/account/logic';
import { useProfile, useSetTheme, useUpdateProfile } from '@/features/profile/hooks';
import { copy } from '@/i18n/en';
import { env } from '@/lib/env';
import { openSheet } from '@/lib/stores/sheet';
import { radius, shadow, type ThemePreference, useTheme } from '@/theme';

const TMDB_URL = 'https://www.themoviedb.org';
const NEXT_THEME: Record<ThemePreference, ThemePreference> = { day: 'night', night: 'system', system: 'day' };

/** Settings (prototype `settings`, plan §11.13): account, reading, reminders, display, data, about, delete. */
export default function Settings() {
  const { t, preference } = useTheme();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const profile = useProfile();
  const setTheme = useSetTheme();
  const [busy, setBusy] = useState(false);
  const name = profile.data?.display_name ?? '';
  const p = profile.data;
  const update = useUpdateProfile();
  const lead = p?.lead_script === 'si' ? 'si' : 'en';
  const onOff = (v: boolean) => (v ? copy.settings.on : copy.settings.off);

  const row = (label: string, value: string | undefined, onPress: () => void, testID?: string, checked?: boolean) => (
    <Press
      key={label}
      accessibilityRole={checked === undefined ? 'button' : 'switch'}
      accessibilityState={checked === undefined ? undefined : { checked }}
      testID={testID}
      onPress={onPress}
      scaleTo={1}
      pressedStyle={{ backgroundColor: t.surfaceQuiet }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        minHeight: 58,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: t.borderHairline,
      }}
    >
      <Txt family="ui" weight={600} size="sm">
        {label}
      </Txt>
      {value !== undefined && (
        <Txt family="ui" weight={600} size={14} color="textAccent" align="right">
          {value}
        </Txt>
      )}
    </Press>
  );

  const group = (label: string, rows: React.ReactNode[]) => (
    <View style={{ paddingHorizontal: 20, paddingBottom: 18 }}>
      <Txt role="label" size={10} color="textMuted" style={{ paddingBottom: 8 }}>
        {label}
      </Txt>
      <View
        style={{ backgroundColor: t.surfaceCard, borderRadius: radius.lg, boxShadow: shadow.sm, overflow: 'hidden' }}
      >
        {rows}
      </View>
    </View>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.surfacePage }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 48 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 }}>
        <IconButton icon="arrow_back" label={copy.settings.back} tone="card" onPress={() => router.back()} />
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          paddingTop: 20,
          paddingHorizontal: 20,
          paddingBottom: 24,
        }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: radius.pill,
            backgroundColor: t.surfaceAccentSoft,
            borderWidth: 1,
            borderColor: t.borderStrong,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Txt family="ui" weight={700} size="lg" tint={t.inkOnWarm}>
            {initials(name)}
          </Txt>
        </View>
        <View style={{ flex: 1 }}>
          <Txt family="display" weight={700} size="xl" style={{ letterSpacing: -0.02 * 24 }} accessibilityRole="header">
            {name}
          </Txt>
          <Txt family="ui" size="xs" color="textMuted">
            {session?.user.email ?? ''}
          </Txt>
        </View>
      </View>

      {group(copy.settings.reading, [
        row(
          copy.settings.goal,
          copy.settings.goalValue(p?.reading_goal ?? null),
          () => openSheet('setting', { field: 'goal' }),
          'setting-goal',
        ),
        row(copy.settings.loanLength, copy.settings.days(p?.default_loan_days ?? 14), () =>
          openSheet('setting', { field: 'loanDays' }),
        ),
        row(copy.settings.library, p?.default_library || copy.settings.notSet, () =>
          openSheet('setting', { field: 'library' }),
        ),
      ])}

      {group(copy.settings.reminders, [
        row(
          copy.settings.reminderTime,
          fmtTime(p?.reminder_time ?? '09:00:00'),
          () => openSheet('setting', { field: 'time' }),
          'setting-time',
        ),
        row(
          copy.settings.remind3d,
          onOff(p?.remind_3d ?? true),
          () => update.mutate({ remind_3d: !(p?.remind_3d ?? true) }),
          'setting-3d',
          p?.remind_3d ?? true,
        ),
        row(
          copy.settings.remind1d,
          onOff(p?.remind_1d ?? true),
          () => update.mutate({ remind_1d: !(p?.remind_1d ?? true) }),
          'setting-1d',
          p?.remind_1d ?? true,
        ),
      ])}

      {group(copy.settings.display, [
        row(
          copy.settings.nightReading,
          copy.settings.themeValue[preference],
          () => setTheme(NEXT_THEME[preference]),
          'setting-night',
        ),
        row(
          copy.settings.leadScript,
          copy.settings.leadValue[lead],
          () => update.mutate({ lead_script: lead === 'si' ? 'en' : 'si' }),
          'setting-lead',
        ),
        row(
          copy.settings.specials,
          onOff(p?.include_specials ?? false),
          () => update.mutate({ include_specials: !(p?.include_specials ?? false) }),
          'setting-specials',
          p?.include_specials ?? false,
        ),
      ])}

      {group(copy.settings.data, [
        row(copy.account.exportTitle, copy.account.exportHint, () => openSheet('export'), 'setting-export'),
      ])}

      {group(copy.settings.about, [
        row(copy.settings.tmdb, undefined, () => void Linking.openURL(TMDB_URL)),
        ...(env.EXPO_PUBLIC_PRIVACY_URL
          ? [row(copy.settings.privacy, undefined, () => void Linking.openURL(env.EXPO_PUBLIC_PRIVACY_URL!))]
          : []),
        ...(env.EXPO_PUBLIC_TERMS_URL
          ? [row(copy.settings.terms, undefined, () => void Linking.openURL(env.EXPO_PUBLIC_TERMS_URL!))]
          : []),
        row(copy.settings.version, Constants.expoConfig?.version ?? '', () => undefined),
        ...(__DEV__
          ? [
              row(copy.settings.components, undefined, () => router.push('/dev/components')),
              row(copy.dev.notifications, undefined, () => router.push('/dev/notifications')),
            ]
          : []),
      ])}
      <Txt family="ui" size="3xs" color="textMuted" style={{ paddingHorizontal: 24, marginTop: -8, marginBottom: 18 }}>
        {copy.settings.tmdbNotice}
      </Txt>

      <View style={{ paddingHorizontal: 20, paddingTop: 6 }}>
        <Button
          variant="secondary"
          block
          loading={busy}
          testID="sign-out"
          onPress={async () => {
            setBusy(true);
            try {
              await signOut();
            } finally {
              setBusy(false);
            }
          }}
        >
          {copy.settings.signOut}
        </Button>
        <Txt family="ui" size="2xs" color="textMuted" align="center" style={{ marginTop: 12 }}>
          {copy.settings.signOutHint}
        </Txt>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
        <Press
          accessibilityRole="button"
          testID="delete-account"
          onPress={() => router.push('/settings/delete')}
          style={{
            minHeight: 52,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radius.pill,
            backgroundColor: t.statusDangerSoft,
          }}
        >
          <Txt family="ui" weight={700} size={15} color="statusDanger">
            {copy.account.deleteRow}
          </Txt>
        </Press>
        <Txt family="ui" size="2xs" color="textMuted" align="center" style={{ marginTop: 12 }}>
          {copy.account.deleteHint}
        </Txt>
      </View>
    </ScrollView>
  );
}
