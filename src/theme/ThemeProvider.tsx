import { StatusBar } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { storage, storageKeys } from '@/lib/storage';

import { type Theme, type ThemeName, type ThemePreference, themes } from './themes';
import { motion, tokens } from './tokens';
import { type } from './typography';

type ThemeContextValue = {
  t: Theme;
  name: ThemeName;
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  tokens: typeof tokens;
  type: typeof type;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredPreference(): ThemePreference {
  try {
    const v = storage.getString(storageKeys.theme);
    return v === 'night' || v === 'system' ? v : 'day';
  } catch {
    return 'day';
  }
}

type Props = {
  children: ReactNode;
  /** Force a theme (dev gallery, tests). Skips storage. */
  forced?: ThemeName;
};

/**
 * Day / night ("night reading") themes. The preference is mirrored in MMKV so the first frame
 * uses the right paper; `profiles.theme` becomes the source of truth once the profile loads (Phase 1).
 */
export function ThemeProvider({ children, forced }: Props) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>(() => (forced ? forced : readStoredPreference()));

  const name: ThemeName = forced ?? (preference === 'system' ? (system === 'dark' ? 'night' : 'day') : preference);
  const t = themes[name];

  const setPreference = useCallback(
    (p: ThemePreference) => {
      setPreferenceState(p);
      if (!forced) storage.set(storageKeys.theme, p);
    },
    [forced],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ t, name, preference, setPreference, tokens, type }),
    [t, name, preference, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
      {!forced && (
        <>
          <StatusBar style={t.statusBarStyle} />
          <NavigationBar style={t.statusBarStyle} />
          <ThemeCrossFade page={t.surfacePage} />
        </>
      )}
    </ThemeContext.Provider>
  );
}

/** Paints the previous paper colour over the screen and fades it out when the theme changes. */
function ThemeCrossFade({ page }: { page: string }) {
  const reduced = useReducedMotion();
  const previous = useRef(page);
  const [from, setFrom] = useState(page);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (previous.current === page) return;
    setFrom(previous.current);
    previous.current = page;
    opacity.value = 1;
    opacity.value = withTiming(0, {
      duration: reduced ? motion.duration.fast : motion.duration.slow,
      easing: Easing.bezier(...motion.easing.cozy),
    });
  }, [page, opacity, reduced]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: from }, style]} />;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
