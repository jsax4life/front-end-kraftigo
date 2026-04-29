"use client";

import { useEffect, useState } from "react";
import { useChatStore } from "@/store/useChatStore";
import type { Conversation } from "@/types";

/** Inbox list: green after peer activity for this long (no explicit API `isOnline`). */
export const CHAT_PEER_ACTIVITY_WINDOW_MS = 5 * 60 * 1000;

/** While this conversation is open, keep green longer so it does not flip to grey mid-read. */
const CHAT_PEER_ACTIVITY_WINDOW_VIEWING_MS = 45 * 60 * 1000;

/** Re-evaluate “recently active” so the dot can turn grey when the window expires. */
const PRESENCE_TICK_MS = 15_000;

export function useChatPresenceDotIsGreen(chat: Conversation): boolean {
  const room = String(chat.conversationId ?? chat.id ?? "").trim();
  const peerTs = useChatStore((s) => (room ? s.peerActivityAtByRoomId[room] ?? 0 : 0));
  const currentRoom = useChatStore((s) =>
    s.currentConversation
      ? String(s.currentConversation.conversationId ?? s.currentConversation.id ?? "").trim()
      : "",
  );

  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), PRESENCE_TICK_MS);
    return () => clearInterval(id);
  }, []);

  const viewingThis = Boolean(room && currentRoom === room);
  const windowMs = viewingThis ? CHAT_PEER_ACTIVITY_WINDOW_VIEWING_MS : CHAT_PEER_ACTIVITY_WINDOW_MS;

  const now = Date.now();
  const recentlyActive = Boolean(room) && peerTs > 0 && now - peerTs < windowMs;
  return chat.otherParticipant?.isOnline === true || recentlyActive;
}
