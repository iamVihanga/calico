import { isBookEan } from '@shared/isbn.ts';
import type { IsbnLookup } from '@shared/extraction.ts';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { ActivityIndicator, Linking, View } from 'react-native';
import Animated, { FadeIn, SlideInDown, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ds/Button';
import { Icon } from '@/components/ds/Icon';
import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { lookupIsbn } from '@/features/capture/api';
import { GUIDE } from '@/features/capture/logic';
import { type CameraMode, capture, useCaptureStore } from '@/features/capture/store';
import { copy } from '@/i18n/en';
import { alpha, motion, palette, radius, shadow, useTheme } from '@/theme';

/**
 * Camera (prototype `camera`, brief §7.5.1). Barcode mode auto-captures EAN-13 978/979 with a valid
 * checksum and looks the ISBN up; cover and back modes use the shutter and go to Crop. Gallery always works.
 */
export default function Camera() {
  const params = useLocalSearchParams<{ mode?: CameraMode; keep?: string }>();
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [permission, requestPermission] = useCameraPermissions();
  const cam = useRef<CameraView>(null);
  const scanned = useRef(false);
  const [mode, setMode] = useState<CameraMode>(params.mode ?? 'cover');
  const [torch, setTorch] = useState(false);
  const [looking, setLooking] = useState(false);
  const [found, setFound] = useState<IsbnLookup | null>(null);
  const [busy, setBusy] = useState(false);
  const isbn = useCaptureStore((s) => s.isbn);

  // A fresh capture starts a new draft (new item id); "back" and "keep" continue the current one.
  useState(() => {
    if (params.mode !== 'back' && params.keep !== '1') capture().start();
    return true;
  });

  const onBarcode = async ({ data }: { data: string }) => {
    if (scanned.current || mode !== 'barcode' || !isBookEan(data)) return;
    scanned.current = true; // fire once per scan
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    capture().patch({ isbn: data });
    setLooking(true);
    try {
      setFound(await lookupIsbn(data));
    } catch {
      setFound({ found: false, isbn: data } as IsbnLookup);
    } finally {
      setLooking(false);
    }
  };

  const toCrop = (uri: string, width: number, height: number) => {
    capture().patch({ pending: { uri, width, height, side: mode === 'back' ? 'back' : 'front' } });
    router.push('/capture/crop');
  };

  const shoot = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const photo = await cam.current?.takePictureAsync({ quality: 0.8 });
      if (photo) toCrop(photo.uri, photo.width, photo.height);
    } finally {
      setBusy(false);
    }
  };

  const fromGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
    const a = res.assets?.[0];
    if (!res.canceled && a) toCrop(a.uri, a.width, a.height);
  };

  const switchMode = (m: CameraMode) => {
    setMode(m);
    setFound(null);
    scanned.current = false;
  };

  if (!permission) return <View style={{ flex: 1, backgroundColor: palette.ink }} />;

  const frame = mode === 'barcode' ? GUIDE.barcode : GUIDE.cover;

  return (
    <View style={{ flex: 1, backgroundColor: palette.ink }} testID="screen-camera">
      <StatusBar style="light" />
      {permission.granted ? (
        <CameraView
          ref={cam}
          style={{ position: 'absolute', inset: 0 }}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: ['ean13'] }}
          onBarcodeScanned={mode === 'barcode' && !found ? onBarcode : undefined}
        />
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingTop: insets.top + 4,
          paddingHorizontal: 8,
        }}
      >
        <Press
          accessibilityRole="button"
          accessibilityLabel={copy.capture.close}
          onPress={() => router.back()}
          style={iconBtn}
        >
          <Icon name="close" size={22} tint={palette.white} />
        </Press>
        <Press
          accessibilityRole="switch"
          accessibilityLabel={copy.capture.torch}
          accessibilityState={{ checked: torch }}
          onPress={() => setTorch((v) => !v)}
          style={iconBtn}
        >
          <Icon name="bolt" size={22} tint={torch ? t.accentSecondary : palette.white} />
        </Press>
      </View>

      {!permission.granted ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 }}>
          <Txt family="display" weight={700} size="xl" tint={palette.cream} align="center">
            {copy.capture.permissionTitle}
          </Txt>
          <Txt family="ui" size="sm" tint={alpha.cream72} align="center">
            {copy.capture.permissionBody}
          </Txt>
          <Button
            variant="accent"
            onPress={() => (permission.canAskAgain ? requestPermission() : Linking.openSettings())}
            style={{ alignSelf: 'center', marginTop: 8 }}
          >
            {permission.canAskAgain ? copy.capture.permissionAllow : copy.capture.permissionSettings}
          </Button>
        </View>
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <View
            accessibilityElementsHidden
            style={{
              width: frame.w,
              height: frame.h,
              borderWidth: 2,
              borderColor: alpha.cream72,
              borderRadius: radius.lg,
              justifyContent: 'flex-end',
              alignItems: 'center',
              padding: 18,
            }}
          >
            <Txt family="hand" weight={400} size={22} tint={alpha.cream72} align="center">
              {copy.capture.hint[mode]}
            </Txt>
          </View>
        </View>
      )}

      {(looking || found) && (
        <Animated.View
          entering={(reduced ? FadeIn : SlideInDown).duration(motion.duration.base)}
          style={{
            marginHorizontal: 16,
            marginBottom: 14,
            padding: 16,
            backgroundColor: t.surfaceCard,
            borderRadius: radius.lg,
            boxShadow: shadow.lg,
          }}
          testID="barcode-card"
        >
          {looking ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }}>
              <ActivityIndicator color={t.accentPrimary} />
              <Txt family="ui" size="sm" color="textSecondary">
                {copy.capture.lookingUp}
              </Txt>
            </View>
          ) : found?.found ? (
            <>
              <Txt role="label" size={10} color="textAccent">
                {copy.capture.found}
              </Txt>
              <Txt family="display" weight={700} size="lg">
                {found.title ?? ''}
              </Txt>
              <Txt family="ui" size="xs" color="textMuted">
                {copy.capture.foundMeta(found.author, found.pages)}
              </Txt>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <Button
                  variant="secondary"
                  block
                  style={{ flex: 1 }}
                  onPress={() => {
                    setFound(null);
                    capture().patch({ isbn: null, lookup: null });
                    scanned.current = false;
                  }}
                >
                  {copy.capture.notIt}
                </Button>
                <Button
                  variant="accent"
                  block
                  style={{ flex: 1 }}
                  testID="barcode-use"
                  onPress={() => {
                    capture().patch({ lookup: found });
                    router.replace({ pathname: '/capture/review', params: { from: 'barcode' } });
                  }}
                >
                  {copy.capture.useThis}
                </Button>
              </View>
            </>
          ) : (
            <>
              <Txt family="ui" weight={600} size="sm">
                {copy.capture.noMatch}
              </Txt>
              <Button variant="accent" block style={{ marginTop: 12 }} onPress={() => switchMode('cover')}>
                {copy.capture.snapCover}
              </Button>
            </>
          )}
        </Animated.View>
      )}

      <View style={{ paddingBottom: insets.bottom + 28 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 26, paddingBottom: 16 }}>
          {(['barcode', 'cover', 'back'] as const).map((m) => (
            <Press
              key={m}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === m }}
              testID={`mode-${m}`}
              onPress={() => switchMode(m)}
              style={{
                minHeight: 44,
                justifyContent: 'center',
                borderBottomWidth: 2,
                borderBottomColor: mode === m ? t.surfaceCard : 'transparent',
                opacity: mode === m ? 1 : 0.6,
              }}
            >
              <Txt family="ui" weight={mode === m ? 600 : 400} size={14} tint={palette.white}>
                {copy.capture.modes[m]}
              </Txt>
            </Press>
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
          <Press
            accessibilityRole="button"
            accessibilityLabel={copy.capture.gallery}
            onPress={fromGallery}
            style={{ alignItems: 'center', gap: 4, minHeight: 48, width: 60 }}
          >
            <Icon name="image" size={22} tint={palette.white} />
            <Txt family="ui" size="2xs" tint={palette.white}>
              {copy.capture.gallery}
            </Txt>
          </Press>
          <Press
            accessibilityRole="button"
            accessibilityLabel={copy.capture.shutter}
            testID="shutter"
            disabled={mode === 'barcode' || busy || !permission.granted}
            onPress={shoot}
            style={{
              width: 74,
              height: 74,
              borderRadius: radius.pill,
              backgroundColor: t.accentPrimary,
              borderWidth: 4,
              borderColor: alpha.cream72,
              boxShadow: shadow.lg,
              opacity: mode === 'barcode' ? 0.4 : 1,
            }}
          />
          <View style={{ width: 60 }}>
            {isbn && mode !== 'barcode' ? <Icon name="check" size={20} tint={t.accentSecondary} /> : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const iconBtn = { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' } as const;
