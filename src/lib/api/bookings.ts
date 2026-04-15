import api from '@/lib/axios'
import type { Booking, BookingStatus } from '@/types'

export interface CreateBookingPayload {
  serviceCategoryId: string
  serviceListingId?: string
  artisanId?: string
  jobTitle: string
  jobDescription: string
  media?: File[]
  consentAcknowledged: boolean
  address: string
  latitude: number
  longitude: number
  preferredDate: string
  preferredTime: string
  proposedPrice?: number
}

export interface UpdateBookingPayload {
  scheduled_date?: string
  scheduled_time?: string
  location?: string
  notes?: string
}

export interface ArtisanRespondPayload {
  action: 'ACCEPT' | 'COUNTER' | 'DECLINE'
  counterPrice?: number
  message?: string
}

export interface ArtisanApplyPayload {
  proposedPrice?: number
  message?: string
}

export interface SelectApplicantPayload {
  applicationId: string
}

export interface SelectKrafterPayload {
  artisanId: string
}

export interface CompareKraftersPayload {
  krafterIds: string[]
  serviceCategoryId: string
}

export interface CreateBookingForRecommendationPayload {
  serviceCategoryId: string
  serviceListingId?: string
  jobTitle: string
  jobDescription: string
  media?: File[]
  consentAcknowledged: boolean
  address: string
  latitude: number
  longitude: number
  preferredDate: string
  preferredTime: string
  proposedPrice?: number
}

export interface PublishToMarketplacePayload {
  serviceCategoryId: string
  serviceListingId?: string
  jobTitle: string
  jobDescription: string
  media?: File[]
  consentAcknowledged: boolean
  address: string
  latitude: number
  longitude: number
  preferredDate: string
  preferredTime: string
  proposedPrice?: number
  offerAmount?: number
  expiryOption?: string
  expiryDate?: string
  minRatingRequirement?: string
  verifiedOnly?: boolean
}

export interface GetRecommendationsPayload {
  serviceCategoryId: string
  serviceListingId?: string
  jobTitle: string
  jobDescription: string
  latitude: number
  longitude: number
  preferredDate: string
  preferredTime: string
  radiusKm?: number
  limit?: number
}

export interface GetOpenMarketplaceTasksParams {
  serviceCategoryId?: string
  search?: string
  limit?: number
  offset?: number
}

