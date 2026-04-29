import { create } from 'zustand'
import { Conversation, Message } from '@/types'
import api from '@/lib/axios'
import { getBookingById } from '@/lib/api/bookings'
import { getConversationByBookingId, getOrHydrateConversationForRoom } from '@/lib/api/conversations'
import { readDmConversationIdFromBooking } from '@/lib/bookingChat'
import {
  coerceApiMessage,
  ensureMessageHasConversationId,
  messageBelongsToConversation,
  messageConversationRoomId,
  unwrapMessageResponse,
} from '@/lib/chatMessaging'
import { normalizeConversationListItem } from '@/lib/conversationFromApi'
import { useAuthStore } from '@/store/useAuthStore'

function conversationListRoomId(conv: Pick<Conversation, 'id' | 'conversationId'>): string {
  return String(conv.conversationId ?? conv.id ?? '').trim()
}

/** List badge / row `unreadCount` is client-driven; clear when the user opens the thread. */
function conversationsWithUnreadClearedForRoom(conversations: Conversation[], room: string): Conversation[] {
  const r = room.trim()
  if (!r) return conversations
  return conversations.map((c) =>
    conversationListRoomId(c) === r ? { ...c, unreadCount: 0 } : c,
  )
}

interface ChatState {
  conversations: Conversation[]
  currentConversation: Conversation | null
  messages: Message[]
  isLoading: boolean
  error: string | null
  hasMore: boolean
  nextCursor: string | null
  /** Last time we saw peer activity in a room (their message or typing). Drives list “online” dot when API omits `isOnline`. */
  peerActivityAtByRoomId: Record<string, number>

  // Actions
  fetchConversations: (options?: { silent?: boolean }) => Promise<void>
  /**
   * After `select-krafter` / `select-applicant`, refetch the list so the new thread appears.
   * Optionally selects that conversation in the store (opens overlay on `/user/chat` when applicable).
   */
  refreshAfterKrafterOrApplicantSelection: (opts?: {
    otherParticipantId?: string | null;
  }) => Promise<void>
  fetchConversationById: (id: string) => Promise<void>
  fetchMessages: (id: string, cursor?: string) => Promise<void>
  sendMessage: (conversationId: string, content: string) => Promise<void>
  markAsRead: (conversationId: string, messageId: string) => Promise<void>
  
  // Real-time updates
  addMessage: (message: Message) => void
  updateReadStatus: (conversationId: string, userId: string, messageIds: string[]) => void
  updateConversationList: (message: Message) => void
  
  setCurrentConversation: (conversation: Conversation | null) => void
  clearError: () => void
  /** Mark a conversation room as having recent peer activity (socket / inbound message). */
  touchPeerActivityInRoom: (conversationRoomId: string) => void

  /**
   * Resolve a real conversation id for deep links (never use the other user’s id as `conversationId`).
   */
  ensureChatConversationForParticipant: (params: {
    otherUserId: string
    displayName: string
    displayAvatar?: string
    bookingId?: string | null
  }) => Promise<Conversation | null>
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  error: null,
  hasMore: false,
  nextCursor: null,
  peerActivityAtByRoomId: {},

  fetchConversations: async (options) => {
    const silent = options?.silent === true
    if (!silent) set({ isLoading: true, error: null })
    else set({ error: null })
    try {
      const response = await api.get('/api/conversations')
      const raw = Array.isArray(response.data) ? response.data : []
      const conversations = raw
        .map((row: unknown) => normalizeConversationListItem(row))
        .filter((c): c is Conversation => c != null)
      set((state) => {
        const openRoom = state.currentConversation
          ? conversationListRoomId(state.currentConversation)
          : ''
        const merged = openRoom
          ? conversations.map((c) =>
              conversationListRoomId(c) === openRoom ? { ...c, unreadCount: 0 } : c,
            )
          : conversations
        return { conversations: merged, isLoading: false }
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load conversations',
        isLoading: false,
      })
    }
  },

  refreshAfterKrafterOrApplicantSelection: async (opts) => {
    await get().fetchConversations({ silent: true })
    const pid = opts?.otherParticipantId?.trim()
    if (!pid) return
    const match = get().conversations.find((c) => c.otherParticipant?.id === pid)
    if (match) {
      get().setCurrentConversation(match)
    }
  },

