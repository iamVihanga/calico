import { Tabs } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';

import { TabBar, type TabItem } from '@/components/ds/TabBar';
import { copy } from '@/i18n/en';
import { openSheet } from '@/lib/stores/sheet';
import { toast } from '@/lib/stores/toast';

type TabId = 'index' | 'library' | 'up-next' | 'collections';
type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const items: TabItem<TabId>[] = [
  { id: 'index', label: copy.tabs.home, icon: 'home' },
  { id: 'library', label: copy.tabs.library, icon: 'grid_view' },
  { id: 'up-next', label: copy.tabs.upNext, icon: 'playlist_play' },
  { id: 'collections', label: copy.tabs.collections, icon: 'category' },
];

function AppTabBar({ state, navigation }: TabBarProps) {
  const current = state.routes[state.index];
  return (
    <TabBar
      items={items}
      value={(current?.name ?? 'index') as TabId}
      onChange={(id) => {
        const route = state.routes.find((r) => r.name === id);
        if (!route) return;
        // Emitting tabPress lets an already-focused tab scroll to the top (useScrollToTop).
        const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
        if (current?.name !== id && !event.defaultPrevented) navigation.navigate(route.name);
      }}
      onAdd={() => openSheet('add')}
      onAddLongPress={() => {
        // Long-press opens the camera once capture exists (Phase 3).
        toast({ message: copy.errors.notYet });
      }}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <AppTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="library" />
      <Tabs.Screen name="up-next" />
      <Tabs.Screen name="collections" />
    </Tabs>
  );
}
