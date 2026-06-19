import * as Sentry from '@sentry/react'

const dsn = import.meta.env.VITE_SENTRY_DSN

/** True once a DSN is configured; everything here is a safe no-op otherwise. */
export const sentryEnabled = Boolean(dsn)

export function initSentry() {
  if (!sentryEnabled) return
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      // Replays are masked: the app holds client PII (names, addresses, vet
      // info), so text is masked and media blocked by default.
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
}

/** Tag subsequent events with the logged-in user (or clear on sign-out). */
export function setSentryUser(user) {
  if (!sentryEnabled) return
  Sentry.setUser(user ? { id: user.id, email: user.email } : null)
}

/** Report a handled error: always logs to the console, and to Sentry if enabled. */
export function reportError(error, extra) {
  console.error(extra?.label ?? 'Error:', error)
  if (sentryEnabled) Sentry.captureException(error, extra ? { extra } : undefined)
}
