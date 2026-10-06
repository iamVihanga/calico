import { Platform, TurboModuleRegistry } from 'react-native';

import { storage, storageKeys } from '@/lib/storage';
import { isThemePalette, type ThemePalette, type ThemePreference } from '@/theme/themes';

import type { WidgetSnapshot } from './logic';

/**
 * Builds without the widget module (older binaries getting this JS by update) skip widgets entirely.
 * Nothing that imports `react-native-android-widget` may load before this says yes.
 */
export const widgetsAvailable = () => Platform.OS === 'android' && TurboModuleRegistry.get('AndroidWidget') != null;

/** Nothing saved yet (signed in, app not synced): the empty states, which say "Open Calico". */
const EMPTY: WidgetSnapshot = { signedIn: true, reading: null, next: null, due: null };

export function readSnapshot(): WidgetSnapshot {
  try {
    const raw = storage.getString(storageKeys.widgets);
    return raw ? (JSON.parse(raw) as WidgetSnapshot) : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function saveSnapshot(s: WidgetSnapshot) {
  storage.set(storageKeys.widgets, JSON.stringify(s));
}

export function themePreference(): ThemePreference {
  const v = storage.getString(storageKeys.theme);
  return v === 'night' || v === 'system' ? v : 'day';
}

/** Settings → Theme, as the app last saved it (Forest when unknown). */
export function themePalette(): ThemePalette {
  const v = storage.getString(storageKeys.themePalette);
  return isThemePalette(v) ? v : 'forest';
}
