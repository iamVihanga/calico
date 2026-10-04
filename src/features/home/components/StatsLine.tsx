import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

import { Illustration } from '@/components/calico/Illustration';
import { Icon } from '@/components/ds/Icon';
import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { fetchHomeStats } from '@/features/account/api';
import { useProfile } from '@/features/profile/hooks';
import { copy } from '@/i18n/en';
import { qk } from '@/lib/queryKeys';
import { layout, radius, useTheme } from '@/theme';

/** "5 books read this month →" (or pages, Settings → Home stat) at the bottom of Home, opening Your year. */
export function StatsLine() {
  const { t } = useTheme();
  const q = useQuery({ queryKey: qk.homeStats, queryFn: fetchHomeStats });
  const choice = useProfile().data?.home_stat === 'pages' ? 'pages' : 'books';
  const s = q.data;
  const line = s ? copy.year.statsLine(s, choice) : copy.settings.yourYear;
  return (
    <Press
      accessibilityRole="button"
      accessibilityHint={copy.settings.yourYear}
      testID="home-stats"
      onPress={() => router.push('/year')}
      scaleTo={0.99}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginHorizontal: layout.gutterScreen,
        marginTop: 8,
        paddingVertical: 16,
        paddingHorizontal: 18,
        backgroundColor: t.surfacePageWarm,
        borderRadius: radius.lg,
      }}
    >
      <Illustration name="mug" width={30} />
      <Txt family="ui" weight={700} size={15} tint={t.inkOnWarm} style={{ flex: 1 }}>
        {line}
      </Txt>
      <Icon name="arrow_forward" size={20} color="textAccent" />
    </Press>
  );
}
