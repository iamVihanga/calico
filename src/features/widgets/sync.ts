import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import type { Book } from '@/features/books/types';
import type { WatchSession } from '@/features/media/api';
import type { Show, ShowProgress } from '@/features/media/types';
import { colomboToday } from '@/lib/dates';
import { qk } from '@/lib/queryKeys';
import { useHourNow } from '@/lib/useHourNow';

import { buildSnapshot, WIDGETS, type WidgetSnapshot } from './logic';
import { readSnapshot, saveSnapshot, themePalette, themePreference, widgetsAvailable } from './store';

const WATCHED = new Set(['items', 'showProgress', 'profile', 'signedUrl', 'watchSessions']);

/** Redraw every placed widget from `s` (no-op without the widget module). */
export function redrawWidgets(s: WidgetSnapshot) {
  if (!widgetsAvailable()) return;
  // Loaded only where the native module exists.
  /* eslint-disable @typescript-eslint/no-require-imports */
  const { requestWidgetUpdate } =
    require('react-native-android-widget') as typeof import('react-native-android-widget');
  const { representation } = require('./render') as typeof import('./render');
  /* eslint-enable @typescript-eslint/no-require-imports */
  const today = colomboToday();
  for (const widgetName of WIDGETS) {
    void requestWidgetUpdate({ widgetName, renderWidget: () => representation(widgetName, s, today) }).catch(
      () => undefined,
    );
  }
}

function snapshotFrom(qc: QueryClient): WidgetSnapshot | null {
  const books = qc.getQueryData<Book[]>(qk.items('book', 'all'));
  const shows = qc.getQueryData<Show[]>(qk.items('show', 'all'));
  const progress = qc.getQueryData<ShowProgress[]>(qk.showProgress());
  if (!books || !shows || !progress) return null; // not loaded yet: keep what the widgets show
  const lead =
    (qc.getQueryData(qk.profile) as { lead_script?: string } | undefined)?.lead_script === 'si' ? 'si' : 'en';
  return buildSnapshot(
    {
      books,
      shows,
      progress,
      lead,
      coverUri: (b) => (b.coverPath ? (qc.getQueryData<string>(qk.signedUrl(b.coverPath)) ?? null) : null),
      sessions: qc.getQueryData<WatchSession[]>(qk.watchSessions) ?? [],
    },
    colomboToday(),
  );
}

/**
 * Keeps the home-screen widgets in step with the app: whenever books, shows, progress or the profile
 * change, the snapshot is rebuilt, saved and the widgets redrawn (only when something changed).
 */
export function useWidgetSync() {
  const qc = useQueryClient();
  // Redraw on the hour too: the Next episode widget follows the time of day.
  const now = useHourNow();
  useEffect(() => {
    if (!widgetsAvailable()) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let drawn = '';
    const push = () => {
      const s = snapshotFrom(qc);
      if (!s) return;
      const key = JSON.stringify(s) + themePreference() + themePalette();
      if (key === drawn) return;
      drawn = key;
      if (JSON.stringify(readSnapshot()) !== JSON.stringify(s)) saveSnapshot(s);
      redrawWidgets(s);
    };
    const later = () => {
      clearTimeout(timer);
      timer = setTimeout(push, 600);
    };
    later();
    const unsubscribe = qc.getQueryCache().subscribe((e) => {
      if (e.type === 'updated' && WATCHED.has(String(e.query.queryKey[0]))) later();
    });
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [qc, now]);
}
