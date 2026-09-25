import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { Icon } from '@/components/ds/Icon';
import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { initials } from '@/components/ds/Avatar';
import { TabScreen } from '@/components/layout/TabScreen';
import { useBooks, useLeadScript, useReadingLogs } from '@/features/books/hooks';
import { ContinueReadingCard } from '@/features/home/components/ContinueReadingCard';
import { HomeEmpty } from '@/features/home/components/HomeEmpty';
import { useProfile, useSetTheme } from '@/features/profile/hooks';
import { copy } from '@/i18n/en';
import { toast } from '@/lib/stores/toast';
import { layout, radius, shadow, useTheme } from '@/theme';

function greeting(hour: number) {
  if (hour < 12) return copy.home.greetingMorning;
  if (hour < 17) return copy.home.greetingAfternoon;
  return copy.home.greetingEvening;
}

/**
 * Home (prototype `home`). Phase 2: greeting, search pill, night toggle, Continue reading, empty state.
 * Due soon (4), Continue watching (5), Up next + Pick for me (6) and the stats line (7) follow.
 */
export default function Home() {
  const { t, name } = useTheme();
  const profile = useProfile();
  const setTheme = useSetTheme();
  const lead = useLeadScript();
  const books = useBooks();
  const reading = (books.data ?? []).filter((b) => b.status === 'reading');
  const logs = useReadingLogs(reading.map((b) => b.id)).data ?? {};
  const empty = books.isSuccess && books.data.length === 0;
  const displayName = profile.data?.display_name ?? '';
  const night = name === 'night';

  return (
    <TabScreen testID="screen-home">
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          paddingTop: 10,
          paddingHorizontal: layout.gutterScreen,
          paddingBottom: 16,
        }}
      >
        <View style={{ flex: 1 }}>
          <Txt family="hand" weight={400} size={21} leading={1} color="textAccent">
            {greeting(new Date().getHours())}
          </Txt>
          <Txt family="display" weight={700} size={34} leading={1.06} style={{ letterSpacing: -0.03 * 34 }}>
            {displayName.split(' ')[0] ?? ''}
          </Txt>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Press
            accessibilityRole="switch"
            accessibilityState={{ checked: night }}
            accessibilityLabel={night ? copy.home.nightOff : copy.home.nightOn}
            testID="toggle-night"
            onPress={() => setTheme(night ? 'day' : 'night', { announce: true })}
            style={{
              width: 46,
              height: 46,
              borderRadius: radius.pill,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: night ? t.surfaceAccentSoft : t.surfaceCard,
              borderWidth: 1,
              borderColor: t.borderHairline,
              boxShadow: shadow.xs,
            }}
          >
            <Icon
              name={night ? 'light_mode' : 'dark_mode'}
              size={21}
              tint={night ? t.accentSecondary : t.textSecondary}
            />
          </Press>
          <Press
            accessibilityRole="button"
            accessibilityLabel={copy.home.settings}
            testID="open-settings"
            onPress={() => router.push('/settings')}
            style={{
              width: 46,
              height: 46,
              borderRadius: radius.pill,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: t.surfaceAccentSoft,
              borderWidth: 1,
              borderColor: t.borderStrong,
              boxShadow: shadow.xs,
            }}
          >
            <Txt family="ui" weight={700} size="sm" tint={t.inkOnWarm}>
              {initials(displayName)}
            </Txt>
          </Press>
        </View>
      </View>

      <View style={{ paddingHorizontal: layout.gutterScreen, paddingBottom: 22 }}>
        <Press
          accessibilityRole="search"
          accessibilityLabel={copy.home.search}
          onPress={() => toast({ message: copy.errors.notYet })}
          scaleTo={0.99}
          style={{
            minHeight: 50,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 18,
            backgroundColor: t.surfaceSunk,
            borderWidth: 1,
            borderColor: t.borderHairline,
            borderRadius: radius.pill,
          }}
        >
          <Icon name="search" size={20} color="textMuted" />
          <Txt family="ui" size="sm" color="textMuted">
            {copy.home.search}
          </Txt>
        </Press>
      </View>

      {empty && <HomeEmpty />}

      {reading.length > 0 && (
        <View>
          <Txt
            family="display"
            weight={700}
            size={22}
            accessibilityRole="header"
            style={{ paddingHorizontal: layout.gutterScreen, paddingBottom: 12, letterSpacing: -0.02 * 22 }}
          >
            {copy.homeShelf.continueReading}
          </Txt>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 16, paddingHorizontal: layout.gutterScreen, paddingBottom: 26 }}
          >
            {reading.map((b) => (
              <ContinueReadingCard key={b.id} book={b} logs={logs[b.id] ?? []} lead={lead} />
            ))}
          </ScrollView>
        </View>
      )}
    </TabScreen>
  );
}
