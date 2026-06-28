import type { CustomerProfile } from "@/types";

export type NotificationKey = "booking" | "support" | "promo" | "late" | "news";

export type UiNotificationSettings = Record<NotificationKey, boolean>;

export const DEFAULT_UI_NOTIFICATION_SETTINGS: UiNotificationSettings = {
  booking: true,
  support: true,
  promo: false,
  late: true,
  news: true,
};

export function uiFromNotificationPreferences(
  prefs: CustomerProfile["notificationPreferences"] | undefined,
): UiNotificationSettings {
  if (!prefs) return DEFAULT_UI_NOTIFICATION_SETTINGS;
  return {
    booking: prefs.bookingUpdates ?? true,
    support: prefs.email ?? true,
    promo: prefs.promotions ?? false,
    late: prefs.sms ?? true,
    news: prefs.push ?? true,
  };
}

export function uiSettingsToNotificationPreferences(
  settings: UiNotificationSettings,
): CustomerProfile["notificationPreferences"] {
  return {
    email: settings.support,
    sms: settings.late,
    push: settings.news,
    bookingUpdates: settings.booking,
    promotions: settings.promo,
  };
}
