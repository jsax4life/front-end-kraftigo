"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import {
  useDomainNotificationHistoryStore,
  type DomainNotificationFeedAction,
  type DomainNotificationFeedItem,
} from "@/store/useDomainNotificationHistoryStore";

function formatAge(createdAt: number): string {
  const sec = Math.floor((Date.now() - createdAt) / 1000);
  if (sec < 45) return "Just now";
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function runStoredAction(action: DomainNotificationFeedAction) {
  if (typeof window === "undefined") return;
  if (action === "krafts") window.location.assign("/user/krafts");
  else if (action === "requests") window.location.assign("/tasker/requests");
  else if (action === "home") window.location.assign("/user/home");
}

type Props = {
  /** Extra classes on the outer wrapper (e.g. shrink-0). */
  className?: string;
  /** Open the panel above the bell (use when the bell sits at the bottom of the viewport). */
  preferPanelAbove?: boolean;
};

export default function DomainNotificationBell({
  className = "",
  preferPanelAbove = false,
}: Props) {
  const items = useDomainNotificationHistoryStore((s) => s.items);
  const markRead = useDomainNotificationHistoryStore((s) => s.markRead);
  const markAllRead = useDomainNotificationHistoryStore((s) => s.markAllRead);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const unreadCount = items.filter((i) => !i.read).length;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const onRowClick = (item: DomainNotificationFeedItem) => {
    markRead(item.id);
    if (item.action) {
      runStoredAction(item.action);
      setOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      <button
        type="button"
        aria-label="Activity and notifications"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full bg-[#F2F2F2] p-2 transition-colors hover:bg-gray-200"
      >
        <Bell size={22} className="text-gray-700 sm:h-6 sm:w-6" />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-orange px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className={`absolute right-0 z-50 max-h-[min(70vh,24rem)] w-[min(calc(100vw-2rem),22rem)] overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_12px_40px_-12px_rgba(0,0,0,0.2)] ring-1 ring-black/[0.04] ${
            preferPanelAbove ? "bottom-[calc(100%+0.5rem)]" : "top-[calc(100%+0.5rem)]"
          }`}
          role="dialog"
          aria-label="Recent notifications"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5">
            <p className="font-gerat text-[15px] font-bold text-gray-900">Activity</p>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => markAllRead()}
                className="font-poppins text-[12px] font-semibold text-brand-orange hover:text-orange-700"
              >
                Mark all read
              </button>
            ) : null}
          </div>
          <div className="max-h-[min(60vh,20rem)] overflow-y-auto overscroll-contain">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center font-poppins text-[13px] text-gray-500">
                No activity yet. Booking and payment updates will appear here if you miss a
                pop-up.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onRowClick(item)}
                      className={`flex w-full flex-col gap-0.5 px-3 py-3 text-left transition-colors hover:bg-gray-50 ${
                        item.read ? "opacity-80" : "bg-orange-50/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`font-gerat text-[14px] leading-tight ${
                            item.read ? "font-semibold text-gray-800" : "font-bold text-gray-900"
                          }`}
                        >
                          {item.title}
                        </span>
                        <span className="shrink-0 font-poppins text-[11px] text-gray-400">
                          {formatAge(item.createdAt)}
                        </span>
                      </div>
                      <p className="line-clamp-2 font-poppins text-[12px] leading-snug text-gray-600">
                        {item.body}
                      </p>
                      {item.action ? (
                        <span className="mt-1 font-poppins text-[11px] font-semibold text-brand-orange">
                          Open →
                        </span>
                      ) : (
                        <span className="mt-1 font-poppins text-[11px] text-gray-400">
                          Tap to mark read
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
