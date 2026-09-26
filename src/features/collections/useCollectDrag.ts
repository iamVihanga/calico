import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';

import { copy } from '@/i18n/en';
import { qk } from '@/lib/queryKeys';
import { type DragItem, useDragStore } from '@/lib/stores/drag';
import { openSheet, useSheetStore } from '@/lib/stores/sheet';
import { toast } from '@/lib/stores/toast';

import type { Collection } from './api';
import { useAddToCollection } from './hooks';

const LIFT_MS = 350;

/**
 * Long-press any cover to lift it (plan §11.9): the tray rises with the collections; drop the card
 * on one to add it there. The tray's chips can also just be tapped (the non-drag way).
 */
export function useCollectDrag(item: DragItem) {
  const qc = useQueryClient();
  const add = useAddToCollection();
  return useMemo(
    () =>
      Gesture.Pan()
        .withTestId(`collect-${item.id}`)
        .runOnJS(true)
        .activateAfterLongPress(LIFT_MS)
        .onStart((e) => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          useDragStore.getState().lift(item, e.absoluteX, e.absoluteY);
          openSheet('tray', { itemId: item.id, title: item.title });
        })
        .onUpdate((e) => {
          if (useDragStore.getState().move(e.absoluteX, e.absoluteY)) void Haptics.selectionAsync();
        })
        .onEnd(() => {
          const target = useDragStore.getState().drop();
          if (!target) return; // dropped elsewhere: the tray stays open for a tap
          const c = qc.getQueryData<Collection[]>(qk.collections)?.find((x) => x.id === target);
          const n = add(target, [item.id]);
          useDragStore.getState().land(target);
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          if (useSheetStore.getState().sheet?.name === 'tray') useSheetStore.getState().close();
          if (c) toast({ message: n ? copy.collections.added(c.name) : copy.collections.inIt });
        })
        .onFinalize(() => {
          if (useDragStore.getState().item) useDragStore.getState().drop();
        }),
    [item, qc, add],
  );
}
