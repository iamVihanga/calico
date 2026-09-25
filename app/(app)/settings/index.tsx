import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { initials } from '@/components/ds/Avatar';
import { Button } from '@/components/ds/Button';
import { IconButton } from '@/components/ds/IconButton';
import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { signOut } from '@/features/auth/signOut';
import { useAuth } from '@/features/auth/AuthProvider';
import { useProfile, useSetTheme } from '@/features/profile/hooks';
import { copy } from '@/i18n/en';
import { radius, shadow, type ThemePreference, useTheme } from '@/theme';

const NEXT_THEME: Record<ThemePreference, ThemePreference> = { day: 'night', night: 'system', system: 'day' };

/** Settings (prototype `settings`). Phase 1: account header, night reading and sign out; the rest is Phase 7. */
export default function Settings() {
  const { t, preference } = useTheme();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const profile = useProfile();
  const setTheme = useSetTheme();
  const [busy, setBusy] = useState(false);
  const name = profile.data?.display_name ?? '';

  const row = (label: string, value: string | undefined, onPress: () => void, testID?: string) => (
    <Press
      key={label}
      accessibilityRole="button"
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

      {group(copy.settings.title, [
        row(
          copy.settings.nightReading,
          copy.settings.themeValue[preference],
          () => setTheme(NEXT_THEME[preference]),
          'setting-night',
        ),
        ...(__DEV__
          ? [
              row(copy.settings.components, undefined, () => router.push('/dev/components')),
              row(copy.dev.notifications, undefined, () => router.push('/dev/notifications')),
            ]
          : []),
      ])}

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
    </ScrollView>
  );
}
