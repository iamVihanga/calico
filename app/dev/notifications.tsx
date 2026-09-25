/* Dev-only reminder tester (plan §2, §13 Phase 4): preview, 10-second test reminder, resync, schedule list. */
import { useQuery } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ds/Button';
import { IconButton } from '@/components/ds/IconButton';
import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { useBooks, useLeadScript } from '@/features/books/hooks';
import { leadTitle } from '@/features/books/logic';
import { planReminders, REMINDER_CATEGORY, reminderLoans } from '@/features/loans/logic';
import { reminderSettings, syncLoanReminders } from '@/features/loans/reminders';
import { useProfile } from '@/features/profile/hooks';
import { copy } from '@/i18n/en';
import { askForReminders, LOAN_CHANNEL, setupNotifications } from '@/lib/notifications';
import { toast } from '@/lib/stores/toast';
import { layout, radius, shadow, size, tracking, useTheme } from '@/theme';

const TEST_ID = 'dev-test';
const TEST_SECONDS = 10;

export default function DevNotifications() {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const lead = useLeadScript();
  const books = useBooks().data ?? [];
  const profile = useProfile().data;
  const phone = useQuery({
    queryKey: ['dev', 'notifications'],
    queryFn: async () => ({
      status: (await Notifications.getPermissionsAsync()).status as string,
      scheduled: await Notifications.getAllScheduledNotificationsAsync(),
    }),
    staleTime: 0,
  });
  const status = phone.data?.status ?? '…';
  const scheduled = phone.data?.scheduled ?? [];
  const refresh = () => void phone.refetch();

  // Preview the first loan's reminders as if the due date were 3 days away.
  const loans = reminderLoans(books, (b) => leadTitle(b, lead).main);
  const first = loans[0];
  const preview = first
    ? planReminders([first], { ...reminderSettings(profile), remind3d: true, remind1d: true }, new Date(0))
    : [];

  const sendTest = async () => {
    const r = preview[0];
    if (!r) {
      toast({ message: copy.dev.testNoLoan });
      return;
    }
    await setupNotifications();
    await Notifications.scheduleNotificationAsync({
      identifier: TEST_ID,
      content: {
        title: r.title,
        body: r.body,
        data: { itemId: r.itemId, loanId: r.loanId },
        categoryIdentifier: REMINDER_CATEGORY[r.kind],
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: TEST_SECONDS,
        channelId: LOAN_CHANNEL,
      },
    });
    toast({ message: copy.dev.testScheduled });
    refresh();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.surfacePage }}
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingBottom: insets.bottom + 40,
        paddingHorizontal: layout.gutterScreen,
        gap: 16,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <IconButton icon="arrow_back" label={copy.settings.back} tone="card" onPress={() => router.back()} />
        <Txt family="display" weight={700} size="xl" accessibilityRole="header">
          {copy.dev.notificationsTitle}
        </Txt>
      </View>

      <Txt family="ui" size="xs" color="textMuted">
        {copy.dev.permission(status)}
      </Txt>
      {status !== 'granted' && (
        <Button
          variant="secondary"
          onPress={async () => {
            await askForReminders();
            refresh();
          }}
        >
          {copy.reminders.allow}
        </Button>
      )}

      <Txt family="ui" size="2xs" color="textMuted">
        {copy.dev.preview}
      </Txt>
      {preview.length === 0 && (
        <Txt family="ui" size="xs" color="textMuted">
          {copy.dev.testNoLoan}
        </Txt>
      )}
      {preview.map((r) => (
        <View
          key={r.kind}
          style={{ backgroundColor: t.surfaceCard, borderRadius: radius.lg, boxShadow: shadow.sm, padding: 16 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 16, height: 16, borderRadius: radius.xs, backgroundColor: t.accentPrimary }} />
            <Txt
              family="ui"
              weight={700}
              size={10}
              color="textMuted"
              style={{ letterSpacing: tracking.caps * size['3xs'] }}
            >
              {r.kind === '3d' ? copy.dev.previewWhen.now : copy.dev.previewWhen.tomorrow}
            </Txt>
          </View>
          <Txt family="display" weight={700} size={17} style={{ marginTop: 4 }}>
            {r.title}
          </Txt>
          <Txt family="ui" size="xs" color="textMuted">
            {r.body}
          </Txt>
          <View style={{ flexDirection: 'row', gap: 18, marginTop: 12 }}>
            {[
              { label: copy.reminders.renew, to: `/book/${r.itemId}?sheet=renew` },
              r.kind === '3d'
                ? { label: copy.reminders.open, to: `/book/${r.itemId}` }
                : { label: copy.reminders.returned, to: `/book/${r.itemId}?sheet=loanQuick` },
            ].map((a) => (
              <Press
                key={a.label}
                accessibilityRole="button"
                onPress={() => router.push(a.to as never)}
                style={{ minHeight: 44, justifyContent: 'center' }}
              >
                <Txt family="ui" weight={700} size={14}>
                  {a.label}
                </Txt>
              </Press>
            ))}
          </View>
        </View>
      ))}

      <Button variant="accent" onPress={sendTest} testID="dev-test-reminder">
        {copy.dev.testReminder}
      </Button>
      <Button
        variant="secondary"
        onPress={async () => {
          const n = await syncLoanReminders();
          toast({ message: copy.dev.resynced(n) });
          refresh();
        }}
      >
        {copy.dev.resync}
      </Button>

      <Txt family="ui" size="2xs" color="textMuted">
        {copy.dev.scheduled}
      </Txt>
      {scheduled.length === 0 ? (
        <Txt family="ui" size="xs" color="textMuted">
          {copy.dev.none}
        </Txt>
      ) : (
        scheduled.map((n) => (
          <View key={n.identifier} style={{ gap: 2 }}>
            <Txt family="ui" weight={600} size="xs">
              {n.content.title ?? n.identifier}
            </Txt>
            <Txt family="ui" size="2xs" color="textMuted">
              {`${n.identifier} · ${JSON.stringify(n.trigger)}`}
            </Txt>
          </View>
        ))
      )}
    </ScrollView>
  );
}
