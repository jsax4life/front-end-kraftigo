import { create } from 'zustand'
import type { Booking, BookingStatus } from '@/types'
import {
  persistRecommendationDraftBookingId,
  clearRecommendationDraftBookingIdFromSession,
} from '@/lib/recommendationDraftBooking'
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
  reopenRecommendation as reopenRecommendationApi,
  confirmBooking as confirmBookingApi,
  proceedToPayment as proceedToPaymentApi,
  selectApplicant,
  selectKrafter,
  compareKrafters,
  respondToBooking,
  getArtisanBookings,
  getDirectArtisanBookings,
  getMarketplaceApplications,
  getOpenMarketplaceTasks,
  mapMarketplaceOpenRowToBooking,
  startBooking as startBookingApi,
  completeBooking as completeBookingApi,
  applyToBooking as applyToBookingApi,
  type CreateBookingPayload,
  type CreateBookingForRecommendationPayload,
  type PublishToMarketplacePayload,
  type GetRecommendationsPayload,
  type GetOpenMarketplaceTasksParams,
  type UpdateBookingPayload,
  type ArtisanRespondPayload,
  type ArtisanApplyPayload,
  type SelectApplicantPayload,
  type SelectKrafterPayload,
  type CompareKraftersPayload,
  type DirectArtisanBookingRequest,
  type CancelBookingPayload,
  type ArtisanCompleteBookingPayload,
  type BookingSavedPaymentPayload,
} from '@/lib/api/bookings'
import { usePaymentStore } from '@/store/usePaymentStore'
import { useChatStore } from '@/store/useChatStore'
import { bookingApiErrorUserMessage } from '@/lib/paymentCardRequired'

function scheduleChatRefreshAfterKrafterSelection(booking: Booking) {
  const raw = booking.artisanId ?? booking.artisan_id
  const id = raw != null && String(raw).trim() !== '' ? String(raw).trim() : undefined
  void useChatStore.getState().refreshAfterKrafterOrApplicantSelection({
    otherParticipantId: id,
  })
}

/** Stripe `pm_…` for the customer’s current selection (or default / first saved method). */
function resolveCustomerStripePaymentMethodId(explicit?: string): string | undefined {
  if (explicit) return explicit
  const { savedMethods, selectedPaymentId } = usePaymentStore.getState()
  if (savedMethods.length === 0) return undefined
  if (selectedPaymentId) {
    const selected = savedMethods.find((m) => m.id === selectedPaymentId)
    if (selected?.paymentMethodId) return selected.paymentMethodId
  }
  const fallback = savedMethods.find((m) => m.isDefault) ?? savedMethods[0]
  return fallback?.paymentMethodId
}

function buildCustomerSavedPaymentPayload(
  overrides?: BookingSavedPaymentPayload,
): BookingSavedPaymentPayload | null {
  const savedPaymentMethodId = resolveCustomerStripePaymentMethodId(
    overrides?.savedPaymentMethodId,
  )
  if (!savedPaymentMethodId) return null
  return {
    savedPaymentMethodId,
    ...(overrides?.paymentMethod ? { paymentMethod: overrides.paymentMethod } : {}),
  }
}

interface BookingsState {
  // State
  bookings: Booking[]
  /** Krafter marketplace — from `GET /api/artisan/bookings/marketplace-applications` (separate from browse `bookings`). */
  marketplaceApplications: Booking[]
  isLoadingMarketplaceApplications: boolean
  /** Krafter "Requests" tab — from `GET /api/artisan/bookings/direct-requests` */
  directArtisanRequests: DirectArtisanBookingRequest[]
  selectedBooking: Booking | null
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
  lastFetchStatus: 'idle' | 'success' | 'error' | 'empty'
  /** Id from last `create-for-recommendation` success; cleared after publish / select Krafter / abandon. */
  recommendationDraftBookingId: string | null
  /** Draft Kraft photos from book-service step; sent again on `publish-to-marketplace` then cleared. */
  pendingPublishMediaFiles: File[]

