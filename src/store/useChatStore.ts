import { create } from 'zustand'
import { Conversation, Message } from '@/types'
import api from '@/lib/axios'

interface ChatState {
  conversations: Conversation[]
  currentConversation: Conversation | null
  messages: Message[]
  isLoading: boolean
  error: string | null
  hasMore: boolean
  nextCursor: string | null

  // Actions
  fetchConversations: () => Promise<void>
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
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  error: null,
  hasMore: false,
  nextCursor: null,

  fetchConversations: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get('/api/conversations')
      set({ conversations: response.data || [], isLoading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch conversations',
        isLoading: false 
      })
    }
  },

  fetchConversationById: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get(`/api/conversations/${id}`)
      set({ currentConversation: response.data, isLoading: false })
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
      
      set((state) => ({ 
        messages: cursor ? [...state.messages, ...(messages || [])] : (messages || []), 
        nextCursor, 
        hasMore,
        isLoading: false 
      }))
    } catch (error: any) {
      set({ 
        messages: [],
        error: error.response?.data?.message || 'Failed to fetch messages',
        isLoading: false 
      })
    }
  },

  sendMessage: async (conversationId: string, content: string) => {
    set({ error: null })
    try {
      const response = await api.post(`/api/conversations/${conversationId}/messages`, { content })
      const newMessage = response.data
      
      set((state) => ({
        messages: [newMessage, ...state.messages],
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
    
    // If it's the current conversation, add to messages
    if (currentConversation && (currentConversation.id === message.conversationId || currentConversation.conversationId === message.conversationId)) {
      set({ messages: [message, ...messages] })
    }
    
    // Update the conversation list
    get().updateConversationList(message)
  },

  updateReadStatus: (conversationId: string, userId: string, messageIds: string[]) => {
    set((state) => ({
      messages: state.messages.map(m => 
        messageIds.includes(m.id) && !m.readBy.includes(userId)
          ? { ...m, readBy: [...m.readBy, userId] }
          : m
      )
    }))
  },

  updateConversationList: (message: Message) => {
    set((state) => ({
      conversations: state.conversations.map(conv => {
        const convId = conv.id || conv.conversationId
        if (convId === message.conversationId) {
          return {
            ...conv,
            lastMessage: message.content,
            lastMessageAt: message.createdAt,
            unreadCount: (state.currentConversation?.id === convId || state.currentConversation?.conversationId === convId) 
              ? conv.unreadCount 
              : (conv.unreadCount || 0) + 1
          }
        }
        return conv
      }).sort((a, b) => {
        const dateA = new Date(a.lastMessageAt || 0).getTime()
        const dateB = new Date(b.lastMessageAt || 0).getTime()
        return dateB - dateA
      })
    }))
  },

  setCurrentConversation: (conversation) => set({ currentConversation: conversation, messages: [] }),
  clearError: () => set({ error: null }),
}))
