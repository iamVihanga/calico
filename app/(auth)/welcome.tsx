import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { coverRadius } from '@/components/calico/GeneratedCover';
import { Icon } from '@/components/ds/Icon';
import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { devSignInAsSeedUser, signInWithGoogle, SignInCancelled } from '@/features/auth/google';
import { copy } from '@/i18n/en';
import { alpha, palette, radius, shadow, useTheme } from '@/theme';

/** Prototype `welcome`: forest panel, three fanned covers, Caveat eyebrow, Google button. */
export default function Welcome() {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(false);
    try {
      await fn();
    } catch (e) {
      if (!(e instanceof SignInCancelled)) setError(true);
    } finally {
      setBusy(false);
    }
  };

  const cover = (title: string, bg: string, fg: string, rotate: number, pos: object, big = false) => (
    <View
      style={[
        {
          position: 'absolute',
          width: big ? 108 : 104,
          height: big ? 162 : 150,
          backgroundColor: bg,
          boxShadow: big ? shadow.lg : shadow.cover,
          transform: [{ rotate: `${rotate}deg` }],
          paddingVertical: big ? 16 : 14,
          paddingHorizontal: big ? 13 : 12,
        },
        coverRadius,
        pos,
      ]}
    >
      <Txt family="display" weight={700} size={big ? 17 : 15} leading={big ? 1.16 : 1.2} tint={fg}>
        {title}
      </Txt>
      {big && (
        <Txt family="hand" weight={400} size={15} tint={fg} style={{ marginTop: 8, opacity: 0.8 }}>
          {copy.welcome.covers.centreAuthor}
        </Txt>
      )}
    </View>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.panel2 }}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: 'space-between',
        paddingTop: insets.top + 30,
        paddingBottom: insets.bottom + 36,
        paddingHorizontal: 28,
        experimental_backgroundImage: `linear-gradient(175deg, ${t.panel2} 0%, ${t.welcomeEnd} 100%)`,
      }}
    >
      <StatusBar style="light" />
      <View style={{ flex: 1, justifyContent: 'center', gap: 40 }}>
        <View
          style={{ height: 210, alignItems: 'center', justifyContent: 'center' }}
          importantForAccessibility="no-hide-descendants"
        >
          <View style={{ width: 250, height: 196 }}>
            {cover(copy.welcome.covers.left, palette.petal, palette.espresso, -9, { left: 0, top: 26 })}
            {cover(copy.welcome.covers.right, palette.biscuit, palette.espresso, 8, { right: 0, top: 20 })}
            {cover(copy.welcome.covers.centre, palette.marmalade, t.textOnAccent, 0, { left: 73, top: 0 }, true)}
            <View
              style={{
                position: 'absolute',
                left: 96,
                bottom: -6,
                width: 62,
                height: 9,
                borderRadius: radius.pill,
                backgroundColor: alpha.black28,
                filter: [{ blur: 4 }],
              }}
            />
          </View>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Txt family="hand" weight={400} size={26} leading={1} tint={t.accentSecondary} align="center">
            {copy.welcome.eyebrow}
          </Txt>
          <Txt
            family="display"
            weight={700}
            size={60}
            leading={1.02}
            tint={t.textInverse}
            align="center"
            accessibilityRole="header"
            style={{ letterSpacing: -0.03 * 60, marginTop: 6 }}
          >
            {copy.welcome.title}
          </Txt>
          <Txt
            family="ui"
            size={16}
            leading={1.45}
            tint={t.textInverseMuted}
            align="center"
            style={{ marginTop: 14, maxWidth: 262 }}
          >
            {copy.welcome.body}
          </Txt>
        </View>
      </View>

      <View style={{ gap: 18, marginTop: 32 }}>
        {error && (
          <View
            accessibilityRole="alert"
            style={{
              flexDirection: 'row',
              gap: 10,
              alignItems: 'center',
              paddingVertical: 13,
              paddingHorizontal: 15,
              backgroundColor: alpha.cream16,
              borderWidth: 1,
              borderColor: t.borderInverse,
              borderRadius: radius.md,
            }}
          >
            <Icon name="error" size={18} tint={t.accentSecondary} />
            <Txt family="ui" size="xs" tint={t.textInverse} style={{ flex: 1 }}>
              {copy.welcome.error}
            </Txt>
          </View>
        )}
        <Press
          accessibilityRole="button"
          accessibilityLabel={copy.welcome.google}
          accessibilityState={{ busy }}
          testID="sign-in-google"
          disabled={busy}
          scaleTo={0.98}
          onPress={() => run(signInWithGoogle)}
          style={{
            minHeight: 58,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            backgroundColor: t.accentPrimary,
            borderRadius: radius.pill,
            boxShadow: shadow.lg,
          }}
        >
          {busy ? (
            <ActivityIndicator color={t.textOnAccent} />
          ) : (
            <>
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: palette.white,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Txt family="ui" weight={700} size={14} leading={1.2} tint={palette.espresso}>
                  {copy.welcome.googleBadge}
                </Txt>
              </View>
              <Txt family="ui" weight={700} size="md" tint={t.textOnAccent}>
                {copy.welcome.google}
              </Txt>
            </>
          )}
        </Press>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 22 }}>
          <Txt family="ui" size="2xs" tint={t.textInverseMuted}>
            {copy.welcome.privacy}
          </Txt>
          <Txt family="ui" size="2xs" tint={t.textInverseMuted}>
            ·
          </Txt>
          <Txt family="ui" size="2xs" tint={t.textInverseMuted}>
            {copy.welcome.terms}
          </Txt>
        </View>
        {__DEV__ && (
          <Press
            accessibilityRole="button"
            testID="dev-sign-in"
            onPress={() => run(devSignInAsSeedUser)}
            style={{ alignSelf: 'center', minHeight: 44, justifyContent: 'center' }}
          >
            <Txt
              family="ui"
              weight={600}
              size="2xs"
              tint={t.textInverseMuted}
              style={{ textDecorationLine: 'underline' }}
            >
              {copy.welcome.devSignIn}
            </Txt>
          </Press>
        )}
      </View>
    </ScrollView>
  );
}