  // Customer actions
  fetchMyBookings: () => Promise<void>
  fetchBookingById: (id: string) => Promise<Booking>
  fetchBookingApplicants: (id: string) => Promise<any[]>
  createBooking: (payload: CreateBookingPayload) => Promise<Booking>
  createBookingForRecommendation: (payload: CreateBookingForRecommendationPayload) => Promise<Booking>
  publishToMarketplace: (payload: PublishToMarketplacePayload) => Promise<Booking>
  getRecommendations: (payload: GetRecommendationsPayload) => Promise<any[]>
  updateBooking: (id: string, payload: UpdateBookingPayload) => Promise<Booking>
  cancelBooking: (id: string, payload: CancelBookingPayload) => Promise<void>
  reopenRecommendation: (id: string) => Promise<Booking>
  confirmBooking: (
    id: string,
    payload?: BookingSavedPaymentPayload,
  ) => Promise<Booking>
  proceedToPayment: (
    id: string,
    payload?: BookingSavedPaymentPayload,
  ) => Promise<Booking>
  selectApplicant: (id: string, payload: SelectApplicantPayload) => Promise<Booking>
  selectKrafter: (id: string, payload: SelectKrafterPayload) => Promise<Booking>
  compareKrafters: (payload: CompareKraftersPayload) => Promise<any>

  // Artisan actions
  fetchArtisanBookings: () => Promise<void>
  fetchDirectArtisanBookings: () => Promise<void>
  fetchMarketplaceApplications: () => Promise<Booking[]>
  fetchOpenMarketplaceTasks: (
    params?: GetOpenMarketplaceTasksParams,
    options?: { append?: boolean },
  ) => Promise<{ data: Booking[]; total: number; offset: number; limit: number }>
  respondToBooking: (id: string, payload: ArtisanRespondPayload) => Promise<Booking>
  applyToBooking: (id: string, payload: ArtisanApplyPayload) => Promise<Booking>
  startBooking: (id: string) => Promise<Booking>
  completeBooking: (id: string, payload: ArtisanCompleteBookingPayload) => Promise<Booking>

  // Selectors
  getUpcomingBookings: () => Booking[]
  getCompletedBookings: () => Booking[]
  getBookingsByStatus: (status: BookingStatus) => Booking[]

  // Helpers
  clearError: () => void
  clearSelectedBooking: () => void
  /** Clears in-memory + sessionStorage draft id (e.g. user abandons and starts a new task). */
  clearRecommendationDraftBooking: () => void
  setPendingPublishMediaFiles: (files: File[]) => void
  clearPendingPublishMediaFiles: () => void
}

const COMPLETED_STATUSES: BookingStatus[] = ['COMPLETED', 'EXPIRED', 'CANCELLED', 'DISPUTED']

