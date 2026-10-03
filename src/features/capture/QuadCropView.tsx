import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedProps, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Button } from '@/components/ds/Button';
import { Icon } from '@/components/ds/Icon';
import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { copy } from '@/i18n/en';
import { rotatedSize } from '@/lib/images';
import { alpha, palette, useTheme } from '@/theme';

import {
  clampPt,
  containedRect,
  initialCropBox,
  isConvex,
  type Quad,
  type Rect,
  rectQuad,
  viewQuadToImage,
} from './logic';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const CORNERS = ['tl', 'tr', 'br', 'bl'] as const;
const HIT = 48;
const DOT = 26;
const LOUPE = 112;
const ZOOM = 2;

export type CropResult = { quad: Quad; rotation: number; size: { width: number; height: number } };

type Props = {
  uri: string;
  /** Image size before rotation. */
  width: number;
  height: number;
  /** Where the corners start: the camera's 2:3 cover guide, or the whole photo (a picked photo). */
  start: 'cover' | 'whole';
  busy: boolean;
  cancelLabel: string;
  onCancel: () => void;
  onUse: (r: CropResult) => void;
};

const startQuad = (shown: Rect, start: Props['start']): Quad =>
  start === 'cover'
    ? rectQuad(initialCropBox(shown))
    : rectQuad({
        x: shown.x + shown.width * 0.04,
        y: shown.y + shown.height * 0.04,
        width: shown.width * 0.92,
        height: shown.height * 0.92,
      });

/**
 * Four free corners over the photo (like a document scanner): drag each to a corner of the cover; a
 * magnifier shows the spot under the finger. The result is straightened by `straightenCover`.
 */
