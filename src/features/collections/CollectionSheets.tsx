import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Button } from '@/components/ds/Button';
import { Checkbox } from '@/components/ds/Checkbox';
import { Input } from '@/components/ds/Input';
import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { copy } from '@/i18n/en';
import { qk } from '@/lib/queryKeys';
import { useDragStore } from '@/lib/stores/drag';
import { openSheet, type SheetParams } from '@/lib/stores/sheet';
import { toast } from '@/lib/stores/toast';
import { layout, motion, radius, useTheme } from '@/theme';

import type { Collection } from './api';
import {
  useAddToCollection,
  useCollections,
  useDeleteCollection,
  useNewCollection,
  useRemoveFromCollection,
} from './hooks';

function Title({ children }: { children: string }) {
  return (
    <Txt family="display" weight={700} size={20} accessibilityRole="header">
      {children}
    </Txt>
  );
}

/** A collection chip that registers where it is on screen, so a dragged card can land on it. */
function TargetChip({ c, inIt, onPress }: { c: Collection; inIt: boolean; onPress: () => void }) {
  const { t } = useTheme();
  const ref = useRef<View>(null);
  const over = useDragStore((s) => s.over === c.id);
  const landed = useDragStore((s) => (s.landed?.id === c.id ? s.landed.at : 0));
  const setTarget = useDragStore((s) => s.setTarget);
  const pulse = useSharedValue(1);
  const reduced = useReducedMotion();

  const measure = () =>
    ref.current?.measureInWindow((x, y, width, height) => width && setTarget(c.id, { x, y, width, height }));
  useEffect(() => {
    // The tray slides up: measure again once it has settled.
    const id = setTimeout(measure, motion.duration.page);
    return () => {
      clearTimeout(id);
      setTarget(c.id, null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per chip
  }, []);
  useEffect(() => {
    if (landed && !reduced)
      pulse.value = withSequence(
        withTiming(1.12, { duration: motion.duration.fast }),
        withTiming(1, { duration: motion.duration.fast }),
      );
  }, [landed, pulse, reduced]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const on = inIt || over;

  return (
    <Animated.View style={style}>
      <Press
        ref={ref}
        onLayout={measure}
        accessibilityRole="button"
        accessibilityState={{ checked: inIt }}
        testID={`tray-${c.id}`}
        onPress={onPress}
        style={{
          minHeight: layout.hitMin,
          justifyContent: 'center',
          paddingHorizontal: 16,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: over ? t.accentPrimary : on ? t.borderStrong : t.borderSoft,
          backgroundColor: on ? t.surfaceAccentSoft : t.surfaceCard,
        }}
      >
        <Txt family="ui" weight={600} size={14} tint={on ? t.inkOnWarm : t.textSecondary}>
          {inIt ? `${c.name} ✓` : c.name}
        </Txt>
      </Press>
    </Animated.View>
  );
}

/** The collections tray (prototype sheetTray): drop a lifted card on a chip, or tap one. */
export function TraySheetBody({ p, onClose }: { p: SheetParams['tray']; onClose: () => void }) {
  const list = useCollections().data ?? [];
  const add = useAddToCollection();
  const dragging = useDragStore((s) => !!s.item);
  return (
    <View style={{ gap: 14 }}>
      <View>
        <Title>{copy.collections.addTo(p.title)}</Title>
        <Txt family="hand" weight={400} size={17} color="textMuted">
          {dragging ? copy.collections.dragHint : copy.collections.trayHint}
        </Txt>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {list.map((c) => {
          const inIt = c.items.some((i) => i.itemId === p.itemId);
          return (
            <TargetChip
              key={c.id}
              c={c}
              inIt={inIt}
              onPress={() => {
                onClose();
                if (inIt) return;
                add(c.id, [p.itemId]);
                toast({ message: copy.collections.added(c.name) });
              }}
            />
          );
        })}
        <NewChip onPress={() => openSheet('newCollection', { itemId: p.itemId })} />
      </View>
    </View>
  );
}

function NewChip({ onPress }: { onPress: () => void }) {
  const { t } = useTheme();
  return (
    <Press
      accessibilityRole="button"
      testID="tray-new"
      onPress={onPress}
      style={{
        minHeight: layout.hitMin,
        justifyContent: 'center',
        paddingHorizontal: 16,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: t.borderStrong,
      }}
    >
      <Txt family="ui" weight={600} size={14} color="textSecondary">
        {copy.collections.newCollection}
      </Txt>
    </Press>
  );
}

/** "+ Add" on a detail page: tick the collections this belongs in (plan §11.9). */
export function AddToCollectionSheetBody({ itemId, title }: { itemId: string; title: string }) {
  const list = useCollections().data ?? [];
  const add = useAddToCollection();
  const remove = useRemoveFromCollection();
  return (
    <View style={{ gap: 12 }}>
      <Title>{copy.collections.addTo(title)}</Title>
      {list.map((c) => {
        const inIt = c.items.some((i) => i.itemId === itemId);
        return (
          <Checkbox
            key={c.id}
            label={c.name}
            checked={inIt}
            testID={`collection-check-${c.id}`}
            onChange={(v) => (v ? add(c.id, [itemId]) : remove(c, { id: itemId, title }))}
          />
        );
      })}
      <View style={{ flexDirection: 'row' }}>
        <NewChip onPress={() => openSheet('newCollection', { itemId })} />
      </View>
    </View>
  );
}

/** New collection (prototype sheetNewCollection): name, description, Create empty / Add items now. */
export function NewCollectionSheetBody({ p, onClose }: { p: SheetParams['newCollection']; onClose: () => void }) {
  const create = useNewCollection();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string>();
  const make = (then: 'close' | 'add') => {
    const n = name.trim();
    if (!n) return setError(copy.collections.needName);
    const id = create(n, description.trim() || null, p.itemId ? [p.itemId] : []);
    onClose();
    toast({ message: copy.collections.created(n) });
    if (then === 'add') router.push(`/collection/${id}/add`);
  };
  return (
    <View style={{ gap: 14 }}>
      <Title>{copy.collections.newTitle}</Title>
      <Input
        label={copy.collections.name}
        value={name}
        onChange={(v) => {
          setName(v);
          setError(undefined);
        }}
        error={error}
        maxLength={80}
        testID="collection-name"
      />
      <Input
        label={copy.collections.description}
        value={description}
        onChange={setDescription}
        maxLength={200}
        testID="collection-description"
      />
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
        <Button
          variant="secondary"
          block
          style={{ flex: 1, minHeight: 52 }}
          testID="collection-create"
          onPress={() => make('close')}
        >
          {copy.collections.createEmpty}
        </Button>
        <Button
          variant="accent"
          block
          style={{ flex: 1, minHeight: 52 }}
          testID="collection-create-add"
          onPress={() => make('add')}
        >
          {copy.collections.addNow}
        </Button>
      </View>
    </View>
  );
}

/** ⋯ on a collection: delete it (the things in it stay in the library). */
export function CollectionMenuSheetBody({ collectionId, onClose }: { collectionId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const del = useDeleteCollection();
  const c = qc.getQueryData<Collection[]>(qk.collections)?.find((x) => x.id === collectionId);
  if (!c) return null;
  return (
    <View style={{ gap: 12 }}>
      <Title>{copy.collections.delete}</Title>
      <Txt family="ui" size="xs" color="textMuted">
        {copy.collections.confirmDelete(c.name)}
      </Txt>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
        <Button variant="secondary" block style={{ flex: 1, minHeight: 52 }} onPress={onClose}>
          {copy.mediaOverflow.keep}
        </Button>
        <Button
          variant="danger"
          block
          style={{ flex: 1, minHeight: 52 }}
          testID="collection-delete"
          onPress={() => {
            del.mutate({ id: c.id });
            onClose();
            router.back();
            toast({ message: copy.collections.deleted(c.name) });
          }}
        >
          {copy.overflow.delete}
        </Button>
      </View>
    </View>
  );
}
