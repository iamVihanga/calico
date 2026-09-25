import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { copy } from '@/i18n/en';

import { storage, storageKeys } from './storage';

/**
 * Local reminders (plan §9.5): one Android channel, two action categories, and a permission that is
 * only ever requested from the "Reminders for library books" sheet.
 */
export const LOAN_CHANNEL = 'loans';
export const ACTIONS = { renew: 'renew', open: 'open', returned: 'returned' } as const;

let setup: Promise<void> | null = null;

/** Handler, channel and categories. Safe to call many times; runs once per app start. */
export function setupNotifications(): Promise<void> {
  setup ??= (async () => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(LOAN_CHANNEL, {
        name: copy.reminders.channel,
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    const action = (identifier: string, buttonTitle: string) => ({
      identifier,
      buttonTitle,
      options: { opensAppToForeground: true },
    });
    await Notifications.setNotificationCategoryAsync('loan3d', [
      action(ACTIONS.renew, copy.reminders.renew),
      action(ACTIONS.open, copy.reminders.open),
    ]);
    await Notifications.setNotificationCategoryAsync('loan1d', [
      action(ACTIONS.renew, copy.reminders.renew),
      action(ACTIONS.returned, copy.reminders.returned),
    ]);
  })().catch((e: unknown) => {
    setup = null; // try again next time
    throw e;
  });
  return setup;
}

export async function remindersAllowed(): Promise<boolean> {
  return (await Notifications.getPermissionsAsync()).granted;
}

/** Whether the reminder sheet has already been shown (the answer is remembered, plan §9.5). */
export const remindersAsked = () => storage.getBoolean(storageKeys.remindersAsked) === true;

/** "Allow reminders": the only place the system prompt is triggered. */
export async function askForReminders(): Promise<boolean> {
  storage.set(storageKeys.remindersAsked, true);
  await setupNotifications(); // Android 13+ needs a channel before the prompt
  const { granted } = await Notifications.requestPermissionsAsync();
  return granted;
}

export function declineReminders() {
  storage.set(storageKeys.remindersAsked, true);
}
