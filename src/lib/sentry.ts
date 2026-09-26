import * as Sentry from '@sentry/react-native';

import { env } from './env';
import { scrubBreadcrumb, scrubEvent } from './sentryScrub';

/** Registered with the router's navigation container in the root layout (screen transactions). */
export const navigationIntegration = Sentry.reactNavigationIntegration({ enableTimeToInitialDisplay: true });

/** Crash reporting is on only in release builds that have a DSN (plan §12.2). */
export const sentryEnabled = !__DEV__ && !!env.EXPO_PUBLIC_SENTRY_DSN;

export function initSentry() {
  if (!sentryEnabled) return;
  Sentry.init({
    dsn: env.EXPO_PUBLIC_SENTRY_DSN,
    environment: env.EXPO_PUBLIC_APP_ENV,
    sendDefaultPii: false,
    attachScreenshot: false,
    attachViewHierarchy: false,
    tracesSampleRate: env.EXPO_PUBLIC_APP_ENV === 'production' ? 0.1 : 1,
    integrations: [navigationIntegration],
    beforeSend: (event) => scrubEvent(event),
    beforeSendTransaction: (event) => scrubEvent(event),
    beforeBreadcrumb: (crumb) => scrubBreadcrumb(crumb),
  });
}

/** Only the anonymous Supabase user id, so one person's crashes group together. */
export function setSentryUser(id: string | null) {
  if (sentryEnabled) Sentry.setUser(id ? { id } : null);
}

export function reportError(error: unknown) {
  if (sentryEnabled) Sentry.captureException(error);
}

export const wrapRoot = <P extends Record<string, unknown>>(C: React.ComponentType<P>) =>
  sentryEnabled ? Sentry.wrap(C) : C;
