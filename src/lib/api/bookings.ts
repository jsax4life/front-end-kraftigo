import api from '@/lib/axios'
import type { Booking, BookingStatus } from '@/types'

export interface CreateBookingPayload {
  serviceCategoryId: string
  jobTitle: string
  jobDescription: string
  consentAcknowledged: boolean
  address: string
  latitude: number
  longitude: number
  preferredDate: string
  preferredTime: string
}

export interface UpdateBookingPayload {
  scheduled_date?: string
  scheduled_time?: string
  location?: string
  notes?: string
}

export interface ArtisanRespondPayload {
  action: 'ACCEPT' | 'COUNTER' | 'DECLINE'
  counter_price?: number
  message?: string
}

/** POST /api/bookings — create a new booking request */
export const createBooking = async (payload: CreateBookingPayload): Promise<Booking> => {
  const response = await api.post('/api/bookings', payload)
  return response.data
}

/** GET /api/bookings/my — all bookings for the current customer */
export const getMyBookings = async (): Promise<Booking[]> => {
  const response = await api.get('/api/bookings/my')
  return response.data
}

/** GET /api/bookings/{id} — booking details */
export const getBookingById = async (id: string): Promise<Booking> => {
  const response = await api.get(`/api/bookings/${id}`)
  return response.data
}

/** PATCH /api/bookings/{id} — update booking (only if REQUESTED) */
export const updateBooking = async (id: string, payload: UpdateBookingPayload): Promise<Booking> => {
  const response = await api.patch(`/api/bookings/${id}`, payload)
  return response.data
}

/** POST /api/bookings/{id}/cancel — cancel a booking */
export const cancelBooking = async (id: string, reason?: string): Promise<Booking> => {
  const response = await api.post(`/api/bookings/${id}/cancel`, { reason })
  return response.data
}

/** POST /api/bookings/{id}/confirm — confirm a counter offer from artisan */
export const confirmBooking = async (id: string): Promise<Booking> => {
  const response = await api.post(`/api/bookings/${id}/confirm`)
  return response.data
}

// ─── Artisan-side booking actions ─────────────────────────────────────────────

/** GET /api/artisan/bookings — all booking requests for the current artisan */
export const getArtisanBookings = async (): Promise<Booking[]> => {
  const response = await api.get('/api/artisan/bookings')
  return response.data
}

/** POST /api/artisan/bookings/{id}/respond — accept, counter, or decline */
export const respondToBooking = async (
  id: string,
  payload: ArtisanRespondPayload
): Promise<Booking> => {
  const response = await api.post(`/api/artisan/bookings/${id}/respond`, payload)
  return response.data
}

/** POST /api/artisan/bookings/{id}/start — move booking to IN_PROGRESS */
export const startBooking = async (id: string): Promise<Booking> => {
  const response = await api.post(`/api/artisan/bookings/${id}/start`)
  return response.data
}

/** POST /api/artisan/bookings/{id}/complete — mark job as completed */
export const completeBooking = async (id: string): Promise<Booking> => {
  const response = await api.post(`/api/artisan/bookings/${id}/complete`)
  return response.data
}
