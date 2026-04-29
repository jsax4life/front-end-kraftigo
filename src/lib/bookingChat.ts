import type { Booking } from "@/types";

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

/**
 * Reads a DM conversation UUID from a booking payload when the API provides it
 * (top-level, nested `conversation`, or nested `chat`).
 */
export function readDmConversationIdFromBooking(b: Booking): string | undefined {
  const ext = b as unknown as Record<string, unknown>;
  const direct =
    str(ext.conversationId) ??
    str(ext.conversation_id) ??
    str(ext.chatConversationId) ??
    str(ext.chat_conversation_id) ??
    str(ext.dmConversationId) ??
    str(ext.dm_conversation_id);
  if (direct) return direct;

  const conv = ext.conversation;
  if (conv && typeof conv === "object" && !Array.isArray(conv)) {
    const c = conv as Record<string, unknown>;
    const nested = str(c.id) ?? str(c.conversationId) ?? str(c.conversation_id);
    if (nested) return nested;
  }

  const chat = ext.chat;
  if (chat && typeof chat === "object" && !Array.isArray(chat)) {
    const ch = chat as Record<string, unknown>;
    const nested = str(ch.id) ?? str(ch.conversationId) ?? str(ch.conversation_id);
    if (nested) return nested;
  }

  return undefined;
}
