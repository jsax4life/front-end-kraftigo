"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useBookingsStore } from "@/store/useBookingsStore";
import { useCustomKraftsStore } from "@/store/useCustomKraftsStore";
import {
  connectDomainEventsSocket,
  disconnectDomainEventsSocket,
} from "@/lib/domainEventsSocket";
import { showDomainEventNotification } from "@/lib/domainEventNotifications";
import DomainNotificationBell from "@/components/shared/DomainNotificationBell";

let refetchDebounce: ReturnType<typeof setTimeout> | null = null;

function scheduleStoresRefresh() {
  if (refetchDebounce) clearTimeout(refetchDebounce);
  refetchDebounce = setTimeout(() => {
    refetchDebounce = null;
    const auth = useAuthStore.getState();
    if (!auth.isAuthenticated) return;

    const bookings = useBookingsStore.getState();
    void bookings.fetchMyBookings().catch(() => {});

    if (auth.isTasker()) {
      void bookings.fetchArtisanBookings().catch(() => {});
      void bookings.fetchMarketplaceApplications().catch(() => {});
      void bookings.fetchDirectArtisanBookings().catch(() => {});
    }

    if (auth.isUser()) {
      void useCustomKraftsStore.getState().fetchMyCustomKrafts().catch(() => {});
    }
  }, 450);
}

/**
 * Subscribes to Socket.IO `/events` when the user is authenticated (see `frontend-realtime-events.md`).
 */
export default function DomainEventsListener() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const onEventRef = useRef<(msg: Record<string, unknown>) => void>(() => {});
  onEventRef.current = (msg: Record<string, unknown>) => {
    showDomainEventNotification(msg);
    scheduleStoresRefresh();
  };

  const stableHandler = useCallback((msg: Record<string, unknown>) => {
    onEventRef.current(msg);
  }, []);

  useEffect(() => {
    if (!accessToken || !isAuthenticated) {
      disconnectDomainEventsSocket();
      return;
    }
    connectDomainEventsSocket(accessToken, stableHandler);
    return () => {
      disconnectDomainEventsSocket();
    };
  }, [accessToken, isAuthenticated, stableHandler]);

  if (!accessToken || !isAuthenticated) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[55] flex justify-center">
      <div className="relative w-full max-w-[480px] px-3 pt-2">
        <div className="pointer-events-auto absolute right-3 top-2 sm:right-4">
          <DomainNotificationBell />
        </div>
      </div>
    </div>
  );
}
