import { create } from 'zustand'
import type { Booking, BookingStatus } from '@/types'
import {
  getMyBookings,
  getBookingById,
  createBooking,
  updateBooking,
  cancelBooking,
  confirmBooking,
  respondToBooking,
  type CreateBookingPayload,
  type UpdateBookingPayload,
  type ArtisanRespondPayload,
} from '@/lib/api/bookings'

interface BookingsState {
  // State
  bookings: Booking[]
  selectedBooking: Booking | null
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
  lastFetchStatus: 'idle' | 'success' | 'error' | 'empty'

  // Customer actions
  fetchMyBookings: () => Promise<void>
  fetchBookingById: (id: string) => Promise<Booking>
  createBooking: (payload: CreateBookingPayload) => Promise<Booking>
  updateBooking: (id: string, payload: UpdateBookingPayload) => Promise<Booking>
  cancelBooking: (id: string, reason?: string) => Promise<void>
  confirmBooking: (id: string) => Promise<Booking>

  // Artisan actions
  respondToBooking: (id: string, payload: ArtisanRespondPayload) => Promise<Booking>

  // Selectors
  getUpcomingBookings: () => Booking[]
  getCompletedBookings: () => Booking[]
  getBookingsByStatus: (status: BookingStatus) => Booking[]

  // Helpers
  clearError: () => void
  clearSelectedBooking: () => void
}

const UPCOMING_STATUSES: BookingStatus[] = ['REQUESTED', 'ACCEPTED', 'COUNTERED', 'CONFIRMED', 'IN_PROGRESS']
const COMPLETED_STATUSES: BookingStatus[] = ['COMPLETED', 'CANCELLED', 'DISPUTED']

export const useBookingsStore = create<BookingsState>()((set, get) => ({
  // Initial state
  bookings: [],
  selectedBooking: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
  lastFetchStatus: 'idle',

  fetchMyBookings: async () => {
    set({ isLoading: true, error: null })
    try {
      const bookings = await getMyBookings()
      set({ 
        bookings, 
        isLoading: false, 
        lastFetchStatus: bookings.length > 0 ? 'success' : 'empty' 
      })
    } catch (err: any) {
      set({ 
        error: err.response?.data?.message || 'Failed to load bookings', 
        isLoading: false,
        lastFetchStatus: 'error'
      })
    }
  },

  fetchBookingById: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const booking = await getBookingById(id)
      set({ selectedBooking: booking, isLoading: false })
      return booking
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to load booking', isLoading: false })
      throw err
    }
  },

  createBooking: async (payload) => {
    set({ isSubmitting: true, error: null })
    try {
      const booking = await createBooking(payload)
      set((state) => ({
        bookings: [booking, ...state.bookings],
        isSubmitting: false,
      }))
      return booking
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to create booking', isSubmitting: false })
      throw err
    }
  },

  updateBooking: async (id, payload) => {
    set({ isSubmitting: true, error: null })
    try {
      const updated = await updateBooking(id, payload)
      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === id ? updated : b)),
        selectedBooking: state.selectedBooking?.id === id ? updated : state.selectedBooking,
        isSubmitting: false,
      }))
      return updated
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to update booking', isSubmitting: false })
      throw err
    }
  },

  cancelBooking: async (id, reason) => {
    set({ isSubmitting: true, error: null })
    try {
      const cancelled = await cancelBooking(id, reason)
      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === id ? cancelled : b)),
        selectedBooking: state.selectedBooking?.id === id ? cancelled : state.selectedBooking,
        isSubmitting: false,
      }))
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to cancel booking', isSubmitting: false })
      throw err
    }
  },

  confirmBooking: async (id) => {
    set({ isSubmitting: true, error: null })
    try {
      const confirmed = await confirmBooking(id)
      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === id ? confirmed : b)),
        selectedBooking: state.selectedBooking?.id === id ? confirmed : state.selectedBooking,
        isSubmitting: false,
      }))
      return confirmed
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to confirm booking', isSubmitting: false })
      throw err
    }
  },

  respondToBooking: async (id, payload) => {
    set({ isSubmitting: true, error: null })
    try {
      const updated = await respondToBooking(id, payload)
      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === id ? updated : b)),
        isSubmitting: false,
      }))
      return updated
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to respond to booking', isSubmitting: false })
      throw err
    }
  },

  // Selectors
  getUpcomingBookings: () =>
    get().bookings.filter((b) => UPCOMING_STATUSES.includes(b.status)),

  getCompletedBookings: () =>
    get().bookings.filter((b) => COMPLETED_STATUSES.includes(b.status)),

  getBookingsByStatus: (status) =>
    get().bookings.filter((b) => b.status === status),

  clearError: () => set({ error: null }),
  clearSelectedBooking: () => set({ selectedBooking: null }),
}))