  ensureChatConversationForParticipant: async ({
    otherUserId,
    displayName,
    displayAvatar,
    bookingId,
  }) => {
    const oid = otherUserId.trim()
    if (!oid) return null

    const fallbackAvatar = displayAvatar?.trim() || '/images/pro.jpg'
    const fallbacks = {
      otherUserId: oid,
      displayName: displayName.trim() || 'User',
      displayAvatar: fallbackAvatar,
    }

    const upsertList = (conv: Conversation) => {
      const room = String(conv.id ?? conv.conversationId ?? '').trim()
      if (!room) return
      set((s) => ({
        conversations: [
          conv,
          ...s.conversations.filter((c) => String(c.id ?? c.conversationId ?? '').trim() !== room),
        ],
      }))
    }

    await get().fetchConversations({ silent: true })
    const hit = get().conversations.find((c) => c.otherParticipant?.id === oid)
    if (hit) return hit

    const bid = bookingId?.trim()
    if (bid) {
      try {
        const byBooking = await getConversationByBookingId(bid, { createIfMissing: true })
        if (byBooking?.conversationId) {
          const conv = await getOrHydrateConversationForRoom(byBooking.conversationId, fallbacks)
          upsertList(conv)
          return conv
        }
      } catch {
        /* by-booking unavailable or forbidden */
      }

      try {
        const booking = await getBookingById(bid)
        const room = readDmConversationIdFromBooking(booking)
        if (room) {
          const conv = await getOrHydrateConversationForRoom(room, fallbacks)
          upsertList(conv)
          return conv
        }
      } catch {
        /* booking fetch failed */
      }
    }

    return null
  },

