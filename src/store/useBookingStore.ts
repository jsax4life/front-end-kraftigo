import { create } from 'zustand'
import api from '@/lib/axios'

export interface Booking {
  id: string;
  title: string;
  artisanName?: string;
  customerName?: string;
  location: string;
  date: string;
  time: string;
  status: 'REQUESTED' | 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'COUNTERED';
  price?: number;
  image?: string;
}

interface BookingState {
  bookings: Booking[]
  kraftRequests: any[]
  isLoading: boolean
  error: string | null

  fetchUserBookings: () => Promise<void>
  fetchTaskerBookings: () => Promise<void>
  createBooking: (bookingData: any) => Promise<void>
  cancelBooking: (bookingId: string) => Promise<void>
  rescheduleBooking: (bookingId: string, date: string, time: string) => Promise<void>
}

export const useBookingStore = create<BookingState>((set) => ({
  bookings: [],
  kraftRequests: [],
  isLoading: false,
  error: null,

  fetchUserBookings: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get('/api/bookings/my')
      set({ bookings: response.data, isLoading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch bookings',
        isLoading: false,
      })
    }
  },

  fetchTaskerBookings: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get('/api/artisan/bookings')
      set({ bookings: response.data, isLoading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch tasker bookings',
        isLoading: false,
      })
    }
  },

  createBooking: async (bookingData) => {
    set({ isLoading: true, error: null })
    try {
      await api.post('/api/bookings', bookingData)
      set({ isLoading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to create booking',
        isLoading: false,
      })
      throw error
    }
  },

  cancelBooking: async (bookingId) => {
    set({ isLoading: true, error: null })
    try {
      await api.post(`/api/bookings/${bookingId}/cancel`)
      set((state) => ({
        bookings: state.bookings.map(b => b.id === bookingId ? { ...b, status: 'CANCELLED' } : b),
        isLoading: false
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to cancel booking',
        isLoading: false,
      })
      throw error
    }
  },

  rescheduleBooking: async (bookingId, date, time) => {
    set({ isLoading: true, error: null })
    try {
      await api.post(`/api/bookings/${bookingId}/reschedule`, { date, time })
      set((state) => ({
        bookings: state.bookings.map(b => b.id === bookingId ? { ...b, date, time } : b),
        isLoading: false
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to reschedule booking',
        isLoading: false,
      })
      throw error
    }
  }
}))
