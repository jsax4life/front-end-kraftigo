import type { Message } from "@/types";

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

/** REST POST `/messages` may return the entity or `{ message }` / `{ data }`. */
export function unwrapMessageResponse(data: unknown): unknown {
  const d = asRecord(data);
  if (!d) return data;
  if (d.message && typeof d.message === "object") return d.message;
  if (d.data && typeof d.data === "object") return d.data;
  return data;
}

/** Normalize API / socket payload into a `Message` when possible. */
export function coerceApiMessage(raw: unknown): Message | null {
  const r = asRecord(raw);
  if (!r) return null;
  const id = String(r.id ?? "").trim();
  const conversationId = String(
    r.conversationId ?? r.conversation_id ?? "",
  ).trim();
  if (!id || !conversationId) return null;

  const senderRaw = asRecord(r.sender);
  const sender = senderRaw
    ? {
        id: String(senderRaw.id ?? ""),
        name: String(senderRaw.name ?? senderRaw.firstName ?? "User"),
        avatar: typeof senderRaw.avatar === "string" ? senderRaw.avatar : undefined,
      }
    : { id: "", name: "User" };

  const readRaw = r.readBy ?? r.read_by;
  const readBy = Array.isArray(readRaw)
    ? readRaw.filter((x): x is string => typeof x === "string")
    : [];

  const typeRaw = r.type;
  const type: Message["type"] =
    typeRaw === "image" || typeRaw === "file" ? typeRaw : "text";

  return {
    id,
    conversationId,
    sender,
    content: String(r.content ?? ""),
    type,
    readBy,
    createdAt: String(r.createdAt ?? r.created_at ?? new Date().toISOString()),
  };
}

/** Socket.IO `new_message` may send `{ message }` or the message object at the root. */
export function parseNewMessageSocketPayload(data: unknown): Message | null {
  const d = asRecord(data);
  if (!d) return null;
  const inner = d.message !== undefined ? d.message : data;
  const roomHint = String(d.conversationId ?? d.conversation_id ?? "").trim();
  let msg = coerceApiMessage(inner);
  if (!msg && roomHint && inner && typeof inner === "object") {
    msg = coerceApiMessage({
      ...(inner as Record<string, unknown>),
      conversationId: roomHint,
    });
  }
  return msg;
}

export function messageConversationRoomId(message: Message): string {
  const m = message as Message & { conversation_id?: string };
  return String(message.conversationId ?? m.conversation_id ?? "").trim();
}

export function conversationRoomIds(conv: { id?: string; conversationId?: string } | null): string[] {
  if (!conv) return [];
  return [conv.id, conv.conversationId]
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((x) => x.trim());
}

export function messageBelongsToConversation(message: Message, conv: { id?: string; conversationId?: string } | null): boolean {
  const room = messageConversationRoomId(message);
  if (!room) return false;
  const rooms = new Set(conversationRoomIds(conv));
  return rooms.has(room);
}

/** Some list endpoints omit `conversationId` on each message; attach from the URL segment. */
export function ensureMessageHasConversationId(message: Message, conversationId: string): Message {
  const room = messageConversationRoomId(message);
  if (room) return message;
  return { ...message, conversationId: conversationId.trim() };
}
