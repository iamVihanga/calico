import type { WidgetRepresentation } from 'react-native-android-widget';

import type { LocalDate } from '@/lib/dates';
import { type ThemePalette, themes, type ThemePreference } from '@/theme/themes';

import type { WidgetName, WidgetSnapshot } from './logic';
import { themePalette, themePreference } from './store';
import { ContinueReadingWidget, DueSoonWidget, NextEpisodeWidget } from './widgets';

function draw(name: WidgetName, s: WidgetSnapshot, theme: 'day' | 'night', palette: ThemePalette, today: LocalDate) {
  const t = themes[palette][theme];
  if (name === 'ContinueReading')
    return <ContinueReadingWidget data={s.reading} signedIn={s.signedIn} t={t} today={today} />;
  if (name === 'NextEpisode') return <NextEpisodeWidget data={s.next} signedIn={s.signedIn} t={t} today={today} />;
  return <DueSoonWidget data={s.due} signedIn={s.signedIn} t={t} today={today} />;
}

/** The app's theme choice (colour family and night reading); "system" gives Android both and it picks. */
export function representation(
  name: WidgetName,
  s: WidgetSnapshot,
  today: LocalDate,
  pref: ThemePreference = themePreference(),
  palette: ThemePalette = themePalette(),
): WidgetRepresentation {
  if (pref === 'system')
    return { light: draw(name, s, 'day', palette, today), dark: draw(name, s, 'night', palette, today) };
  return draw(name, s, pref, palette, today);
}