export const useBookingsStore = create<BookingsState>()((set, get) => ({
  // Initial state
  bookings: [],
  marketplaceApplications: [],
  isLoadingMarketplaceApplications: false,
  directArtisanRequests: [],
  selectedBooking: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
  lastFetchStatus: 'idle',
  recommendationDraftBookingId: null,
  pendingPublishMediaFiles: [],

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
    set({ error: null })
    try {
      return await getBookingApplicants(id)
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to load applicants' })
      throw err
    }
  },

  createBooking: async (payload) => {
    set({ isSubmitting: true, error: null })
    try {
      const booking = await createBooking(payload)
      clearRecommendationDraftBookingIdFromSession()
      set((state) => ({
        bookings: [booking, ...state.bookings],
        isSubmitting: false,
        recommendationDraftBookingId: null,
      }))
      return booking
    } catch (err: any) {
      set({
        error: bookingApiErrorUserMessage(err, 'Failed to create booking'),
        isSubmitting: false,
      })
      throw err
    }
  },

  createBookingForRecommendation: async (payload) => {
    set({ isSubmitting: true, error: null })
    try {
      const booking = await createBookingForRecommendation(payload)
      persistRecommendationDraftBookingId(booking.id)
      set((state) => ({
        bookings: [booking, ...state.bookings],
        isSubmitting: false,
        recommendationDraftBookingId: booking.id,
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
      clearRecommendationDraftBookingIdFromSession()
      set((state) => ({
        bookings: [booking, ...state.bookings],
        isSubmitting: false,
        recommendationDraftBookingId: null,
        pendingPublishMediaFiles: [],
      }))
      return booking
    } catch (err: any) {
      set({
        error: bookingApiErrorUserMessage(err, 'Failed to publish to marketplace'),
        isSubmitting: false,
      })
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

  cancelBooking: async (id, payload) => {
    set({ isSubmitting: true, error: null })
    try {
      const cancelled = await cancelBooking(id, payload)
      const draftMatches = get().recommendationDraftBookingId === id
      if (draftMatches) {
        clearRecommendationDraftBookingIdFromSession()
      }
      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === id ? cancelled : b)),
        selectedBooking: state.selectedBooking?.id === id ? cancelled : state.selectedBooking,
        isSubmitting: false,
        recommendationDraftBookingId: draftMatches ? null : state.recommendationDraftBookingId,
      }))
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to cancel booking', isSubmitting: false })
      throw err
    }
  },

  reopenRecommendation: async (id) => {
    set({ isSubmitting: true, error: null })
    try {
      const updated = await reopenRecommendationApi(id)
      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === id ? updated : b)),
        selectedBooking: state.selectedBooking?.id === id ? updated : state.selectedBooking,
        isSubmitting: false,
      }))
      return updated
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to reopen task',
        isSubmitting: false,
      })
      throw err
    }
  },

  confirmBooking: async (id, overrides) => {
    set({ isSubmitting: true, error: null })
    const body = buildCustomerSavedPaymentPayload(overrides)
    if (!body) {
      const msg = 'Add or select a saved card before confirming.'
      set({ error: msg, isSubmitting: false })
      throw new Error(msg)
    }
    try {
      const confirmed = await confirmBookingApi(id, body)
      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === id ? confirmed : b)),
        selectedBooking: state.selectedBooking?.id === id ? confirmed : state.selectedBooking,
        isSubmitting: false,
      }))
      return confirmed
    } catch (err: any) {
      set({
        error: bookingApiErrorUserMessage(err, 'Failed to confirm booking'),
        isSubmitting: false,
      })
      throw err
    }
  },

  proceedToPayment: async (id, overrides) => {
    set({ isSubmitting: true, error: null })
    const body = buildCustomerSavedPaymentPayload(overrides)
    if (!body) {
      const msg = 'Add or select a saved card before paying.'
      set({ error: msg, isSubmitting: false })
      throw new Error(msg)
    }
    try {
      const updated = await proceedToPaymentApi(id, body)
      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === id ? updated : b)),
        selectedBooking: state.selectedBooking?.id === id ? updated : state.selectedBooking,
        isSubmitting: false,
      }))
      return updated
    } catch (err: any) {
      set({
        error: bookingApiErrorUserMessage(err, 'Failed to proceed to payment'),
        isSubmitting: false,
      })
      throw err
    }
  },

  selectApplicant: async (id, payload) => {
    set({ isSubmitting: true, error: null })
    try {
      const updated = await selectApplicant(id, payload)
      scheduleChatRefreshAfterKrafterSelection(updated)
      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === id ? updated : b)),
        selectedBooking: state.selectedBooking?.id === id ? updated : state.selectedBooking,
        isSubmitting: false,
      }))
      return updated
    } catch (err: any) {
      set({
        error: bookingApiErrorUserMessage(err, 'Failed to select applicant'),
        isSubmitting: false,
      })
      throw err
    }
  },

  selectKrafter: async (id, payload) => {
    set({ isSubmitting: true, error: null })
    try {
      const updated = await selectKrafter(id, payload)
      scheduleChatRefreshAfterKrafterSelection(updated)
      clearRecommendationDraftBookingIdFromSession()
      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === id ? updated : b)),
        selectedBooking: state.selectedBooking?.id === id ? updated : state.selectedBooking,
        isSubmitting: false,
        recommendationDraftBookingId: null,
        pendingPublishMediaFiles: [],
      }))
      return updated
    } catch (err: any) {
      set({
        error: bookingApiErrorUserMessage(err, 'Failed to select Krafter'),
        isSubmitting: false,
      })
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
      const directArtisanRequests = await getDirectArtisanBookings()
      set({
        directArtisanRequests,
        isLoading: false,
        lastFetchStatus: directArtisanRequests.length > 0 ? 'success' : 'empty',
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
    set({ isLoadingMarketplaceApplications: true, error: null })
    try {
      const rows = await getMarketplaceApplications()
      set({
        marketplaceApplications: rows,
        isLoadingMarketplaceApplications: false,
      })
      return rows
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to load marketplace applications',
        marketplaceApplications: [],
        isLoadingMarketplaceApplications: false,
      })
      throw err
    }
  },

  fetchOpenMarketplaceTasks: async (params, options) => {
    const append = options?.append === true
    if (!append) set({ isLoading: true, error: null })
    else set({ error: null })
    try {
      const page = await getOpenMarketplaceTasks(params)
      const bookings = page.results.map(mapMarketplaceOpenRowToBooking)
      set((state) => {
        const nextList = append ? [...state.bookings, ...bookings] : bookings
        const hasAny = nextList.length > 0
        return {
          bookings: nextList,
          isLoading: false,
          lastFetchStatus: hasAny ? 'success' : 'empty',
        }
      })
      return { data: bookings, total: page.total, offset: page.offset, limit: page.limit }
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to load open marketplace tasks',
        isLoading: false,
        lastFetchStatus: 'error',
      })
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
      set((state) => {
        const idx = state.bookings.findIndex((b) => b.id === id)
        const bookings =
          idx >= 0
            ? state.bookings.map((b) => (b.id === id ? updated : b))
            : [...state.bookings, updated]
        return {
          bookings,
          selectedBooking: state.selectedBooking?.id === id ? updated : state.selectedBooking,
          isSubmitting: false,
        }
      })
      return updated
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to start booking', isSubmitting: false })
      throw err
    }
  },

  completeBooking: async (id, payload) => {
    set({ isSubmitting: true, error: null })
    try {
      const updated = await completeBookingApi(id, payload)
      set((state) => {
        const idx = state.bookings.findIndex((b) => b.id === id)
        const bookings =
          idx >= 0
            ? state.bookings.map((b) => (b.id === id ? updated : b))
            : [...state.bookings, updated]
        return {
          bookings,
          selectedBooking: state.selectedBooking?.id === id ? updated : state.selectedBooking,
          isSubmitting: false,
        }
      })
      return updated
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to complete booking', isSubmitting: false })
      throw err
    }
  },

  // Selectors
  getUpcomingBookings: () =>
    get().bookings.filter((b) => !COMPLETED_STATUSES.includes(b.status as BookingStatus)),

  getCompletedBookings: () =>
    get().bookings.filter((b) => COMPLETED_STATUSES.includes(b.status)),

  getBookingsByStatus: (status) =>
    get().bookings.filter((b) => b.status === status),

  clearError: () => set({ error: null }),
  clearSelectedBooking: () => set({ selectedBooking: null }),

  clearRecommendationDraftBooking: () => {
    clearRecommendationDraftBookingIdFromSession()
    set({ recommendationDraftBookingId: null, pendingPublishMediaFiles: [] })
  },

  setPendingPublishMediaFiles: (files) => set({ pendingPublishMediaFiles: files }),

  clearPendingPublishMediaFiles: () => set({ pendingPublishMediaFiles: [] }),
}))
