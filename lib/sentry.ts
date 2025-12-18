import * as Sentry from '@sentry/react-native';

// Initialize Sentry
export function initSentry() {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',

    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production.
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,

    // Set profilesSampleRate to profile 100% of sampled transactions.
    // We recommend adjusting this value in production.
    profilesSampleRate: __DEV__ ? 1.0 : 0.2,

    // Disable Sentry in development
    enabled: !__DEV__,

    // Enable native crashes
    enableNative: true,

    // Enable auto session tracking
    enableAutoSessionTracking: true,

    // Session timeout in milliseconds
    sessionTrackingIntervalMillis: 30000,

    // Environment
    environment: __DEV__ ? 'development' : 'production',

    // Enable automatic performance monitoring
    enableAutoPerformanceTracing: true,

    // Filter out sensitive data
    beforeSend(event, hint) {
      // Remove sensitive data from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
          if (breadcrumb.data) {
            // Remove passwords, tokens, etc.
            const sensitiveKeys = ['password', 'token', 'apiKey', 'secret'];
            sensitiveKeys.forEach((key) => {
              if (breadcrumb.data && key in breadcrumb.data) {
                breadcrumb.data[key] = '[Filtered]';
              }
            });
          }
          return breadcrumb;
        });
      }

      return event;
    },
  });
}

// Custom error logging
export function logError(error: Error, context?: Record<string, any>) {
  if (context) {
    Sentry.setContext('custom', context);
  }
  Sentry.captureException(error);
}

// Custom event logging
export function logEvent(message: string, level: Sentry.SeverityLevel = 'info', extra?: Record<string, any>) {
  Sentry.captureMessage(message, {
    level,
    extra,
  });
}

// Set user context
export function setUserContext(userId: string, email?: string, displayName?: string) {
  Sentry.setUser({
    id: userId,
    email,
    username: displayName,
  });
}

// Clear user context
export function clearUserContext() {
  Sentry.setUser(null);
}

// Add breadcrumb
export function addBreadcrumb(message: string, category?: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

export { Sentry };
