import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { type LayoutChangeEvent, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ds/Button';
import { Icon } from '@/components/ds/Icon';
import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { containedRect, dragBox, initialCropBox, type Rect, viewRectToImage } from '@/features/capture/logic';
import { capture, useCaptureStore } from '@/features/capture/store';
import { copy } from '@/i18n/en';
import { processCover, rotatedSize } from '@/lib/images';
import { alpha, palette, useTheme } from '@/theme';

type Handle = 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r' | 'move';
const HIT = 48;

/** Crop (brief §7.5.2, plan §11/§2: axis-aligned box + rotate; perspective correction deferred). */
export default function Crop() {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const pending = useCaptureStore((s) => s.pending);
  const [view, setView] = useState<{ width: number; height: number } | null>(null);
  const [rotation, setRotation] = useState(0);
  const [busy, setBusy] = useState(false);

  const box = useSharedValue<Rect>({ x: 0, y: 0, width: 0, height: 0 });
  const start = useSharedValue<Rect>({ x: 0, y: 0, width: 0, height: 0 });
  const bounds = useSharedValue<Rect>({ x: 0, y: 0, width: 0, height: 0 });

  const size = pending ? rotatedSize(pending.width, pending.height, rotation) : null;
  const shown = view && size ? containedRect(view, size) : null;

  const reset = (v: { width: number; height: number }, rot: number) => {
    if (!pending) return;
    const s = containedRect(v, rotatedSize(pending.width, pending.height, rot));
    bounds.value = s;
    box.value = initialCropBox(s);
  };

  const onLayout = (e: LayoutChangeEvent) => {
    const v = { width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height };
    setView(v);
    reset(v, rotation);
  };

  const pan = (handle: Handle) =>
    Gesture.Pan()
      .minDistance(0)
      .onStart(() => {
        start.value = box.value;
      })
      .onUpdate((e) => {
        box.value = dragBox(start.value, handle, e.translationX, e.translationY, bounds.value);
      });

  const boxStyle = useAnimatedStyle(() => ({
    left: box.value.x,
    top: box.value.y,
    width: box.value.width,
    height: box.value.height,
  }));

  // Nothing to crop (e.g. restored after the app was killed): go back to the camera.
  useEffect(() => {
    if (!pending) router.back();
  }, [pending]);
  if (!pending) return null;

  const use = async () => {
    if (!view || !size) return;
    setBusy(true);
    try {
      const crop = viewRectToImage(box.value, view, size);
      const out = await processCover(pending.uri, rotation, crop);
      const side = pending.side;
      capture().patch({ [side]: out.uri, pending: null, extraction: side === 'front' ? null : capture().extraction });
      // Front → read the cover. Back (from Review) → read both again.
      router.replace('/capture/reading');
    } finally {
      setBusy(false);
    }
  };

  const corner = (h: 'tl' | 'tr' | 'bl' | 'br') => {
    const top = h[0] === 't';
    const left = h[1] === 'l';
    return (
      <GestureDetector key={h} gesture={pan(h)}>
        <View
          accessibilityLabel={copy.capture.cropHandle(h)}
          style={{
            position: 'absolute',
            width: HIT,
            height: HIT,
            [top ? 'top' : 'bottom']: -HIT / 2 + 11,
            [left ? 'left' : 'right']: -HIT / 2 + 11,
            alignItems: left ? 'flex-start' : 'flex-end',
            justifyContent: top ? 'flex-start' : 'flex-end',
          }}
        >
          <View
            style={{
              width: 26,
              height: 26,
              margin: HIT / 2 - 13,
              [top ? 'borderTopWidth' : 'borderBottomWidth']: 4,
              [left ? 'borderLeftWidth' : 'borderRightWidth']: 4,
              borderColor: palette.white,
            }}
          />
        </View>
      </GestureDetector>
    );
  };

  const edge = (h: 't' | 'b' | 'l' | 'r') => {
    const vertical = h === 't' || h === 'b';
    return (
      <GestureDetector key={h} gesture={pan(h)}>
        <View
          style={{
            position: 'absolute',
            ...(vertical
              ? { left: HIT, right: HIT, height: HIT, [h === 't' ? 'top' : 'bottom']: -HIT / 2 }
              : { top: HIT, bottom: HIT, width: HIT, [h === 'l' ? 'left' : 'right']: -HIT / 2 }),
          }}
        />
      </GestureDetector>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.ink, paddingTop: insets.top }} testID="screen-crop">
      <StatusBar style="light" />
      <View
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 }}
      >
        <Press
          accessibilityRole="button"
          accessibilityLabel={copy.books.back}
          onPress={() => router.back()}
          style={iconBtn}
        >
          <Icon name="arrow_back" size={22} tint={palette.white} />
        </Press>
        <Txt family="ui" size={16} tint={palette.cream} accessibilityRole="header">
          {copy.capture.cropTitle}
        </Txt>
        <Press
          accessibilityRole="button"
          accessibilityLabel={copy.capture.rotate}
          onPress={() => {
            const r = (rotation + 90) % 360;
            setRotation(r);
            if (view) reset(view, r);
          }}
          style={iconBtn}
        >
          <Icon name="rotate_right" size={22} tint={palette.white} />
        </Press>
      </View>

      <View style={{ flex: 1, margin: 20 }} onLayout={onLayout}>
        {shown && (
          <>
            <Image
              source={{ uri: pending.uri }}
              contentFit="fill"
              style={{
                position: 'absolute',
                // The image is laid out unrotated, centred on the shown rect, then rotated into it.
                width: rotation % 180 === 0 ? shown.width : shown.height,
                height: rotation % 180 === 0 ? shown.height : shown.width,
                left: shown.x + shown.width / 2 - (rotation % 180 === 0 ? shown.width : shown.height) / 2,
                top: shown.y + shown.height / 2 - (rotation % 180 === 0 ? shown.height : shown.width) / 2,
                transform: [{ rotate: `${rotation}deg` }],
              }}
            />
            <GestureDetector gesture={pan('move')}>
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    borderWidth: 1,
                    borderColor: alpha.cream72,
                    boxShadow: `0 0 0 2000px ${alpha.ink56}`,
                  },
                  boxStyle,
                ]}
              >
                {(['t', 'b', 'l', 'r'] as const).map(edge)}
                {(['tl', 'tr', 'bl', 'br'] as const).map(corner)}
              </Animated.View>
            </GestureDetector>
          </>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingBottom: insets.bottom + 32 }}>
        <Button
          variant="ghost"
          block
          style={{ flex: 1, backgroundColor: alpha.cream16, borderColor: t.borderInverse, minHeight: 52 }}
          onPress={() => router.back()}
        >
          {copy.capture.retake}
        </Button>
        <Button
          variant="accent"
          block
          style={{ flex: 1, minHeight: 52 }}
          loading={busy}
          testID="crop-use"
          onPress={use}
        >
          {copy.capture.usePhoto}
        </Button>
      </View>
    </View>
  );
}

const iconBtn = { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' } as const;
