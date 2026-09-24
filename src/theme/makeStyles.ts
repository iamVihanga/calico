import { useMemo } from 'react';
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';

import type { Theme } from './themes';
import { useTheme } from './ThemeProvider';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

/**
 * `const useStyles = makeStyles((t) => StyleSheet.create({...}))` — styles are built once per theme.
 */
export function makeStyles<T extends NamedStyles<T>>(factory: (t: Theme) => T): () => T {
  const cache = new WeakMap<Theme, T>();
  return function useStyles() {
    const { t } = useTheme();
    return useMemo(() => {
      let s = cache.get(t);
      if (!s) {
        s = factory(t);
        cache.set(t, s);
      }
      return s;
    }, [t]);
  };
}