  fetchConversationById: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get(`/api/conversations/${id}`)
      const normalized = normalizeConversationListItem(response.data)
      const next = normalized ?? (response.data as Conversation)
      const room = conversationListRoomId(next)
      set((state) => ({
        currentConversation: next,
        isLoading: false,
        conversations: room ? conversationsWithUnreadClearedForRoom(state.conversations, room) : state.conversations,
      }))
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch conversation',
        isLoading: false 
      })
    }
  },

  fetchMessages: async (id: string, cursor?: string) => {
    set({ isLoading: true, error: null })
    try {
      const url = `/api/conversations/${id}/messages${cursor ? `?cursor=${cursor}` : ''}`
      const response = await api.get(url)
      const { messages, nextCursor, hasMore } = response.data

      const rawList = Array.isArray(messages) ? messages : []
      const normalized: Message[] = rawList
        .map((m: unknown): Message | null => {
          let c = coerceApiMessage(m)
          if (!c && m && typeof m === "object") {
            c = coerceApiMessage({
              ...(m as Record<string, unknown>),
              conversationId: id,
            })
          }
          if (!c) return null
          return ensureMessageHasConversationId(c, id)
        })
        .filter((m): m is Message => m != null)

      set((state) => {
        const room = id.trim()
        let nextMessages: Message[]
        if (cursor) {
          nextMessages = [...state.messages, ...normalized]
        } else {
          /** Merge so a slow initial fetch does not wipe messages just sent while the request was in flight. */
          const merged = new Map<string, Message>()
          for (const m of normalized) merged.set(m.id, m)
          for (const m of state.messages) {
            if (messageConversationRoomId(m) !== room) continue
            if (!merged.has(m.id)) merged.set(m.id, m)
          }
          nextMessages = Array.from(merged.values()).sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          )
        }
        return {
          messages: nextMessages,
          nextCursor: nextCursor ?? null,
          hasMore: hasMore ?? false,
          isLoading: false,
          conversations: !cursor
            ? conversationsWithUnreadClearedForRoom(state.conversations, room)
            : state.conversations,
        }
      })

      if (!cursor) {
        const room = id.trim()
        const myId = useAuthStore.getState().user?.id?.trim() ?? ''
        const snapshot = get().messages
        const toMark = myId
          ? snapshot.filter(
              (m) =>
                messageConversationRoomId(m) === room &&
                m.sender.id !== myId &&
                !(m.readBy ?? []).includes(myId),
            )
          : []
        const cap = 40
        for (let i = 0; i < Math.min(toMark.length, cap); i += 1) {
          void get().markAsRead(room, toMark[i]!.id).catch(() => {})
        }
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load messages',
        isLoading: false,
      })
    }
  },

  sendMessage: async (conversationId: string, content: string) => {
    const room = conversationId.trim()
    set({ error: null })
    try {
      const response = await api.post(`/api/conversations/${room}/messages`, { content })
      const raw = unwrapMessageResponse(response.data)
      let newMessage = coerceApiMessage(raw)
      if (!newMessage && raw && typeof raw === 'object') {
        newMessage = coerceApiMessage({
          ...(raw as Record<string, unknown>),
          conversationId: room,
        })
      }
      if (!newMessage) {
        set({ error: 'Unexpected response when sending message' })
        return
      }
      newMessage = ensureMessageHasConversationId(newMessage, room)

      set((state) => ({
        messages: state.messages.some((m) => m.id === newMessage!.id)
          ? state.messages
          : [newMessage!, ...state.messages],
      }))

      get().updateConversationList(newMessage)
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to send message'
      })
      throw error
    }
  },

  markAsRead: async (conversationId: string, messageId: string) => {
    try {
      await api.put(`/api/conversations/${conversationId}/messages/${messageId}/read`)
    } catch (error) {
      console.error('Failed to mark message as read', error)
    }
  },

  addMessage: (message: Message) => {
    const { currentConversation, messages } = get()

    if (messageBelongsToConversation(message, currentConversation)) {
      if (!messages.some((m) => m.id === message.id)) {
        set({ messages: [message, ...messages] })
      }
    }

    get().updateConversationList(message)
    const myId = useAuthStore.getState().user?.id?.trim() ?? ''
    const fromSelf = Boolean(myId && message.sender.id === myId)
    if (!fromSelf) {
      const room = messageConversationRoomId(message)
      if (room) get().touchPeerActivityInRoom(room)
    }
  },

  updateReadStatus: (conversationId: string, userId: string, messageIds: string[]) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        messageIds.includes(m.id) && !(m.readBy ?? []).includes(userId)
          ? { ...m, readBy: [...(m.readBy ?? []), userId] }
          : m,
      ),
    }))
  },

  updateConversationList: (message: Message) => {
    const msgRoom = messageConversationRoomId(message)
    const myId = useAuthStore.getState().user?.id?.trim() ?? ''
    const fromSelf = Boolean(myId && message.sender.id === myId)
    set((state) => ({
      conversations: state.conversations
        .map((conv) => {
          const convRoom = String(conv.id ?? conv.conversationId ?? '').trim()
          if (msgRoom && convRoom === msgRoom) {
            const viewingThis =
              state.currentConversation &&
              messageBelongsToConversation(message, state.currentConversation)
            const incrementUnread = !viewingThis && !fromSelf
            return {
              ...conv,
              lastMessage: message.content,
              lastMessageAt: message.createdAt,
              unreadCount: incrementUnread ? (conv.unreadCount || 0) + 1 : conv.unreadCount,
            }
          }
          return conv
        })
        .sort((a, b) => {
          const dateA = new Date(a.lastMessageAt || 0).getTime()
          const dateB = new Date(b.lastMessageAt || 0).getTime()
          return dateB - dateA
        }),
    }))
  },

  setCurrentConversation: (conversation) =>
    set((state) => {
      const room = conversation ? conversationListRoomId(conversation) : ''
      return {
        currentConversation: conversation,
        messages: [],
        conversations: room ? conversationsWithUnreadClearedForRoom(state.conversations, room) : state.conversations,
      }
    }),
  clearError: () => set({ error: null }),

  touchPeerActivityInRoom: (conversationRoomId: string) => {
    const r = conversationRoomId.trim()
    if (!r) return
    set((s) => ({
      peerActivityAtByRoomId: { ...s.peerActivityAtByRoomId, [r]: Date.now() },
    }))
  },
}))
