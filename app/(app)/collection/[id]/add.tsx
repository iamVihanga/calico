import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ItemCover } from '@/components/calico/ItemCover';
import { Button } from '@/components/ds/Button';
import { Icon } from '@/components/ds/Icon';
import { IconButton } from '@/components/ds/IconButton';
import { Press } from '@/components/ds/Press';
import { SearchField } from '@/components/ds/SearchField';
import { Txt } from '@/components/ds/Txt';
import { useAddToCollection, useCollection, useRemoveFromCollection } from '@/features/collections/hooks';
import { useLibraryItems } from '@/features/library/items';
import { copy } from '@/i18n/en';
import { toast } from '@/lib/stores/toast';
import { layout, radius, shadow, useTheme } from '@/theme';

const norm = (s: string) => s.normalize('NFC').toLowerCase();

/**
 * Add items to a collection (plan §11.9): the whole library with a filter, ticked if already in it.
 * Unticking removes; "Add n" saves. TMDB is one tap away for things not in the library yet.
 */
export default function CollectionPicker() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const c = useCollection(id).data;
  const { items } = useLibraryItems();
  const add = useAddToCollection();
  const remove = useRemoveFromCollection();
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const inIt = useMemo(() => new Set(c?.items.map((i) => i.itemId)), [c]);
  const shown = useMemo(
    () => (q.trim() ? items.filter((i) => norm(`${i.title} ${i.sub}`).includes(norm(q.trim()))) : items),
    [items, q],
  );
  if (!c) return null;

  const toggle = (itemId: string, title: string) => {
    if (inIt.has(itemId)) return remove(c, { id: itemId, title });
    setPicked((s) => {
      const n = new Set(s);
      if (n.has(itemId)) n.delete(itemId);
      else n.add(itemId);
      return n;
    });
  };
  const done = () => {
    const ids = items.filter((i) => picked.has(i.id)).map((i) => i.id);
    const n = add(c.id, ids);
    if (n) toast({ message: copy.collections.addedMany(c.name, n) });
    router.back();
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: t.surfacePage, paddingTop: insets.top + 8 }}
      testID="screen-collection-add"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14 }}>
        <IconButton icon="arrow_back" label={copy.books.back} onPress={() => router.back()} />
        <Txt family="display" weight={700} size="xl" numberOfLines={1} accessibilityRole="header" style={{ flex: 1 }}>
          {copy.collections.pickerTitle(c.name)}
        </Txt>
      </View>
      <View style={{ paddingHorizontal: layout.gutterScreen, paddingVertical: 12, gap: 10 }}>
        <SearchField
          value={q}
          onChange={setQ}
          onClear={() => setQ('')}
          placeholder={copy.collections.pickerSearch}
          testID="picker-query"
        />
        <Press
          accessibilityRole="link"
          onPress={() => router.push('/tmdb')}
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <Txt family="ui" weight={700} size="xs" color="textAccent">
            {copy.collections.pickerTmdb}
          </Txt>
        </Press>
      </View>
      <FlashList
        data={shown}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: layout.gutterScreen, paddingBottom: insets.bottom + 100 }}
        renderItem={({ item }) => {
          const on = inIt.has(item.id) || picked.has(item.id);
          return (
            <Press
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${item.title}, ${copy.media[item.kind]}`}
              testID={`pick-item-${item.id}`}
              onPress={() => toggle(item.id, item.title)}
              scaleTo={1}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                minHeight: 64,
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: t.borderHairline,
              }}
            >
              <ItemCover item={item} width={32} titleSize={5} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt family="ui" weight={600} size={15} numberOfLines={1}>
                  {item.title}
                </Txt>
                <Txt family="ui" size="2xs" color="textMuted" numberOfLines={1}>
                  {[copy.media[item.kind], item.sub].filter(Boolean).join(' · ')}
                </Txt>
              </View>
              <Icon
                name={on ? 'check_circle' : 'radio_button_unchecked'}
                size={22}
                tint={on ? t.accentPrimary : t.borderStrong}
              />
            </Press>
          );
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: layout.gutterScreen,
          paddingBottom: insets.bottom + 16,
          backgroundColor: t.surfacePage,
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
          boxShadow: shadow.sheet,
        }}
      >
        <Button variant="accent" size="lg" block onPress={done} testID="picker-done">
          {copy.collections.pickerDone(picked.size)}
        </Button>
      </View>
    </View>
  );
}
