import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
const mixpanelEnabled = Boolean(MIXPANEL_TOKEN);

if (mixpanelEnabled) {
  mixpanel.init(MIXPANEL_TOKEN!, {
    // 1. THE CONSENT GATE: This makes it illegal for Mixpanel to track anything
    // until mixpanel.opt_in_tracking() is explicitly called later.
    opt_out_tracking_by_default: true,

    // 2. PRIVACY: Prevents Mixpanel from grabbing the user's IP address automatically.
    ip: false,

    debug: process.env.NODE_ENV !== 'production',
  });
}

export function isMixpanelEnabled(): boolean {
  return mixpanelEnabled;
}

/** Safe identify — no-op when Mixpanel is not configured (avoids breaking auth flows). */
export function identifyMixpanelUser(userId: string): void {
  if (!mixpanelEnabled || !userId.trim()) return;
  try {
    mixpanel.identify(userId);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[mixpanel] identify failed:', error);
    }
  }
}

/** Safe track — no-op when Mixpanel is not configured. */
export function trackMixpanelEvent(
  event: string,
  properties?: Record<string, unknown>,
): void {
  if (!mixpanelEnabled || !event.trim()) return;
  try {
    mixpanel.track(event, properties);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[mixpanel] track failed:', error);
    }
  }
}

/** Clear Mixpanel identity on logout. */
export function resetMixpanelUser(): void {
  if (!mixpanelEnabled) return;
  try {
    mixpanel.reset();
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[mixpanel] reset failed:', error);
    }
  }
}

export default mixpanel;
