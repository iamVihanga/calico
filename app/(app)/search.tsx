import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ItemCover } from '@/components/calico/ItemCover';
import { MediaShapeIcon } from '@/components/calico/MediaShapeIcon';
import { Icon, type IconName } from '@/components/ds/Icon';
import { IconButton } from '@/components/ds/IconButton';
import { Press } from '@/components/ds/Press';
import { SearchField } from '@/components/ds/SearchField';
import { Tag } from '@/components/ds/Tag';
import { Txt } from '@/components/ds/Txt';
import { type LibItem, type LibKind, useLibraryItems } from '@/features/library/items';
import { searchLibrary } from '@/features/search/api';
import { itemHref } from '@/features/upnext/QueueRowView';
import { copy } from '@/i18n/en';
import { qk } from '@/lib/queryKeys';
import { storage, storageKeys } from '@/lib/storage';
import { useDebounced } from '@/lib/useDebounced';
import { layout, radius, shadow, size, tracking, useTheme } from '@/theme';

type Filter = 'all' | LibKind | 'loan';
const RECENT_MAX = 8;
const KINDS: LibKind[] = ['book', 'movie', 'show'];

const readRecent = (): string[] => {
  try {
    return JSON.parse(storage.getString(storageKeys.recentSearches) ?? '[]') as string[];
  } catch {
    return [];
  }
};
const remember = (q: string) => {
  const list = [q, ...readRecent().filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, RECENT_MAX);
  storage.set(storageKeys.recentSearches, JSON.stringify(list));
};

/**
 * Global search (plan §11.12): both scripts, titles and authors, grouped by media type. Idle shows the
 * last searches and quick filters; nothing found offers TMDB or adding it as a book.
 */
