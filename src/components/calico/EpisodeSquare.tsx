import { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { copy } from '@/i18n/en';
import { layout, radius, useTheme } from '@/theme';

export type EpisodeState = 'watched' | 'unwatched' | 'next' | 'unaired';

export const EPISODE_SQUARE = 36;
const PULSE_MS = 1800; // prototype `kpulse 1800ms ease-out infinite`

type Props = {
  season: number;
  episode: number;
  name?: string;
  state: EpisodeState;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * One episode in the grid. Watched = marmalade fill, aired = outline with number,
 * next up = outline + pulsing ring (the app's only ambient animation), unaired = dashed, not tappable.
 */
export function EpisodeSquare({ season, episode, name, state, onPress, onLongPress, style }: Props) {
  const { t } = useTheme();
  const reduced = useReducedMotion();
  const pulse = useSharedValue(0);
  const watched = state === 'watched';
  const aired = state !== 'unaired';

  useEffect(() => {
    if (state === 'next' && !reduced) {
      pulse.value = 0;
      pulse.value = withRepeat(withTiming(1, { duration: PULSE_MS, easing: Easing.out(Easing.quad) }), -1, false);
    } else {
      cancelAnimation(pulse);
      pulse.value = 0;
    }
    return () => cancelAnimation(pulse);
  }, [state, reduced, pulse]);

  // 0 → 70%: ring grows 0 → 8dp and fades; 70 → 100%: rest.
  const ring = useAnimatedStyle(() => {
    const p = Math.min(1, pulse.value / 0.7);
    return { transform: [{ scale: 1 + (p * 16) / EPISODE_SQUARE }], opacity: pulse.value < 0.7 ? 0.5 * (1 - p) : 0 };
  });

  const stateLabel = {
    watched: copy.episode.watched,
    unwatched: copy.episode.notWatched,
    next: copy.episode.nextUp,
    unaired: copy.episode.notAired,
  }[state];

  return (
    <Press
      accessibilityRole="checkbox"
      accessibilityState={{ checked: watched, disabled: !aired }}
      accessibilityLabel={copy.episode.a11y(season, episode, name, stateLabel)}
      disabled={!aired}
      onPress={onPress}
      onLongPress={onLongPress}
      hitSlop={(layout.hitMin - EPISODE_SQUARE) / 2}
      style={[{ width: EPISODE_SQUARE, height: EPISODE_SQUARE }, style]}
    >
      {state === 'next' && (
        <Animated.View
          pointerEvents="none"
          style={[
            { position: 'absolute', inset: 0, borderRadius: radius.sm, backgroundColor: t.accentPrimary },
            reduced ? { opacity: 0.25, transform: [{ scale: 1.15 }] } : ring,
          ]}
        />
      )}
      <View
        style={{
          flex: 1,
          borderRadius: radius.sm,
          borderWidth: 1.5,
          borderStyle: aired ? 'solid' : 'dashed',
          borderColor: watched ? t.accentPrimary : aired ? t.borderStrong : t.borderSoft,
          backgroundColor: watched ? t.accentPrimary : t.surfacePage,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {aired && (
          <Txt
            family="ui"
            weight={700}
            size="2xs"
            leading={1}
            tint={watched ? t.textOnAccent : t.textMuted}
            allowFontScaling={false}
          >
            {episode}
          </Txt>
        )}
      </View>
    </Press>
  );
}
