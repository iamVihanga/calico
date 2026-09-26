import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { memo } from 'react';
import { View } from 'react-native';

import { ItemCover } from '@/components/calico/ItemCover';
import { Icon } from '@/components/ds/Icon';
import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { copy } from '@/i18n/en';
import { layout, radius, shadow, useTheme } from '@/theme';

import type { QueueRow } from './hooks';

export const itemHref = (i: { id: string; kind: 'book' | 'movie' | 'show' }) =>
  i.kind === 'book' ? `/book/${i.id}` : i.kind === 'movie' ? `/movie/${i.id}` : `/show/${i.id}`;

type Props = {
  row: QueueRow;
  n: number;
  active: boolean;
  /** Undefined when dragging is off (a filter is active). */
  onDrag?: () => void;
  onUp?: () => void;
  onRemove: () => void;
};

/** One Up next row (prototype queueRows): handle, number, cover, title + meta, ↑ and ✕. */
export const QueueRowView = memo(function QueueRowView({ row, n, active, onDrag, onUp, onRemove }: Props) {
  const { t } = useTheme();
  const { item } = row;
  const icon = (name: 'arrow_upward' | 'close', label: string, run: (() => void) | undefined, testID: string) => (
    <Press
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={!run}
      onPress={run}
      testID={testID}
      style={{
        width: 36,
        height: layout.hitMin,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: run ? 1 : 0.35,
      }}
    >
      <Icon name={name} size={18} color="textMuted" />
    </Press>
  );
  return (
    <View
      testID={`queue-row-${item.id}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 10,
        paddingLeft: 4,
        paddingRight: 8,
        backgroundColor: active ? t.surfaceAccentSoft : t.surfaceCard,
        borderRadius: radius.lg,
        boxShadow: active ? shadow.lg : shadow.xs,
      }}
    >
      <Press
        accessibilityRole="button"
        accessibilityLabel={copy.upNext.drag(item.title)}
        disabled={!onDrag}
        onLongPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onDrag?.();
        }}
        delayLongPress={200}
        style={{
          width: 34,
          height: layout.hitMin,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: onDrag ? 1 : 0.35,
        }}
      >
        <Icon name="drag_indicator" size={19} tint={t.borderStrong} />
      </Press>
      <Txt family="display" weight={700} size={14} color="textMuted" style={{ width: 18 }}>
        {String(n)}
      </Txt>
      <ItemCover item={item} width={34} titleSize={5} />
      <Press
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, ${item.meta}`}
        onPress={() => router.push(itemHref(item) as never)}
        onLongPress={onDrag}
        scaleTo={1}
        style={{ flex: 1, minWidth: 0, paddingLeft: 4, minHeight: layout.hitMin, justifyContent: 'center' }}
      >
        <Txt family="ui" weight={600} size={15} numberOfLines={1}>
          {item.title}
        </Txt>
        <Txt family="ui" size="2xs" color="textMuted" numberOfLines={1}>
          {item.meta}
        </Txt>
      </Press>
      {icon('arrow_upward', copy.upNext.moveUp(item.title), onUp, `queue-up-${item.id}`)}
      {icon('close', copy.upNext.remove(item.title), onRemove, `queue-remove-${item.id}`)}
    </View>
  );
});