export default function Search() {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [recent, setRecent] = useState(readRecent);
  const q = useDebounced(text.trim().normalize('NFC'), 250);
  const lib = useLibraryItems();
  const hits = useQuery({
    queryKey: qk.search(q),
    queryFn: () => searchLibrary(q),
    enabled: q.length > 0,
    placeholderData: keepPreviousData,
  });

  const matches = useMemo(() => {
    const pass = (i: LibItem) => (filter === 'all' ? true : filter === 'loan' ? !!i.loan : i.kind === filter);
    if (!q) return filter === 'all' ? [] : lib.items.filter(pass);
    return (hits.data ?? []).flatMap((h) => {
      const i = lib.byId.get(h.itemId);
      return i && pass(i) ? [i] : [];
    });
  }, [q, filter, hits.data, lib.items, lib.byId]);

  const open = (i: LibItem) => {
    if (q) remember(q);
    router.push(itemHref(i) as never);
  };
  const idle = !q && filter === 'all';
  const none = !!q && hits.isFetched && !hits.isFetching && matches.length === 0;

  const action = (icon: IconName, label: string, run: () => void, testID: string) => (
    <Press
      accessibilityRole="button"
      testID={testID}
      onPress={run}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 54,
        paddingHorizontal: 16,
        backgroundColor: t.surfaceCard,
        borderRadius: radius.lg,
        boxShadow: shadow.sm,
      }}
    >
      <Icon name={icon} size={20} color="textAccent" />
      <Txt family="ui" weight={600} size={15} style={{ flex: 1 }} numberOfLines={1}>
        {label}
      </Txt>
    </Press>
  );
  const label = (s: string) => (
    <Txt
      family="ui"
      weight={700}
      size={10}
      color="textMuted"
      style={{ letterSpacing: tracking.caps * size['3xs'], paddingVertical: 10 }}
    >
      {s}
    </Txt>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.surfacePage, paddingTop: insets.top + 10 }} testID="screen-search">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14 }}>
        <IconButton icon="arrow_back" label={copy.books.back} onPress={() => router.back()} />
        <SearchField
          value={text}
          onChange={setText}
          onClear={() => setText('')}
          placeholder={copy.globalSearch.placeholder}
          autoFocus
          returnKeyType="search"
          onSubmitEditing={() => q && remember(q)}
          testID="search-query"
          style={{ flex: 1 }}
        />
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            paddingHorizontal: layout.gutterScreen,
            paddingTop: 12,
            paddingBottom: 18,
          }}
        >
          {(['all', 'book', 'movie', 'show', 'loan'] as const).map((f) => (
            <Tag key={f} selected={filter === f} onPress={() => setFilter(f)} testID={`search-filter-${f}`}>
              {copy.globalSearch.filters[f]}
            </Tag>
          ))}
        </View>

        {idle && recent.length > 0 && (
          <View style={{ paddingHorizontal: layout.gutterScreen }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              {label(copy.globalSearch.recent)}
              <Press
                accessibilityRole="button"
                onPress={() => {
                  storage.set(storageKeys.recentSearches, '[]');
                  setRecent([]);
                }}
                style={{ minHeight: 44, justifyContent: 'center' }}
              >
                <Txt family="ui" weight={600} size="2xs" color="textMuted">
                  {copy.globalSearch.clearRecent}
                </Txt>
              </Press>
            </View>
            <View
              style={{
                backgroundColor: t.surfaceCard,
                borderRadius: radius.lg,
                boxShadow: shadow.sm,
                overflow: 'hidden',
              }}
            >
              {recent.map((r, i) => (
                <Press
                  key={r}
                  accessibilityRole="button"
                  onPress={() => setText(r)}
                  scaleTo={1}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    minHeight: 52,
                    paddingHorizontal: 16,
                    borderBottomWidth: i < recent.length - 1 ? 1 : 0,
                    borderBottomColor: t.borderHairline,
                  }}
                >
                  <Icon name="history" size={18} color="textMuted" />
                  <Txt family="ui" size={15}>
                    {r}
                  </Txt>
                </Press>
              ))}
            </View>
          </View>
        )}

        {KINDS.map((k) => {
          const rows = matches.filter((m) => m.kind === k);
          if (!rows.length) return null;
          return (
            <View
              key={k}
              style={{ paddingHorizontal: layout.gutterScreen, paddingBottom: 20 }}
              testID={`search-group-${k}`}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MediaShapeIcon kind={k} color="textMuted" />
                {label(copy.globalSearch.groups[k])}
              </View>
              <View
                style={{
                  backgroundColor: t.surfaceCard,
                  borderRadius: radius.lg,
                  boxShadow: shadow.sm,
                  overflow: 'hidden',
                }}
              >
                {rows.map((m, i) => (
                  <Press
                    key={m.id}
                    accessibilityRole="button"
                    accessibilityLabel={[m.title, m.sub, copy.media[m.kind]].filter(Boolean).join(', ')}
                    testID={`search-hit-${m.id}`}
                    onPress={() => open(m)}
                    scaleTo={1}
                    pressedStyle={{ backgroundColor: t.surfaceQuiet }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 14,
                      minHeight: 64,
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderBottomWidth: i < rows.length - 1 ? 1 : 0,
                      borderBottomColor: t.borderHairline,
                    }}
                  >
                    <ItemCover item={m} width={32} titleSize={5} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Txt family="ui" weight={600} size={15} numberOfLines={1}>
                        {m.title}
                      </Txt>
                      <Txt family="ui" size="2xs" color="textMuted" numberOfLines={1} style={{ minHeight: 18 }}>
                        {m.sub}
                      </Txt>
                    </View>
                  </Press>
                ))}
              </View>
            </View>
          );
        })}

        {none && (
          <View style={{ paddingHorizontal: layout.gutterScreen, gap: 10 }}>
            <Txt family="hand" weight={400} size={21} color="textMuted" style={{ paddingTop: 10, paddingBottom: 8 }}>
              {copy.globalSearch.nothing(q)}
            </Txt>
            {action(
              'travel_explore',
              copy.globalSearch.tmdb(q),
              () => router.push({ pathname: '/tmdb', params: { q } }),
              'search-tmdb',
            )}
            {action(
              'photo_camera',
              copy.globalSearch.addBook(q),
              () => router.push({ pathname: '/capture/review', params: { title: q } }),
              'search-add-book',
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
