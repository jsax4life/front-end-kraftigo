"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useProfileStore } from "@/store/useProfileStore";
import {
  DEFAULT_UI_NOTIFICATION_SETTINGS,
  type NotificationKey,
  type UiNotificationSettings,
  uiFromNotificationPreferences,
  uiSettingsToNotificationPreferences,
} from "@/lib/notificationPreferences";

const SAVE_DEBOUNCE_MS = 700;

export function useNotificationPreferences() {
  const { customerProfile, fetchCustomerProfile, updateCustomerProfile, isLoading } = useProfileStore();
  const [settings, setSettings] = useState<UiNotificationSettings>(DEFAULT_UI_NOTIFICATION_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSettingsRef = useRef<UiNotificationSettings>(DEFAULT_UI_NOTIFICATION_SETTINGS);
  const hydratedRef = useRef(false);

  useEffect(() => {
    void fetchCustomerProfile();
  }, [fetchCustomerProfile]);

  useEffect(() => {
    if (!customerProfile?.notificationPreferences) return;
    if (isSaving) return;
    const fromProfile = uiFromNotificationPreferences(customerProfile.notificationPreferences);
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      setSettings(fromProfile);
      pendingSettingsRef.current = fromProfile;
      return;
    }
    setSettings(fromProfile);
    pendingSettingsRef.current = fromProfile;
  }, [customerProfile?.notificationPreferences, isSaving]);

  useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    },
    [],
  );

  const flushSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await updateCustomerProfile({
        notificationPreferences: uiSettingsToNotificationPreferences(pendingSettingsRef.current),
      });
    } catch {
      toast.error("Could not save notification preferences. Try again.");
      if (customerProfile?.notificationPreferences) {
        const restored = uiFromNotificationPreferences(customerProfile.notificationPreferences);
        setSettings(restored);
        pendingSettingsRef.current = restored;
      }
    } finally {
      setIsSaving(false);
    }
  }, [updateCustomerProfile, customerProfile?.notificationPreferences]);

  const scheduleSave = useCallback(
    (next: UiNotificationSettings) => {
      pendingSettingsRef.current = next;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveTimerRef.current = null;
        void flushSave();
      }, SAVE_DEBOUNCE_MS);
    },
    [flushSave],
  );

  const toggle = useCallback(
    (key: NotificationKey) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: !prev[key] };
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  return {
    settings,
    toggle,
    isLoading,
    isSaving,
  };
}
