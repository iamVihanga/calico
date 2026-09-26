import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CollectionMosaic } from '@/components/calico/CollectionMosaic';
import { ItemCover } from '@/components/calico/ItemCover';
import { Button } from '@/components/ds/Button';
import { EmptyState } from '@/components/ds/EmptyState';
import { Icon } from '@/components/ds/Icon';
import { IconButton } from '@/components/ds/IconButton';
import { Press } from '@/components/ds/Press';
import { Tag } from '@/components/ds/Tag';
import { Txt } from '@/components/ds/Txt';
import { useCollection, useSeriesSuggestions } from '@/features/collections/hooks';
import { useLibraryItems } from '@/features/library/items';
import { useAddManyToQueue } from '@/features/upnext/hooks';
import { itemHref } from '@/features/upnext/QueueRowView';
import { copy } from '@/i18n/en';
import { openSheet } from '@/lib/stores/sheet';
import { toast } from '@/lib/stores/toast';
import { layout, radius, useTheme } from '@/theme';

type Filter = 'all' | 'book' | 'movie' | 'show';

/** Collection detail (prototype `collectionDetail`): mosaic, filters, grid, series suggestions, actions. */
export default function CollectionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const q = useCollection(id);
  const lib = useLibraryItems();
  const addAll = useAddManyToQueue();
  const [filter, setFilter] = useState<Filter>('all');
  const c = q.data;
  const members = useMemo(
    () =>
      (c?.items ?? []).flatMap((e) => {
        const i = lib.byId.get(e.itemId);
        return i ? [i] : [];
      }),
    [c, lib.byId],
  );
  const suggestions = useSeriesSuggestions(members, lib.items);

  if (!c) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + 8, backgroundColor: t.surfacePage }}>
        <View style={{ paddingHorizontal: 16 }}>
          <IconButton icon="arrow_back" label={copy.books.back} tone="card" onPress={() => router.back()} />
        </View>
        {q.isFetched && <EmptyState body={copy.books.notFound} />}
      </View>
    );
  }
  const shown = filter === 'all' ? members : members.filter((m) => m.kind === filter);
  const first = suggestions[0];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.surfacePage }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 48 }}
      testID="screen-collection"
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 }}>
        <IconButton icon="arrow_back" label={copy.books.back} tone="card" onPress={() => router.back()} />
        <IconButton
          icon="more_vert"
          label={copy.books.more}
          tone="card"
          onPress={() => openSheet('collectionMenu', { collectionId: c.id })}
        />
      </View>
      <View style={{ paddingTop: 16, paddingHorizontal: layout.gutterScreen }}>
        <CollectionMosaic variant="strip" items={members.slice(0, 4).map((m) => ({ id: m.id, title: m.title }))} />
        <Txt
          family="display"
          weight={700}
          size={28}
          accessibilityRole="header"
          style={{ marginTop: 16, letterSpacing: -0.02 * 28 }}
        >
          {c.name}
        </Txt>
        <Txt family="hand" weight={400} size={19} color="textMuted" style={{ minHeight: 26 }}>
          {c.description ?? ''}
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
          {(['all', 'book', 'movie', 'show'] as const).map((f) => (
            <Tag key={f} selected={filter === f} onPress={() => setFilter(f)}>
              {copy.upNext.filters[f]}
            </Tag>
          ))}
        </View>

        {shown.length === 0 ? (
          <Txt family="hand" weight={400} size="lg" color="textMuted" style={{ paddingVertical: 28 }} align="center">
            {copy.collections.emptyDetail}
          </Txt>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, rowGap: 18, marginTop: 20 }}>
            {shown.map((m) => (
              <Press
                key={m.id}
                accessibilityRole="button"
                accessibilityLabel={`${m.title}, ${copy.media[m.kind]}`}
                testID={`collection-item-${m.id}`}
                onPress={() => router.push(itemHref(m) as never)}
                style={{ width: '30%', flexGrow: 0 }}
              >
                <ItemCover item={m} width={100} titleSize={12} style={{ width: '100%' }} />
                <Txt family="ui" weight={600} size="3xs" numberOfLines={1} style={{ marginTop: 7 }}>
                  {m.title}
                </Txt>
              </Press>
            ))}
          </View>
        )}

        <Press
          accessibilityRole={first ? 'button' : 'text'}
          disabled={!first}
          onPress={() =>
            first &&
            openSheet('tmdbPreview', {
              tmdbId: first.tmdbId,
              kind: 'movie',
              title: first.title,
              year: first.year,
              posterPath: null,
              overview: null,
            })
          }
          scaleTo={1}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginTop: 26,
            paddingVertical: 14,
            paddingHorizontal: 16,
            backgroundColor: t.surfacePageWarm,
            borderRadius: radius.lg,
          }}
          testID="collection-suggestion"
        >
          <Icon name="auto_awesome" size={20} color="textAccent" />
          <Txt family="ui" size="xs" tint={t.inkOnWarm} style={{ flex: 1 }}>
            {suggestions.length
              ? copy.collections.suggestion(
                  suggestions.map((s) => (s.year ? `${s.title} (${s.year})` : s.title)).join(', '),
                )
              : copy.collections.noSuggestion}
          </Txt>
        </Press>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
          <Button
            variant="secondary"
            block
            style={{ flex: 1, minHeight: 50 }}
            testID="collection-add-items"
            onPress={() => router.push(`/collection/${c.id}/add`)}
          >
            {copy.collections.addItems}
          </Button>
          <Button
            variant="accent"
            block
            style={{ flex: 1, minHeight: 50 }}
            testID="collection-all-up-next"
            disabled={members.length === 0}
            onPress={() => {
              const n = addAll(members.map((m) => m.id));
              toast({
                message: n ? copy.collections.allAdded(c.name) : copy.collections.alreadyQueued,
                action: { label: copy.collections.open, onPress: () => router.navigate('/up-next') },
              });
            }}
          >
            {copy.collections.allToUpNext}
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
