import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { Tag } from '@/components/ds/Tag';
import { Txt } from '@/components/ds/Txt';
import { useCollections } from '@/features/collections/hooks';
import { copy } from '@/i18n/en';
import { layout } from '@/theme';

/** How many collections Home shows before "See all". */
const SHOWN = 6;

/**
 * Home's collections as a row of pills (in the user's order, with how many things are in each) and a
 * "See all" pill to the Collections tab. Hidden when there are no collections.
 */
export function CollectionPills() {
  const list = useCollections().data ?? [];
  if (list.length === 0) return null;
  return (
    <View style={{ paddingBottom: 26 }} testID="home-collections">
      <Txt
        family="display"
        weight={700}
        size={22}
        accessibilityRole="header"
        style={{ paddingHorizontal: layout.gutterScreen, paddingBottom: 12, letterSpacing: -0.02 * 22 }}
      >
        {copy.homeShelf.collections}
      </Txt>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: layout.gutterScreen }}
      >
        {list.slice(0, SHOWN).map((c) => (
          <Tag
            key={c.id}
            icon="shelves"
            count={c.items.length}
            testID={`home-collection-${c.id}`}
            onPress={() => router.push(`/collection/${c.id}`)}
          >
            {c.name}
          </Tag>
        ))}
        <Tag icon="arrow_forward" testID="home-collections-all" onPress={() => router.push('/collections')}>
          {copy.homeShelf.seeAllCollections}
        </Tag>
      </ScrollView>
    </View>
  );
}
