import { create } from 'zustand'
import type { Booking, BookingStatus } from '@/types'
import {
  getMyBookings,
  getBookingById,
  getBookingApplicants,
  createBooking,
  createBookingForRecommendation,
  publishToMarketplace,
  getRecommendations,
  updateBooking,
  cancelBooking,
  confirmBooking,
  proceedToPayment,
  selectApplicant,
  selectKrafter,
  compareKrafters,
  respondToBooking,
  getArtisanBookings,
  getDirectArtisanBookings,
  getMarketplaceApplications,
  startBooking as startBookingApi,
  completeBooking as completeBookingApi,
  applyToBooking as applyToBookingApi,
  type CreateBookingPayload,
  type CreateBookingForRecommendationPayload,
  type PublishToMarketplacePayload,
  type GetRecommendationsPayload,
  type UpdateBookingPayload,
  type ArtisanRespondPayload,
  type ArtisanApplyPayload,
  type SelectApplicantPayload,
  type SelectKrafterPayload,
  type CompareKraftersPayload,
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
  fetchBookingApplicants: (id: string) => Promise<any[]>
  createBooking: (payload: CreateBookingPayload) => Promise<Booking>
  createBookingForRecommendation: (payload: CreateBookingForRecommendationPayload) => Promise<Booking>
  publishToMarketplace: (payload: PublishToMarketplacePayload) => Promise<Booking>
  getRecommendations: (payload: GetRecommendationsPayload) => Promise<any[]>
  updateBooking: (id: string, payload: UpdateBookingPayload) => Promise<Booking>
  cancelBooking: (id: string, reason?: string) => Promise<void>
  confirmBooking: (id: string) => Promise<Booking>
  proceedToPayment: (id: string) => Promise<Booking>
  selectApplicant: (id: string, payload: SelectApplicantPayload) => Promise<Booking>
  selectKrafter: (id: string, payload: SelectKrafterPayload) => Promise<Booking>
  compareKrafters: (payload: CompareKraftersPayload) => Promise<any>

  // Artisan actions
  fetchArtisanBookings: () => Promise<void>
  fetchDirectArtisanBookings: () => Promise<void>
  fetchMarketplaceApplications: () => Promise<void>
  respondToBooking: (id: string, payload: ArtisanRespondPayload) => Promise<Booking>
  applyToBooking: (id: string, payload: ArtisanApplyPayload) => Promise<Booking>
  startBooking: (id: string) => Promise<Booking>
  completeBooking: (id: string) => Promise<Booking>

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

  fetchBookingApplicants: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const applicants = await getBookingApplicants(id)
      set({ isLoading: false })
      return applicants
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to load applicants', isLoading: false })
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

  createBookingForRecommendation: async (payload) => {
    set({ isSubmitting: true, error: null })
    try {
      const booking = await createBookingForRecommendation(payload)
      set((state) => ({
        bookings: [booking, ...state.bookings],
        isSubmitting: false,
      }))
      return booking
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to create booking for recommendation', isSubmitting: false })
      throw err
    }
  },

  publishToMarketplace: async (payload) => {
    set({ isSubmitting: true, error: null })
    try {
      const booking = await publishToMarketplace(payload)
      set((state) => ({
        bookings: [booking, ...state.bookings],
        isSubmitting: false,
      }))
      return booking
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to publish to marketplace', isSubmitting: false })
      throw err
    }
  },

  getRecommendations: async (payload) => {
    set({ isLoading: true, error: null })
    try {
      const recommendations = await getRecommendations(payload)
      set({ isLoading: false })
      return recommendations
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to get recommendations', isLoading: false })
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

  proceedToPayment: async (id) => {
    set({ isSubmitting: true, error: null })
    try {
      const updated = await proceedToPayment(id)
      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === id ? updated : b)),
        selectedBooking: state.selectedBooking?.id === id ? updated : state.selectedBooking,
        isSubmitting: false,
      }))
      return updated
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to proceed to payment', isSubmitting: false })
      throw err
    }
  },

  selectApplicant: async (id, payload) => {
    set({ isSubmitting: true, error: null })
    try {
      const updated = await selectApplicant(id, payload)
      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === id ? updated : b)),
        selectedBooking: state.selectedBooking?.id === id ? updated : state.selectedBooking,
        isSubmitting: false,
      }))
      return updated
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to select applicant', isSubmitting: false })
      throw err
    }
  },

  selectKrafter: async (id, payload) => {
    set({ isSubmitting: true, error: null })
    try {
      const updated = await selectKrafter(id, payload)
      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === id ? updated : b)),
        selectedBooking: state.selectedBooking?.id === id ? updated : state.selectedBooking,
        isSubmitting: false,
      }))
      return updated
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to select Krafter', isSubmitting: false })
      throw err
    }
  },

  compareKrafters: async (payload) => {
    set({ isLoading: true, error: null })
    try {
      const comparison = await compareKrafters(payload)
      set({ isLoading: false })
      return comparison
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to compare Krafters', isLoading: false })
      throw err
    }
  },

  fetchArtisanBookings: async () => {
    set({ isLoading: true, error: null })
    try {
      const bookings = await getArtisanBookings()
      set({
        bookings,
        isLoading: false,
        lastFetchStatus: bookings.length > 0 ? 'success' : 'empty',
      })
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to load artisan bookings',
        isLoading: false,
        lastFetchStatus: 'error',
      })
    }
  },

  fetchDirectArtisanBookings: async () => {
    set({ isLoading: true, error: null })
    try {
      const bookings = await getDirectArtisanBookings()
      set({
        bookings,
        isLoading: false,
        lastFetchStatus: bookings.length > 0 ? 'success' : 'empty',
      })
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to load direct artisan bookings',
        isLoading: false,
        lastFetchStatus: 'error',
      })
    }
  },

  fetchMarketplaceApplications: async () => {
    set({ isLoading: true, error: null })
    try {
      const bookings = await getMarketplaceApplications()
      set({
        bookings,
        isLoading: false,
        lastFetchStatus: bookings.length > 0 ? 'success' : 'empty',
      })
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to load marketplace applications',
        isLoading: false,
        lastFetchStatus: 'error',
      })
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

  applyToBooking: async (id, payload) => {
    set({ isSubmitting: true, error: null })
    try {
      const updated = await applyToBookingApi(id, payload)
      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === id ? updated : b)),
        isSubmitting: false,
      }))
      return updated
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to apply to booking', isSubmitting: false })
      throw err
    }
  },

  startBooking: async (id) => {
    set({ isSubmitting: true, error: null })
    try {
      const updated = await startBookingApi(id)
      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === id ? updated : b)),
        selectedBooking: state.selectedBooking?.id === id ? updated : state.selectedBooking,
        isSubmitting: false,
      }))
      return updated
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to start booking', isSubmitting: false })
      throw err
    }
  },

  completeBooking: async (id) => {
    set({ isSubmitting: true, error: null })
    try {
      const updated = await completeBookingApi(id)
      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === id ? updated : b)),
        selectedBooking: state.selectedBooking?.id === id ? updated : state.selectedBooking,
        isSubmitting: false,
      }))
      return updated
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to complete booking', isSubmitting: false })
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
