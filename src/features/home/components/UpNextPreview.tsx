import { router } from 'expo-router';
import { View } from 'react-native';

import { ItemCover } from '@/components/calico/ItemCover';
import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { useQueue } from '@/features/upnext/hooks';
import { PickButton } from '@/features/upnext/PickButton';
import { itemHref } from '@/features/upnext/QueueRowView';
import { copy } from '@/i18n/en';
import { layout, radius, shadow, useTheme } from '@/theme';

const PREVIEW = 3;

/** Home "Up next": the top three and "can't decide? Pick for me" (prototype homeV `upNextTop`). */
export function UpNextPreview() {
  const { t } = useTheme();
  const { rows } = useQueue();
  if (rows.length === 0) return null;
  return (
    <View style={{ paddingBottom: 26 }} testID="home-up-next">
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: layout.gutterScreen,
          paddingBottom: 12,
        }}
      >
        <Txt family="display" weight={700} size={22} accessibilityRole="header" style={{ letterSpacing: -0.02 * 22 }}>
          {copy.upNext.title}
        </Txt>
        <Press
          accessibilityRole="button"
          onPress={() => router.navigate('/up-next')}
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <Txt family="ui" weight={700} size="xs" color="textAccent">
            {copy.upNext.seeAll}
          </Txt>
        </Press>
      </View>
      <View style={{ paddingHorizontal: layout.gutterScreen }}>
        <View
          style={{ backgroundColor: t.surfaceCard, borderRadius: radius.lg, boxShadow: shadow.sm, overflow: 'hidden' }}
        >
          {rows.slice(0, PREVIEW).map((r, i) => (
            <Press
              key={r.item.id}
              accessibilityRole="button"
              accessibilityLabel={`${i + 1}. ${r.item.title}, ${r.item.meta}`}
              onPress={() => router.push(itemHref(r.item) as never)}
              scaleTo={1}
              pressedStyle={{ backgroundColor: t.surfaceQuiet }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                minHeight: 60,
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderBottomWidth: i < Math.min(PREVIEW, rows.length) - 1 ? 1 : 0,
                borderBottomColor: t.borderHairline,
              }}
            >
              <Txt family="display" weight={700} size={15} color="textMuted" style={{ width: 16 }}>
                {String(i + 1)}
              </Txt>
              <ItemCover item={r.item} width={30} titleSize={5} />
              <Txt family="ui" size={15} numberOfLines={1} style={{ flex: 1 }}>
                {r.item.title}
              </Txt>
              <Txt family="ui" size="2xs" color="textMuted">
                {r.item.meta}
              </Txt>
            </Press>
          ))}
        </View>
        <View style={{ marginTop: 16 }}>
          <PickButton hand={copy.pick.homeHand} onPress={() => router.push('/pick')} />
        </View>
      </View>
    </View>
  );
}