export function QuadCropView({ uri, width, height, start, busy, cancelLabel, onCancel, onUse }: Props) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<{ width: number; height: number } | null>(null);
  const [rotation, setRotation] = useState(0);
  // Shown in place of the hint (a toast would sit under the full-screen crop).
  const [crossed, setCrossed] = useState(false);
  const size = rotatedSize(width, height, rotation);
  const shown = view ? containedRect(view, size) : null;

  const quad = useSharedValue<Quad>(rectQuad({ x: 0, y: 0, width: 0, height: 0 }));
  const bounds = useSharedValue<Rect>({ x: 0, y: 0, width: 0, height: 0 });
  const from = useSharedValue({ x: 0, y: 0 });
  const active = useSharedValue(-1);
  const area = useSharedValue({ width: 0, height: 0 });

  const reset = (v: { width: number; height: number }, rot: number, how: Props['start']) => {
    setCrossed(false);
    const s = containedRect(v, rotatedSize(width, height, rot));
    bounds.value = s;
    quad.value = startQuad(s, how);
  };

  const onLayout = (e: LayoutChangeEvent) => {
    const v = { width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height };
    setView(v);
    area.value = v;
    reset(v, rotation, start);
  };

  const drag = (i: number) =>
    Gesture.Pan()
      .withTestId(`crop-drag-${CORNERS[i]}`)
      .minDistance(0)
      .onStart(() => {
        from.value = quad.value[i]!;
        active.value = i;
      })
      .onUpdate((e) => {
        const next = [...quad.value] as Quad;
        next[i] = clampPt({ x: from.value.x + e.translationX, y: from.value.y + e.translationY }, bounds.value);
        quad.value = next;
      })
      .onFinalize(() => {
        active.value = -1;
      });

  // Dim everything outside the quad (even-odd), and outline it.
  const shade = useAnimatedProps(() => {
    const [a, b, c, d] = quad.value;
    const { width: w, height: h } = area.value;
    return {
      d: `M0 0H${w}V${h}H0Z M${a.x} ${a.y}L${b.x} ${b.y}L${c.x} ${c.y}L${d.x} ${d.y}Z`,
    };
  });
  const outline = useAnimatedProps(() => {
    const [a, b, c, d] = quad.value;
    return { d: `M${a.x} ${a.y}L${b.x} ${b.y}L${c.x} ${c.y}L${d.x} ${d.y}Z` };
  });

  const h0 = useAnimatedStyle(() => cornerAt(quad.value, 0));
  const h1 = useAnimatedStyle(() => cornerAt(quad.value, 1));
  const h2 = useAnimatedStyle(() => cornerAt(quad.value, 2));
  const h3 = useAnimatedStyle(() => cornerAt(quad.value, 3));
  const handleStyles = [h0, h1, h2, h3];

  // The magnifier sits above the finger (below it near the top edge) and shows the area around the corner.
  const loupeStyle = useAnimatedStyle(() => {
    const i = active.value;
    if (i < 0) return { opacity: 0, left: 0, top: 0 };
    const p = quad.value[i]!;
    const above = p.y - LOUPE - 36;
    return {
      opacity: 1,
      left: Math.min(Math.max(p.x - LOUPE / 2, 0), area.value.width - LOUPE),
      top: above >= 0 ? above : p.y + 36,
    };
  });
  const zoomStyle = useAnimatedStyle(() => {
    const i = Math.max(active.value, 0);
    const p = quad.value[i]!;
    return {
      transform: [{ translateX: LOUPE / 2 - ZOOM * p.x }, { translateY: LOUPE / 2 - ZOOM * p.y }, { scale: ZOOM }],
    };
  });

  const use = () => {
    if (!shown) return;
    const q = quad.value;
    if (!isConvex(q)) {
      setCrossed(true);
      return;
    }
    setCrossed(false);
    onUse({ quad: viewQuadToImage(q, shown, size), rotation, size });
  };

  // The photo, laid out unrotated around the shown rect's centre, then rotated into it.
  const photo = shown && (
    <Image
      source={{ uri }}
      contentFit="fill"
      style={{
        position: 'absolute',
        width: rotation % 180 === 0 ? shown.width : shown.height,
        height: rotation % 180 === 0 ? shown.height : shown.width,
        left: shown.x + shown.width / 2 - (rotation % 180 === 0 ? shown.width : shown.height) / 2,
        top: shown.y + shown.height / 2 - (rotation % 180 === 0 ? shown.height : shown.width) / 2,
        transform: [{ rotate: `${rotation}deg` }],
      }}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.ink, paddingTop: insets.top }} testID="screen-crop">
      <StatusBar style="light" />
      <View
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 }}
      >
        <Press accessibilityRole="button" accessibilityLabel={cancelLabel} onPress={onCancel} style={iconBtn}>
          <Icon name="close" size={22} tint={palette.white} />
        </Press>
        <Txt family="ui" size={16} tint={palette.cream} accessibilityRole="header">
          {copy.capture.cropTitle}
        </Txt>
        <Press
          accessibilityRole="button"
          accessibilityLabel={copy.capture.rotate}
          disabled={busy}
          onPress={() => {
            const r = (rotation + 90) % 360;
            setRotation(r);
            if (view) reset(view, r, 'whole');
          }}
          style={iconBtn}
        >
          <Icon name="rotate_right" size={22} tint={palette.white} />
        </Press>
      </View>
      <Txt
        family="ui"
        size="xs"
        tint={crossed ? palette.white : palette.cream}
        weight={crossed ? 700 : 400}
        align="center"
        style={{ opacity: crossed ? 1 : 0.8, paddingHorizontal: 16 }}
        testID="crop-hint"
      >
        {crossed ? copy.capture.cropCrossed : copy.capture.cropHint}
      </Txt>

      <View style={{ flex: 1, margin: 24 }} onLayout={onLayout} testID="crop-area">
        {photo}
        {shown && view && (
          <>
            <Svg width={view.width} height={view.height} style={StyleSheet.absoluteFill} pointerEvents="none">
              <AnimatedPath animatedProps={shade} fill={alpha.ink56} fillRule="evenodd" />
              <AnimatedPath animatedProps={outline} fill="none" stroke={palette.white} strokeWidth={2} />
            </Svg>
            {CORNERS.map((c, i) => (
              <GestureDetector key={c} gesture={drag(i)}>
                <Animated.View
                  accessibilityLabel={copy.capture.cropHandle(c)}
                  testID={`crop-corner-${c}`}
                  style={[
                    { position: 'absolute', width: HIT, height: HIT, alignItems: 'center', justifyContent: 'center' },
                    handleStyles[i],
                  ]}
                >
                  <View
                    style={{
                      width: DOT,
                      height: DOT,
                      borderRadius: DOT / 2,
                      borderWidth: 2,
                      borderColor: palette.white,
                      backgroundColor: alpha.cream16,
                    }}
                  />
                </Animated.View>
              </GestureDetector>
            ))}
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: 'absolute',
                  width: LOUPE,
                  height: LOUPE,
                  borderRadius: LOUPE / 2,
                  overflow: 'hidden',
                  borderWidth: 2,
                  borderColor: palette.white,
                  backgroundColor: palette.ink,
                },
                loupeStyle,
              ]}
            >
              <Animated.View
                style={[
                  { position: 'absolute', width: view.width, height: view.height, transformOrigin: 'left top' },
                  zoomStyle,
                ]}
              >
                {photo}
              </Animated.View>
              <View style={[styles.cross, { width: 18, height: 2, left: LOUPE / 2 - 9, top: LOUPE / 2 - 1 }]} />
              <View style={[styles.cross, { width: 2, height: 18, left: LOUPE / 2 - 1, top: LOUPE / 2 - 9 }]} />
            </Animated.View>
          </>
        )}
        {busy && (
          <View
            style={[
              StyleSheet.absoluteFill,
              { alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: alpha.ink56 },
            ]}
          >
            <ActivityIndicator color={palette.cream} size="large" />
            <Txt family="ui" size="sm" tint={palette.cream}>
              {copy.capture.straightening}
            </Txt>
          </View>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingBottom: insets.bottom + 32 }}>
        <Button
          variant="ghost"
          block
          disabled={busy}
          style={{ flex: 1, backgroundColor: alpha.cream16, borderColor: t.borderInverse, minHeight: 52 }}
          testID="crop-reset"
          onPress={() => view && reset(view, rotation, rotation === 0 ? start : 'whole')}
        >
          {copy.capture.resetCorners}
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

function cornerAt(q: Quad, i: number) {
  'worklet';
  return { left: q[i]!.x - HIT / 2, top: q[i]!.y - HIT / 2 };
}

const iconBtn = { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' } as const;
const styles = StyleSheet.create({ cross: { position: 'absolute', backgroundColor: palette.white } });
