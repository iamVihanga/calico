import { View } from 'react-native';

import { ItemCover } from '@/components/calico/ItemCover';
import { useDragStore } from '@/lib/stores/drag';
import { shadow } from '@/theme';

const W = 84;

/** The lifted card following the finger, above everything (rendered once in the app layout). */
export function DragLayer() {
  const item = useDragStore((s) => s.item);
  const x = useDragStore((s) => s.x);
  const y = useDragStore((s) => s.y);
  if (!item) return null;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x - W / 2,
        top: y - W * 0.75,
        zIndex: 20,
        transform: [{ scale: 1.05 }, { rotate: '-4deg' }],
        boxShadow: shadow.lg,
      }}
    >
      <ItemCover item={item} width={W} titleSize={10} />
    </View>
  );
}
