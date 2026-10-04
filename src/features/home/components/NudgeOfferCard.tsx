import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ds/Button';
import { Txt } from '@/components/ds/Txt';
import { useShowProgress, useShows, useWatchSessions } from '@/features/media/hooks';
import { nudgeCandidates } from '@/features/media/nudges';
import { useProfile, useUpdateProfile } from '@/features/profile/hooks';
import { copy } from '@/i18n/en';
import { remindersAllowed } from '@/lib/notifications';
import { openSheet } from '@/lib/stores/sheet';
import { toast } from '@/lib/stores/toast';
import { storage, storageKeys } from '@/lib/storage';
import { useHourNow } from '@/lib/useHourNow';
import { layout, radius, useTheme } from '@/theme';

/**
 * Once a real watching habit shows up, Home offers a nudge at that time, once. "Yes" turns nudges on
 * (through the reminders explainer when Android hasn't allowed notifications yet); either answer is
 * remembered.
 */
export function NudgeOfferCard() {
  const { t } = useTheme();
  const profile = useProfile().data;
  const update = useUpdateProfile();
  const shows = useShows().data ?? [];
  const progress = useShowProgress().data ?? [];
  const sessions = useWatchSessions().data ?? [];
  const now = useHourNow();
  const [answered, setAnswered] = useState(() => storage.getBoolean(storageKeys.nudgeOffer) === true);
  if (answered || !profile || profile.watch_nudges) return null;
  const best = nudgeCandidates(shows, progress, sessions, now).sort(
    (a, b) => b.habit.strength * b.habit.sessions - a.habit.strength * a.habit.sessions,
  )[0];
  if (!best) return null;

  const answer = () => {
    storage.set(storageKeys.nudgeOffer, true);
    setAnswered(true);
  };

  return (
    <View
      testID="nudge-offer"
      style={{
        marginHorizontal: layout.gutterScreen,
        marginBottom: 22,
        padding: 16,
        gap: 12,
        borderRadius: radius.lg,
        backgroundColor: t.surfacePageWarm,
      }}
    >
      <Txt family="ui" weight={600} size="sm" tint={t.inkOnWarm}>
        {copy.nudges.offer(best.title, copy.habits.time(best.habit.hour))}
      </Txt>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button variant="secondary" block style={{ flex: 1 }} testID="nudge-offer-no" onPress={answer}>
          {copy.nudges.offerNo}
        </Button>
        <Button
          variant="accent"
          block
          style={{ flex: 1 }}
          testID="nudge-offer-yes"
          onPress={async () => {
            answer();
            if (await remindersAllowed()) {
              update.mutate({ watch_nudges: true });
              toast({ message: copy.nudges.on });
            } else {
              openSheet('notifNudges');
            }
          }}
        >
          {copy.nudges.offerYes}
        </Button>
      </View>
    </View>
  );
}
