import api from '@/lib/axios'
import type { Conversation } from '@/types'
import { parseConversationPayload } from '@/lib/conversationFromApi'

/** `GET /api/conversations/by-booking/:bookingId` */
export interface ConversationByBookingResponse {
  conversationId: string
  created: boolean
}

function unwrapByBookingPayload(data: unknown): ConversationByBookingResponse | null {
  const r = data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>) : null
  if (!r) return null
  const inner = r.data && typeof r.data === 'object' && !Array.isArray(r.data) ? (r.data as Record<string, unknown>) : r
  const cid = inner.conversationId ?? inner.conversation_id
  if (typeof cid !== 'string' || !cid.trim()) return null
  const created = Boolean(inner.created)
  return { conversationId: cid.trim(), created }
}

/**
 * Resolve the chat room UUID for a booking (optional create when backend allows).
 */
export async function getConversationByBookingId(
  bookingId: string,
  options?: { createIfMissing?: boolean },
): Promise<ConversationByBookingResponse | null> {
  const id = bookingId.trim()
  if (!id) return null
  const createIfMissing = options?.createIfMissing !== false
  try {
    const res = await api.get<unknown>(`/api/conversations/by-booking/${encodeURIComponent(id)}`, {
      params: { createIfMissing },
    })
    return unwrapByBookingPayload(res.data)
  } catch {
    return null
  }
}

/**
 * Load `GET /api/conversations/:id` when possible; otherwise minimal row for sending messages.
 */
export async function getOrHydrateConversationForRoom(
  roomId: string,
  fallbacks: { otherUserId: string; displayName: string; displayAvatar?: string },
): Promise<Conversation> {
  const room = roomId.trim()
  const fa = {
    otherUserId: fallbacks.otherUserId.trim(),
    displayName: fallbacks.displayName.trim() || 'User',
    displayAvatar: fallbacks.displayAvatar?.trim() || '/images/pro.jpg',
  }
  try {
    const res = await api.get(`/api/conversations/${encodeURIComponent(room)}`)
    const parsed = parseConversationPayload(res.data, fa)
    if (parsed) return parsed
  } catch {
    /* use synthetic below */
  }
  return {
    id: room,
    conversationId: room,
    otherParticipant: {
      id: fa.otherUserId,
      name: fa.displayName,
      avatar: fa.displayAvatar,
      isOnline: false,
    },
    isLocked: false,
    unreadCount: 0,
  }
}
