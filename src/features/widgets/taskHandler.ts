import { tmdbImage } from '@shared/tmdb.ts';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { fetchShowProgress, markEpisodes } from '@/features/media/api';
import { colomboToday } from '@/lib/dates';

import { type WidgetName, WIDGETS, type WidgetSnapshot } from './logic';
import { representation } from './render';
import { readSnapshot, saveSnapshot } from './store';

type Tick = { itemId: string; season: number; episode: number };

/**
 * The episode ticked on the widget, marked straight away (the app isn't open), then the widget moves to
 * what `show_progress` says is next. Offline or failed: the same episode with "Couldn't mark it".
 */
export async function tickFromWidget(s: WidgetSnapshot, v: Tick): Promise<WidgetSnapshot> {
  if (!s.next) return s;
  try {
    await markEpisodes({ itemId: v.itemId, season: v.season, episodes: [v.episode], watched: true });
    const row = (await fetchShowProgress()).find((r) => r.itemId === v.itemId);
    const n = row?.next;
    return {
      ...s,
      next: n
        ? {
            showId: v.itemId,
            title: s.next.title,
            season: n.season,
            episode: n.episode,
            name: n.name,
            still: tmdbImage(n.stillPath, 'w780') ?? s.next.still,
          }
        : null,
    };
  } catch {
    return { ...s, next: { ...s.next, failed: true } };
  }
}

/** Runs headless (app closed or open): draws from the saved snapshot; handles the widget's tick. */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps): Promise<void> {
  const name = props.widgetInfo.widgetName as WidgetName;
  if (!WIDGETS.includes(name) || props.widgetAction === 'WIDGET_DELETED') return;
  let s = readSnapshot();
  if (props.widgetAction === 'WIDGET_CLICK' && props.clickAction === 'TICK') {
    s = await tickFromWidget(s, props.clickActionData as Tick);
    saveSnapshot(s);
  }
  props.renderWidget(representation(name, s, colomboToday()));
}
