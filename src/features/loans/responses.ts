import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';

import { ACTIONS } from '@/lib/notifications';

/** Where a reminder tap or action button goes (plan §9.5). */
export function reminderRoute(r: Pick<Notifications.NotificationResponse, 'actionIdentifier' | 'notification'>) {
  const data = r.notification.request.content.data as { itemId?: unknown } | undefined;
  if (typeof data?.itemId !== 'string') return null;
  const sheet =
    r.actionIdentifier === ACTIONS.renew ? 'renew' : r.actionIdentifier === ACTIONS.returned ? 'loanQuick' : null;
  return sheet ? `/book/${data.itemId}?sheet=${sheet}` : `/book/${data.itemId}`;
}

/** Follow reminder taps, including the one that cold-started the app. */
export function useReminderResponses() {
  useEffect(() => {
    const handle = (r: Notifications.NotificationResponse) => {
      const to = reminderRoute(r);
      if (!to) return;
      // Action buttons don't dismiss the notification on Android.
      void Notifications.dismissNotificationAsync(r.notification.request.identifier).catch(() => undefined);
      router.push(to as never);
    };
    const last = Notifications.getLastNotificationResponse();
    if (last) {
      handle(last);
      Notifications.clearLastNotificationResponse();
    }
    const sub = Notifications.addNotificationResponseReceivedListener(handle);
    return () => sub.remove();
  }, []);
}
