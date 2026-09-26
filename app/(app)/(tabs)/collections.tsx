import { router } from 'expo-router';
import { View } from 'react-native';

import { CollectionMosaic, MediaCountDot } from '@/components/calico/CollectionMosaic';
import { Press } from '@/components/ds/Press';
import { ScreenHeader } from '@/components/ds/ScreenHeader';
import { Txt } from '@/components/ds/Txt';
import { TabScreen } from '@/components/layout/TabScreen';
import { useCollections } from '@/features/collections/hooks';
import { kindCounts } from '@/features/collections/logic';
import { useLibraryItems } from '@/features/library/items';
import { copy } from '@/i18n/en';
import { openSheet } from '@/lib/stores/sheet';
import { layout, radius, shadow, useTheme } from '@/theme';

/** Collections (prototype `collections`): mosaic cards in two columns, "+ New". */
export default function Collections() {
  const { t } = useTheme();
  const collections = useCollections();
  const { byId } = useLibraryItems();
  const list = collections.data ?? [];

  return (
    <TabScreen testID="screen-collections">
      <ScreenHeader
        hand={copy.headers.collectionsHand}
        title={copy.headers.collections}
        trailing={
          <Press
            accessibilityRole="button"
            testID="collections-new"
            onPress={() => openSheet('newCollection', {})}
            style={{
              minHeight: 44,
              justifyContent: 'center',
              paddingHorizontal: 18,
              borderRadius: radius.pill,
              backgroundColor: t.accentPrimary,
              boxShadow: shadow.sm,
            }}
          >
            <Txt family="ui" weight={700} size={14} tint={t.textOnAccent}>
              {copy.collections.new}
            </Txt>
          </Press>
        }
      />
      {collections.isSuccess && list.length === 0 && (
        <View
          style={{
            marginHorizontal: layout.gutterScreen,
            paddingVertical: 52,
            paddingHorizontal: 28,
            backgroundColor: t.surfacePageWarm,
            borderRadius: radius.xl,
          }}
        >
          <Txt family="hand" weight={400} size="xl" color="textMuted" align="center">
            {copy.collections.empty}
          </Txt>
        </View>
      )}
      <View
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, rowGap: 18, paddingHorizontal: layout.gutterScreen }}
      >
        {list.map((c) => {
          const items = c.items.flatMap((e) => {
            const i = byId.get(e.itemId);
            return i ? [i] : [];
          });
          const n = kindCounts(items);
          return (
            <Press
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={`${c.name}, ${copy.collections.counts(n.book, n.movie, n.show) || copy.collections.emptyDetail}`}
              testID={`collection-${c.id}`}
              onPress={() => router.push(`/collection/${c.id}`)}
              style={{ width: '47%', flexGrow: 1 }}
            >
              <CollectionMosaic items={items.slice(0, 4).map((i) => ({ id: i.id, title: i.title }))} />
              <Txt family="display" weight={700} size={16} numberOfLines={1} style={{ marginTop: 10 }}>
                {c.name}
              </Txt>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 3 }}>
                {(['book', 'movie', 'show'] as const).map((k) =>
                  n[k] ? (
                    <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <MediaCountDot kind={k} />
                      <Txt family="ui" weight={600} size="3xs" color="textMuted">
                        {String(n[k])}
                      </Txt>
                    </View>
                  ) : null,
                )}
              </View>
            </Press>
          );
        })}
      </View>
    </TabScreen>
  );
}
