import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const MAX_ITEMS = 80;

export type DomainNotificationFeedAction =
  | "krafts"
  | "requests"
  | "schedule"
  | "home"
  | "verification"
  | null;

export type DomainNotificationFeedItem = {
  id: string;
  eventType: string;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
  bookingId?: string;
  action: DomainNotificationFeedAction;
};

type FeedPayload = Omit<DomainNotificationFeedItem, "id" | "read"> & { id?: string };

type State = {
  items: DomainNotificationFeedItem[];
  add: (entry: FeedPayload) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
};

export const useDomainNotificationHistoryStore = create<State>()(
  persist(
    (set) => ({
      items: [],
      add: (entry) => {
        const id =
          entry.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
        const item: DomainNotificationFeedItem = {
          id,
          eventType: entry.eventType,
          title: entry.title,
          body: entry.body,
          createdAt: entry.createdAt,
          read: false,
          bookingId: entry.bookingId,
          action: entry.action,
        };
        set((s) => ({
          items: [item, ...s.items].slice(0, MAX_ITEMS),
        }));
      },
      markRead: (id) =>
        set((s) => ({
          items: s.items.map((x) => (x.id === id ? { ...x, read: true } : x)),
        })),
      markAllRead: () =>
        set((s) => ({
          items: s.items.map((x) => ({ ...x, read: true })),
        })),
      clearAll: () => set({ items: [] }),
    }),
    {
      name: "kraftigo-domain-notification-feed",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
    },
  ),
);
