"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useBookingsStore } from "@/store/useBookingsStore";
import { useCustomKraftsStore } from "@/store/useCustomKraftsStore";
import { useChatStore } from "@/store/useChatStore";
import {
  connectDomainEventsSocket,
  disconnectDomainEventsSocket,
} from "@/lib/domainEventsSocket";
import { showDomainEventNotification } from "@/lib/domainEventNotifications";

let refetchDebounce: ReturnType<typeof setTimeout> | null = null;
let pendingChatListRefetch = false;

const DOMAIN_EVENTS_THAT_REFRESH_CHAT = new Set([
  "KRAFTER_SELECTED",
  "BOOKING_CREATED",
  "BOOKING_CONFIRMED",
]);

function scheduleStoresRefresh(msg?: Record<string, unknown>) {
  const t = typeof msg?.type === "string" ? msg.type : "";
  if (t && DOMAIN_EVENTS_THAT_REFRESH_CHAT.has(t)) {
    pendingChatListRefetch = true;
  }
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

    if (pendingChatListRefetch) {
      pendingChatListRefetch = false;
      void useChatStore.getState().fetchConversations({ silent: true }).catch(() => {});
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
    scheduleStoresRefresh(msg);
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

  return null;
}
