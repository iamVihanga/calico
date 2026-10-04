import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { storage, storageKeys } from '@/lib/storage';

import type { WidgetSnapshot } from '../logic';
import { readSnapshot, saveSnapshot } from '../store';
import { widgetTaskHandler } from '../taskHandler';
import { NextEpisodeWidget } from '../widgets';

const mockMark = jest.fn();
const mockProgress = jest.fn();
jest.mock('@/features/media/api', () => ({
  markEpisodes: (v: unknown) => mockMark(v),
  fetchShowProgress: () => mockProgress(),
}));

const snap: WidgetSnapshot = {
  signedIn: true,
  reading: null,
  due: null,
  next: { showId: 'hotd', title: 'House of the Dragon', season: 2, episode: 6, name: 'Smallfolk', still: null },
};

function run(over: Partial<WidgetTaskHandlerProps>) {
  const renderWidget = jest.fn();
  const props = {
    widgetInfo: { widgetName: 'NextEpisode', widgetId: 1, width: 300, height: 110, screenInfo: {} },
    widgetAction: 'WIDGET_UPDATE',
    renderWidget,
    ...over,
  } as unknown as WidgetTaskHandlerProps;
  return widgetTaskHandler(props).then(
    () => renderWidget.mock.calls[0]?.[0] as { type: unknown; props: { data: unknown } },
  );
}

const tick = {
  widgetAction: 'WIDGET_CLICK',
  clickAction: 'TICK',
  clickActionData: { itemId: 'hotd', season: 2, episode: 6 },
} as const;

/** The widgets draw from the saved snapshot while the app is closed; the episode tick works from there too. */
describe('widget task handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storage.set(storageKeys.theme, 'day');
    saveSnapshot(snap);
  });

  it('draws the widget from the saved snapshot', async () => {
    const drawn = await run({});
    expect(drawn.type).toBe(NextEpisodeWidget);
    expect(drawn.props.data).toEqual(snap.next);
  });

  it('a tick marks the episode, then shows what comes next', async () => {
    mockMark.mockResolvedValue(undefined);
    mockProgress.mockResolvedValue([
      { itemId: 'hotd', next: { season: 2, episode: 7, name: 'The Red Sowing', stillPath: '/s2e7.jpg' } },
    ]);
    const drawn = await run(tick);
    expect(mockMark).toHaveBeenCalledWith({ itemId: 'hotd', season: 2, episodes: [6], watched: true });
    expect(drawn.props.data).toEqual({
      showId: 'hotd',
      title: 'House of the Dragon',
      season: 2,
      episode: 7,
      name: 'The Red Sowing',
      still: 'https://image.tmdb.org/t/p/w780/s2e7.jpg',
    });
    expect(readSnapshot().next?.episode).toBe(7);
  });

  it('offline: the same episode, saying it could not be marked', async () => {
    mockMark.mockRejectedValue(new Error('offline'));
    const drawn = await run(tick);
    expect(drawn.props.data).toEqual({ ...snap.next, failed: true });
  });

  it('"system" theme gives Android a light and a dark version', async () => {
    storage.set(storageKeys.theme, 'system');
    const drawn = (await run({})) as unknown as { light: unknown; dark: unknown };
    expect(drawn.light).toBeTruthy();
    expect(drawn.dark).toBeTruthy();
  });
});