/** POST /api/bookings — create a new booking request */
export const createBooking = async (payload: CreateBookingPayload): Promise<Booking> => {
  const formData = new FormData()

  formData.append('serviceCategoryId', payload.serviceCategoryId)
  if (payload.serviceListingId) formData.append('serviceListingId', payload.serviceListingId)
  if (payload.artisanId) formData.append('artisanId', payload.artisanId)
  formData.append('jobTitle', payload.jobTitle)
  formData.append('jobDescription', payload.jobDescription)
  formData.append('consentAcknowledged', String(payload.consentAcknowledged))
  formData.append('address', payload.address)
  formData.append('latitude', String(payload.latitude))
  formData.append('longitude', String(payload.longitude))
  formData.append('preferredDate', payload.preferredDate)
  formData.append('preferredTime', payload.preferredTime)
  if (payload.proposedPrice !== undefined) formData.append('proposedPrice', String(payload.proposedPrice))

  if (payload.media && payload.media.length > 0) {
    payload.media.forEach((file) => {
      formData.append('media', file)
    })
  }

  const response = await api.post('/api/bookings', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  
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

/** GET /api/bookings/{id}/applicants — all applicants for an OPEN_FOR_APPLICATIONS booking */
export const getBookingApplicants = async (id: string): Promise<any[]> => {
  const response = await api.get(`/api/bookings/${id}/applicants`)
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

/** POST /api/bookings/{id}/proceed-to-payment — proceed to payment after Krafter is selected */
export const proceedToPayment = async (id: string): Promise<Booking> => {
  const response = await api.post(`/api/bookings/${id}/proceed-to-payment`)
  return response.data
}

/** POST /api/bookings/{id}/select-applicant — select an applicant for the booking */
export const selectApplicant = async (id: string, payload: SelectApplicantPayload): Promise<Booking> => {
  const response = await api.post(`/api/bookings/${id}/select-applicant`, payload)
  return response.data
}

/** POST /api/bookings/{id}/select-krafter — select a Krafter from recommendations */
export const selectKrafter = async (id: string, payload: SelectKrafterPayload): Promise<Booking> => {
  const response = await api.post(`/api/bookings/${id}/select-krafter`, payload)
  return response.data
}

/** POST /api/bookings/compare-krafters — compare up to 2 Krafters side-by-side */
export const compareKrafters = async (payload: CompareKraftersPayload): Promise<any> => {
  const response = await api.post('/api/bookings/compare-krafters', payload)
  return response.data
}

/** POST /api/bookings/create-for-recommendation — create a booking in RECOMMENDATION_PENDING status with media upload */
export const createBookingForRecommendation = async (payload: CreateBookingForRecommendationPayload): Promise<Booking> => {
  const formData = new FormData()

  formData.append('serviceCategoryId', payload.serviceCategoryId)
  if (payload.serviceListingId) formData.append('serviceListingId', payload.serviceListingId)
  formData.append('jobTitle', payload.jobTitle)
  formData.append('jobDescription', payload.jobDescription)
  formData.append('consentAcknowledged', String(payload.consentAcknowledged))
  formData.append('address', payload.address)
  formData.append('latitude', String(payload.latitude))
  formData.append('longitude', String(payload.longitude))
  formData.append('preferredDate', payload.preferredDate)
  formData.append('preferredTime', payload.preferredTime)
  if (payload.proposedPrice !== undefined) formData.append('proposedPrice', String(payload.proposedPrice))

  if (payload.media && payload.media.length > 0) {
    payload.media.forEach((file) => {
      formData.append('media', file)
    })
  }

  const response = await api.post('/api/bookings/create-for-recommendation', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  
  return response.data
}

/** POST /api/bookings/publish-to-marketplace — publish booking to public marketplace */
export const publishToMarketplace = async (payload: PublishToMarketplacePayload): Promise<Booking> => {
  const formData = new FormData()

  formData.append('serviceCategoryId', payload.serviceCategoryId)
  if (payload.serviceListingId) formData.append('serviceListingId', payload.serviceListingId)
  formData.append('jobTitle', payload.jobTitle)
  formData.append('jobDescription', payload.jobDescription)
  formData.append('consentAcknowledged', String(payload.consentAcknowledged))
  formData.append('address', payload.address)
  formData.append('latitude', String(payload.latitude))
  formData.append('longitude', String(payload.longitude))
  formData.append('preferredDate', payload.preferredDate)
  formData.append('preferredTime', payload.preferredTime)
  if (payload.proposedPrice !== undefined) formData.append('proposedPrice', String(payload.proposedPrice))
  if (payload.offerAmount !== undefined) formData.append('offerAmount', String(payload.offerAmount))
  if (payload.expiryOption) formData.append('expiryOption', payload.expiryOption)
  if (payload.expiryDate) formData.append('expiryDate', payload.expiryDate)
  if (payload.minRatingRequirement) formData.append('minRatingRequirement', payload.minRatingRequirement)
  if (payload.verifiedOnly !== undefined) formData.append('verifiedOnly', String(payload.verifiedOnly))

  if (payload.media && payload.media.length > 0) {
    payload.media.forEach((file) => {
      formData.append('media', file)
    })
  }

  const response = await api.post('/api/bookings/publish-to-marketplace', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  
  return response.data
}

/** POST /api/bookings/recommendations — get Krafter recommendations for a normal task (pre-booking) */
export const getRecommendations = async (payload: GetRecommendationsPayload): Promise<any[]> => {
  const response = await api.post('/api/bookings/recommendations', payload)
  return response.data
}

// ─── Artisan-side booking actions ─────────────────────────────────────────────

/** GET /api/artisan/bookings — all booking requests for the current artisan */
export const getArtisanBookings = async (): Promise<Booking[]> => {
  const response = await api.get('/api/artisan/bookings')
  return response.data
}

/** GET /api/artisan/bookings/direct-requests — all direct booking requests for the current artisan */
export const getDirectArtisanBookings = async (): Promise<Booking[]> => {
  const response = await api.get('/api/artisan/bookings/direct-requests')
  return response.data
}

/** GET /api/artisan/bookings/marketplace-applications — all marketplace applications for the current artisan */
export const getMarketplaceApplications = async (): Promise<Booking[]> => {
  const response = await api.get('/api/artisan/bookings/marketplace-applications')
  return response.data
}

/** GET /api/artisan/bookings/marketplace/open — Browse OPEN_FOR_APPLICATIONS marketplace tasks */
export const getOpenMarketplaceTasks = async (
  params?: GetOpenMarketplaceTasksParams
): Promise<{ data: Booking[]; total: number; offset: number; limit: number }> => {
  const response = await api.get('/api/artisan/bookings/marketplace/open', { params })
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

/** POST /api/artisan/bookings/{id}/apply — apply to an OPEN_FOR_APPLICATIONS booking */
export const applyToBooking = async (
  id: string,
  payload: ArtisanApplyPayload
): Promise<Booking> => {
  const response = await api.post(`/api/artisan/bookings/${id}/apply`, payload)
  return response.data
}
