import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, type LayoutChangeEvent, Linking, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Illustration } from '@/components/calico/Illustration';
import { Icon } from '@/components/ds/Icon';
import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { devSignInAsSeedUser, signInWithGoogle, SignInCancelled } from '@/features/auth/google';
import { copy } from '@/i18n/en';
import { env } from '@/lib/env';
import { palette, radius, shadow, useTheme } from '@/theme';

/** The illustration cluster is drawn at this size (prototype) and scaled down to fit the phone. */
const ART_W = 340;
const ART_H = 446;
const coverShadow = { filter: 'drop-shadow(0 7px 14px rgba(84,51,46,0.22))' } as const;

/**
 * Prototype `welcome` (design/v2): a reader at her bookshelf, "People who read / live different lives."
 * The prototype's icon + wordmark row is left out: on the phone it crowded the status bar and the art.
 */
export default function Welcome() {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [scale, setScale] = useState(1);

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

  const fit = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setScale(Math.min(1, width / ART_W, height / ART_H));
  };

  const link = (label: string, url: string | undefined) =>
    url ? (
      <Press accessibilityRole="link" onPress={() => void Linking.openURL(url)} hitSlop={8}>
        <Txt family="ui" size="2xs" color="textMuted">
          {label}
        </Txt>
      </Press>
    ) : (
      <Txt family="ui" size="2xs" color="textMuted">
        {label}
      </Txt>
    );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.surfacePage }}
      contentContainerStyle={{
        flexGrow: 1,
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 28,
        paddingHorizontal: 26,
      }}
      testID="screen-welcome"
    >
      <StatusBar style={t.statusBarStyle} />

      <View style={{ flex: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center' }} onLayout={fit}>
        <View style={{ width: ART_W, height: ART_H, transform: [{ scale }] }}>
          <Illustration
            name="bookshelf"
            width={238}
            style={{ position: 'absolute', left: (ART_W - 238) / 2, top: 0 }}
          />
          <Illustration
            name="girl-reading"
            width={172}
            accessibilityLabel={copy.art.reader}
            style={{
              position: 'absolute',
              left: (ART_W - 172) / 2,
              top: 38,
              filter: 'drop-shadow(0 14px 24px rgba(84,51,46,0.2))',
            }}
          />
          <Illustration
            name="cover-midnight"
            width={70}
            rotate={-9}
            style={{ position: 'absolute', left: -4, top: 54, ...coverShadow }}
          />
          <Illustration
            name="cover-atlas"
            width={66}
            rotate={8}
            style={{ position: 'absolute', right: -4, top: 30, ...coverShadow }}
          />
          <Illustration
            name="cover-brighter"
            width={62}
            rotate={7}
            style={{ position: 'absolute', right: -2, bottom: 22, ...coverShadow }}
          />
          <Illustration name="strokes" width={34} style={{ position: 'absolute', left: 58, top: 0 }} />
          <Illustration name="star" width={14} style={{ position: 'absolute', right: 94, top: 10, opacity: 0.75 }} />
          <Illustration name="asterisk" width={30} float={6000} style={{ position: 'absolute', left: 0, top: 196 }} />
          <Illustration name="moon" width={34} style={{ position: 'absolute', right: 2, top: 170 }} />
          <Illustration name="flower" width={32} style={{ position: 'absolute', left: 4, bottom: 134 }} />
          <Illustration name="sprout" width={30} style={{ position: 'absolute', left: 46, bottom: -4 }} />
          <Illustration name="dots" width={38} style={{ position: 'absolute', right: 66, bottom: 2 }} />
        </View>
      </View>

      <View style={{ paddingTop: 22 }}>
        <Txt
          family="display"
          weight={700}
          size={37}
          leading={1.04}
          accessibilityRole="header"
          style={{ letterSpacing: -0.03 * 37 }}
        >
          {copy.welcome.headline}
        </Txt>
        <Txt family="hand" weight={400} size={38} leading={1} color="textAccent" style={{ marginTop: 2 }}>
          {copy.welcome.hand}
        </Txt>
        <Txt family="ui" size={15} leading={1.45} color="textSecondary" style={{ marginTop: 12, maxWidth: 300 }}>
          {copy.welcome.body}
        </Txt>

        {error && (
          <View
            accessibilityRole="alert"
            style={{
              flexDirection: 'row',
              gap: 10,
              alignItems: 'center',
              marginTop: 16,
              paddingVertical: 13,
              paddingHorizontal: 15,
              backgroundColor: t.statusDangerSoft,
              borderRadius: radius.md,
            }}
          >
            <Icon name="error" size={18} tint={t.statusDanger} />
            <Txt family="ui" size="xs" tint={t.inkOnWarm} style={{ flex: 1 }}>
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
            marginTop: 22,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            backgroundColor: t.ctaBg,
            borderRadius: radius.pill,
            boxShadow: shadow.lg,
          }}
        >
          {busy ? (
            <ActivityIndicator color={t.ctaFg} />
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
              <Txt family="ui" weight={700} size="md" tint={t.ctaFg}>
                {copy.welcome.google}
              </Txt>
            </>
          )}
        </Press>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 14 }}>
          {link(copy.welcome.privacy, env.EXPO_PUBLIC_PRIVACY_URL)}
          <Txt family="ui" size="2xs" color="textMuted">
            ·
          </Txt>
          {link(copy.welcome.terms, env.EXPO_PUBLIC_TERMS_URL)}
        </View>
        {__DEV__ && (
          <Press
            accessibilityRole="button"
            testID="dev-sign-in"
            onPress={() => run(devSignInAsSeedUser)}
            style={{ alignSelf: 'center', minHeight: 44, justifyContent: 'center' }}
          >
            <Txt family="ui" weight={600} size="2xs" color="textMuted" style={{ textDecorationLine: 'underline' }}>
              {copy.welcome.devSignIn}
            </Txt>
          </Press>
        )}
      </View>
    </ScrollView>
  );
}
