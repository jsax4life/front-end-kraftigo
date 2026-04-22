import api from '@/lib/axios'
import type { Booking, Service, ServiceCategory } from '@/types'

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

/** POST /api/bookings/:id/cancel — JSON body */
export type CancelBookingReason =
  | 'SCHEDULE_CONFLICT'
  | 'NO_LONGER_NEED_SERVICE'
  | 'FOUND_DIFFERENT_KRAFTER'
  | 'OTHER'

export interface CancelBookingPayload {
  reason: CancelBookingReason
  /** Required when `reason` is `OTHER`; max 2000 characters. */
  details?: string
}

export interface ArtisanRespondPayload {
  action: 'ACCEPT' | 'COUNTER' | 'DECLINE'
  counterPrice?: number
  message?: string
}

export interface ArtisanApplyPayload {
  proposedPrice?: number
  message?: string
  /** Krafter marketplace apply: whether the applicant is open to further negotiation. */
  openForNegotiation?: boolean
}

export interface SelectApplicantPayload {
  applicationId: string
}

export interface SelectKrafterPayload {
  krafterId: string
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
  /** Optional: links publish to an existing recommendation draft from create-for-recommendation */
  recommendationBookingId?: string
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
  /** Kraft expiry: `24h` | `3days` | `1week` | `custom` */
  expiryOption?: string
  /** Required when `expiryOption` is `custom` (ISO date-time). */
  expiryDate?: string
  /** Krafter open to further negotiation on marketplace apply. */
  openForNegotiation?: boolean
  /** `any` | `3.0+` | `4.0+` | `4.5+` */
  krafterRatingRequirement?: string
  /** @deprecated Prefer `krafterRatingRequirement`; sent as same form field when set. */
  minRatingRequirement?: string
  verifiedOnly?: boolean
  /** Separate from job description when backend supports it. */
  specialInstructions?: string
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

export type MarketplaceOpenSort = 'recent' | 'distance_asc'

export interface GetOpenMarketplaceTasksParams {
  serviceCategoryId?: string
  search?: string
  /** Great-circle radius in km; requires origin (query lat/lng or artisan profile coords). */
  maxDistanceKm?: number
  /** Filter on customer `proposedPrice`; if set, rows with null proposed price are excluded. */
  minPrice?: number
  maxPrice?: number
  /** Optional origin for distance filter / `distance_asc` sort; must send both when overriding. */
  latitude?: number
  longitude?: number
  /** `recent` (default): `createdAt` desc. `distance_asc`: nearest first (same origin rules as distance). */
  sort?: MarketplaceOpenSort
  limit?: number
  offset?: number
  /** When true, omits listings the Krafter has already applied to from the browse feed. */
  excludeAlreadyApplied?: boolean
}

/** Row from `GET /api/artisan/bookings/marketplace/open` */
export interface MarketplaceOpenServiceCategory {
  id: string
  name: string
  description?: string
  imageUrl?: string
  createdAt?: string
  updatedAt?: string
}

export interface MarketplaceOpenBookingRow {
  id: string
  customerId: string
  artisanId: string | null
  serviceListingId: string | null
  serviceCategoryId: string
  jobTitle: string
  jobDescription: string
  mediaUrls: string[] | null
  consentAcknowledged?: boolean
  address: string
  latitude: string
  longitude: string
  preferredDate: string
  preferredTime: string
  proposedPrice: string | null
  finalAgreedPrice?: string | null
  platformFee?: string | null
  artisanEarning?: string | null
  pricingRuleId?: string | null
  status: string
  createdAt: string
  updatedAt: string
  cancelledAt?: string | null
  completedAt?: string | null
  serviceCategory?: MarketplaceOpenServiceCategory
  hasApplied: boolean
}

export interface GetOpenMarketplaceTasksResponse {
  total: number
  limit: number
  offset: number
  results: MarketplaceOpenBookingRow[]
}

const slugifyCategory = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'general'

/** Maps marketplace-open API rows into the shared `Booking` shape for UI reuse. */
export const mapMarketplaceOpenRowToBooking = (
  row: MarketplaceOpenBookingRow,
): Booking => {
  const proposed =
    row.proposedPrice != null && row.proposedPrice !== ''
      ? parseFloat(String(row.proposedPrice))
      : 0
  const cat = row.serviceCategory
  const category: ServiceCategory | undefined = cat
    ? {
        id: cat.id,
        name: cat.name,
        slug: slugifyCategory(cat.name),
      }
    : undefined

  const service: Service | undefined =
    cat && category
      ? {
          id: row.serviceListingId || cat.id,
          title: row.jobTitle,
          description: row.jobDescription,
          price_per_hour: proposed || 0,
          category,
          artisan: { id: '', fullName: '' },
          is_active: true,
          created_at: row.createdAt,
        }
      : undefined

  const firstMedia =
    row.mediaUrls && row.mediaUrls.length > 0 ? row.mediaUrls[0] : undefined

  return {
    id: row.id,
    service_id: row.serviceListingId || row.serviceCategoryId,
    customer_id: row.customerId,
    artisan_id: row.artisanId ?? undefined,
    status: row.status as Booking['status'],
    scheduled_date: row.preferredDate,
    scheduled_time: row.preferredTime,
    location: row.address,
    notes: row.jobDescription,
    price: Number.isFinite(proposed) ? proposed : undefined,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    title: row.jobTitle,
    image: cat?.imageUrl ?? firstMedia,
    service,
    hasApplied: row.hasApplied,
  }
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

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
}

/**
 * Some environments return `{ booking }`, `{ data }`, or `{ data: { booking } }`.
 * Also maps snake_case aliases onto the `Booking` fields the UI reads.
 */
export function normalizeBookingDetailResponse(data: unknown): Booking {
  const root = asRecord(data)
  let row = root

  if (root.booking && typeof root.booking === 'object') {
    row = asRecord(root.booking)
  } else if (root.data && typeof root.data === 'object' && !Array.isArray(root.data)) {
    const inner = asRecord(root.data)
    row = inner.booking && typeof inner.booking === 'object' ? asRecord(inner.booking) : inner
  }

  const r = row
  const pickStr = (...keys: string[]): string | undefined => {
    for (const k of keys) {
      const v = r[k]
      if (typeof v === 'string' && v.trim()) return v.trim()
    }
    return undefined
  }

  const jobTitle = pickStr('jobTitle', 'job_title')
  const jobDescription = pickStr('jobDescription', 'job_description')
  const preferredDate = pickStr('preferredDate', 'preferred_date')
  const preferredTime = pickStr('preferredTime', 'preferred_time')
  const address = pickStr('address', 'location')
  const location = pickStr('location', 'address')
  const id = pickStr('id') ?? String(r.id ?? '')
  const status = (r.status as Booking['status']) ?? 'OPEN_FOR_APPLICATIONS'
  const customerId = pickStr('customerId', 'customer_id') ?? ''
  const serviceId =
    pickStr('service_id', 'serviceId', 'serviceCategoryId', 'service_category_id') ?? ''

  const mediaRaw = r.mediaUrls ?? r.media_urls
  const mediaUrls = Array.isArray(mediaRaw)
    ? (mediaRaw as unknown[]).filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
    : undefined

  const proposedPrice = r.proposedPrice ?? r.proposed_price ?? r.price
  const scheduledDate = pickStr('scheduled_date', 'scheduledDate') ?? preferredDate ?? ''
  const scheduledTime = pickStr('scheduled_time', 'scheduledTime') ?? preferredTime ?? ''

  const serviceCategory = (r.serviceCategory ?? r.service_category) as Booking['serviceCategory']
  const customer = r.customer as Booking['customer']

  const merged: Booking = {
    ...(r as unknown as Booking),
    id,
    service_id: serviceId,
    customer_id: customerId,
    status,
    scheduled_date: scheduledDate,
    scheduled_time: scheduledTime,
    location: location ?? '',
    notes: pickStr('notes') ?? jobDescription,
    title: jobTitle ?? (r as unknown as Booking).title,
    jobTitle,
    jobDescription,
    address: address ?? location,
    preferredDate,
    preferredTime,
    proposedPrice: proposedPrice as Booking['proposedPrice'],
    mediaUrls,
    customer: customer ?? undefined,
    serviceCategory: serviceCategory ?? undefined,
  }

  return merged
}

/** GET /api/bookings/{id} — booking details */
export const getBookingById = async (id: string): Promise<Booking> => {
  const response = await api.get(`/api/bookings/${id}`)
  return normalizeBookingDetailResponse(response.data)
}

/** POST resume-checkout / PATCH checkout-payment-method — normalized client secret for Stripe.js */
export interface ResumeCheckoutResponse {
  clientSecret: string
  paymentIntentId?: string
}

/** Flat `{ clientSecret }` or nested `{ payment: { clientSecret } }` (and snake_case variants). */
export function parseCheckoutClientSecretResponse(root: unknown): ResumeCheckoutResponse {
  const data = root ?? {}
  const d =
    data &&
    typeof data === 'object' &&
    'payment' in data &&
    (data as { payment?: unknown }).payment &&
    typeof (data as { payment: unknown }).payment === 'object'
      ? ((data as { payment: Record<string, unknown> }).payment as Record<string, unknown>)
      : (data as Record<string, unknown>)
  const clientSecret =
    (typeof d.clientSecret === 'string' && d.clientSecret) ||
    (typeof d.client_secret === 'string' && d.client_secret) ||
    ''
  if (!clientSecret) {
    throw new Error('Invalid checkout response: missing clientSecret')
  }
  return {
    clientSecret,
    paymentIntentId:
      (typeof d.paymentIntentId === 'string' && d.paymentIntentId) ||
      (typeof d.payment_intent_id === 'string' && d.payment_intent_id) ||
      undefined,
  }
}

/** POST /api/bookings/{id}/resume-checkout — recover PaymentIntent `clientSecret` when customer still owes authorization */
export const resumeBookingCheckout = async (id: string): Promise<ResumeCheckoutResponse> => {
  const response = await api.post(`/api/bookings/${id}/resume-checkout`, {})
  return parseCheckoutClientSecretResponse(response.data)
}

/** PATCH /api/bookings/{id}/checkout-payment-method — switch PI to another saved `pm_…`; use returned `clientSecret` to confirm (see backend §3e). */
export interface PatchCheckoutPaymentMethodPayload {
  savedPaymentMethodId: string
}

export const patchBookingCheckoutPaymentMethod = async (
  id: string,
  payload: PatchCheckoutPaymentMethodPayload,
): Promise<ResumeCheckoutResponse> => {
  const response = await api.patch(`/api/bookings/${id}/checkout-payment-method`, payload)
  return parseCheckoutClientSecretResponse(response.data)
}

/** GET /api/bookings/{id}/applicants — pending applications for an OPEN_FOR_APPLICATIONS booking */
export const getBookingApplicants = async (id: string): Promise<any[]> => {
  const response = await api.get(`/api/bookings/${id}/applicants`)
  const d = response.data
  if (Array.isArray(d)) return d
  if (Array.isArray(d?.data)) return d.data
  if (Array.isArray(d?.applicants)) return d.applicants
  return []
}

/** PATCH /api/bookings/{id} — update booking (only if REQUESTED) */
export const updateBooking = async (id: string, payload: UpdateBookingPayload): Promise<Booking> => {
  const response = await api.patch(`/api/bookings/${id}`, payload)
  return response.data
}

/** POST /api/bookings/{id}/cancel — cancel a booking (JSON: reason, optional details for OTHER) */
export const cancelBooking = async (id: string, payload: CancelBookingPayload): Promise<Booking> => {
  const body: { reason: CancelBookingReason; details?: string } = { reason: payload.reason }
  if (payload.reason === 'OTHER') {
    const d = (payload.details ?? '').trim().slice(0, 2000)
    body.details = d
  }
  const response = await api.post(`/api/bookings/${id}/cancel`, body)
  return response.data
}

/** POST /api/bookings/{id}/reopen-recommendation — customer reopens a declined booking into recommendation flow */
export const reopenRecommendation = async (id: string): Promise<Booking> => {
  const response = await api.post(`/api/bookings/${id}/reopen-recommendation`, {})
  return response.data
}

/** Body for proceed-to-payment / confirm when charging a saved Stripe PM (see `frontend-payments.md`). */
export interface BookingSavedPaymentPayload {
  savedPaymentMethodId: string
  paymentMethod?: string
}

/** POST /api/bookings/{id}/confirm — confirm a counter offer from artisan */
export const confirmBooking = async (
  id: string,
  payload?: BookingSavedPaymentPayload,
): Promise<Booking> => {
  const response = await api.post(`/api/bookings/${id}/confirm`, payload ?? {})
  return response.data
}

/** POST /api/bookings/{id}/proceed-to-payment — proceed to payment after Krafter is selected */
export const proceedToPayment = async (
  id: string,
  payload?: BookingSavedPaymentPayload,
): Promise<Booking> => {
  const response = await api.post(`/api/bookings/${id}/proceed-to-payment`, payload ?? {})
  return response.data
}

/** POST /api/bookings/{id}/select-applicant — select an applicant for the booking */
export const selectApplicant = async (id: string, payload: SelectApplicantPayload): Promise<Booking> => {
  const response = await api.post(`/api/bookings/${id}/select-applicant`, payload)
  return response.data
}

/** POST /api/bookings/{id}/select-krafter — body: `{ krafterId }` */
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

  if (payload.recommendationBookingId) {
    formData.append('recommendationBookingId', payload.recommendationBookingId)
  }
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
  if (payload.openForNegotiation !== undefined) {
    formData.append('openForNegotiation', String(payload.openForNegotiation))
  }
  const ratingReq = payload.krafterRatingRequirement ?? payload.minRatingRequirement
  if (ratingReq) formData.append('krafterRatingRequirement', ratingReq)
  if (payload.verifiedOnly !== undefined) formData.append('verifiedOnly', String(payload.verifiedOnly))
  if (payload.specialInstructions?.trim()) {
    formData.append('specialInstructions', payload.specialInstructions.trim())
  }

  if (payload.media && payload.media.length > 0) {
    const seen = new Set<string>()
    for (const file of payload.media) {
      const key = `${file.name}-${file.size}-${file.lastModified}`
      if (seen.has(key)) continue
      seen.add(key)
      formData.append('media', file)
    }
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

/**
 * Row from `GET /api/artisan/bookings` — camelCase list of bookings assigned to the Krafter
 * (same general shape as direct-requests rows, plus optional recommendation / cancellation fields).
 */
export interface ArtisanAssignedBookingRow {
  id: string
  customerId: string
  artisanId: string | null
  serviceListingId: string | null
  serviceCategoryId: string
  jobTitle: string
  jobDescription: string
  mediaUrls: string[] | null
  consentAcknowledged: boolean
  address: string
  latitude: string
  longitude: string
  preferredDate: string
  preferredTime: string
  proposedPrice: string | null
  finalAgreedPrice?: string | null
  platformFee?: string | null
  artisanEarning?: string | null
  pricingRuleId?: string | null
  status: string
  isRecommendationFlow?: boolean
  recommendationReopenCount?: number
  openForNegotiation?: boolean | null
  krafterRatingRequirement?: string | null
  createdAt: string
  updatedAt: string
  cancelledAt?: string | null
  cancellationReason?: string | null
  cancellationReasonDetails?: string | null
  completedAt?: string | null
}

function parseMoneyField(value: string | null | undefined): number | undefined {
  if (value == null || value === '') return undefined
  const n = parseFloat(String(value))
  return Number.isFinite(n) ? n : undefined
}

/** Normalize `GET /api/artisan/bookings` rows into shared `Booking` (snake_case + `title`/`service` for UI). */
export function mapArtisanAssignedBookingRowToBooking(row: ArtisanAssignedBookingRow): Booking {
  const proposed = parseMoneyField(row.proposedPrice)
  const finalAgreed = parseMoneyField(row.finalAgreedPrice)
  const price = finalAgreed ?? proposed

  const firstMedia =
    row.mediaUrls && row.mediaUrls.length > 0 ? row.mediaUrls[0] : undefined

  const timeRaw = row.preferredTime?.trim() ?? ''
  const scheduledTime =
    timeRaw.length >= 5 ? timeRaw.slice(0, 5) : timeRaw || undefined

  const category: ServiceCategory = {
    id: row.serviceCategoryId,
    name: 'Service',
    slug: slugifyCategory(row.jobTitle),
  }

  const service: Service = {
    id: row.serviceListingId || row.serviceCategoryId,
    title: row.jobTitle,
    description: row.jobDescription,
    price_per_hour: price ?? 0,
    category,
    artisan: { id: row.artisanId ?? '', fullName: '' },
    is_active: true,
    created_at: row.createdAt,
  }

  return {
    id: row.id,
    service_id: row.serviceListingId || row.serviceCategoryId,
    customer_id: row.customerId,
    artisan_id: row.artisanId ?? undefined,
    status: row.status as Booking['status'],
    scheduled_date: row.preferredDate,
    scheduled_time: scheduledTime,
    location: row.address,
    notes: row.jobDescription,
    price,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    title: row.jobTitle,
    image: firstMedia,
    service,
    jobTitle: row.jobTitle,
    jobDescription: row.jobDescription,
    address: row.address,
    preferredDate: row.preferredDate,
    preferredTime: row.preferredTime,
    mediaUrls: row.mediaUrls ?? undefined,
    artisanId: row.artisanId,
    serviceCategoryId: row.serviceCategoryId,
    createdAt: row.createdAt,
    latitude: row.latitude,
    longitude: row.longitude,
  }
}

function unwrapArtisanBookingWritePayload(root: unknown): unknown {
  if (!root || typeof root !== 'object') return root
  const r = root as Record<string, unknown>
  if (r.booking && typeof r.booking === 'object') return r.booking
  return root
}

/** POST `/start`, `/complete`, etc. may return `{ booking }` or a camelCase row — normalize to `Booking`. */
export function normalizeArtisanBookingWriteResponse(data: unknown): Booking {
  const row = unwrapArtisanBookingWritePayload(data)
  if (
    row &&
    typeof row === 'object' &&
    'jobTitle' in row &&
    typeof (row as ArtisanAssignedBookingRow).jobTitle === 'string'
  ) {
    return mapArtisanAssignedBookingRowToBooking(row as ArtisanAssignedBookingRow)
  }
  return row as Booking
}

/** GET /api/artisan/bookings — all bookings assigned to the current Krafter (CONFIRMED, IN_PROGRESS, COMPLETED, etc.). */
export const getArtisanBookings = async (): Promise<Booking[]> => {
  const response = await api.get<ArtisanAssignedBookingRow[]>('/api/artisan/bookings')
  const raw = response.data
  if (!Array.isArray(raw)) return []
  return raw.map(mapArtisanAssignedBookingRowToBooking)
}

/** Row from `GET /api/artisan/bookings/direct-requests` */
export interface DirectArtisanBookingRequest {
  id: string
  customerId: string
  artisanId: string | null
  serviceListingId: string | null
  serviceCategoryId: string
  jobTitle: string
  jobDescription: string
  mediaUrls: string[] | null
  consentAcknowledged: boolean
  address: string
  latitude: string
  longitude: string
  preferredDate: string
  preferredTime: string
  proposedPrice: string | null
  finalAgreedPrice?: string | null
  platformFee?: string | null
  artisanEarning?: string | null
  pricingRuleId?: string | null
  status: string
  createdAt: string
  updatedAt: string
  cancelledAt?: string | null
  completedAt?: string | null
}

/** GET /api/artisan/bookings/direct-requests — all direct booking requests for the current artisan */
export const getDirectArtisanBookings = async (): Promise<DirectArtisanBookingRequest[]> => {
  const response = await api.get<DirectArtisanBookingRequest[]>(
    '/api/artisan/bookings/direct-requests',
  )
  return response.data
}

/**
 * Row from `GET /api/artisan/bookings/marketplace-applications` — application with nested `booking`.
 */
export interface MarketplaceApplicationApiRow {
  id: string
  bookingId: string
  artisanId: string
  proposedPrice: string | null
  message: string | null
  status: string
  createdAt: string
  updatedAt: string
  booking: Record<string, unknown>
}

function looksLikeMarketplaceApplication(root: Record<string, unknown>): boolean {
  return (
    typeof root.bookingId === 'string' &&
    typeof root.id === 'string' &&
    root.booking != null &&
    typeof root.booking === 'object' &&
    !Array.isArray(root.booking)
  )
}

/** Map marketplace-applications API row → `Booking` (booking id preserved for detail / View Kraft). */
export function mapMarketplaceApplicationRowToBooking(row: MarketplaceApplicationApiRow): Booking {
  const raw = row.booking as unknown as MarketplaceOpenBookingRow & { hasApplied?: boolean }
  const openLike: MarketplaceOpenBookingRow = {
    ...raw,
    hasApplied: typeof raw.hasApplied === 'boolean' ? raw.hasApplied : false,
  }
  const base = mapMarketplaceOpenRowToBooking(openLike)
  const listingPrice = base.price
  const offerRaw = row.proposedPrice
  const offerParsed =
    offerRaw != null && String(offerRaw).trim() !== '' ? parseFloat(String(offerRaw)) : NaN
  const offerAmount = Number.isFinite(offerParsed) ? offerParsed : listingPrice ?? 0

  return {
    ...base,
    id: base.id,
    marketplaceApplicationId: row.id,
    marketplaceApplicationStatus: row.status,
    marketplaceApplicationMessage: row.message ?? undefined,
    marketplaceApplicationSubmittedAt: row.createdAt,
    listingProposedPrice: listingPrice ?? base.proposedPrice ?? null,
    proposedPrice: offerRaw ?? offerAmount,
    price: offerAmount,
    hasApplied: true,
  }
}

function looksLikeMarketplaceOpenRow(x: Record<string, unknown>): boolean {
  return (
    typeof x.id === 'string' &&
    typeof x.jobTitle === 'string' &&
    typeof x.address === 'string' &&
    typeof x.serviceCategoryId === 'string'
  )
}

function looksLikeArtisanAssignedRow(x: Record<string, unknown>): boolean {
  return typeof x.jobTitle === 'string' && typeof x.status === 'string' && typeof x.id === 'string'
}

/** GET /api/artisan/bookings/marketplace-applications — all marketplace applications for the current artisan */
export const getMarketplaceApplications = async (): Promise<Booking[]> => {
  const response = await api.get<unknown>('/api/artisan/bookings/marketplace-applications')
  const raw = response.data
  if (!Array.isArray(raw)) return []
  return raw.map((item: unknown) => {
    if (!item || typeof item !== 'object') {
      return item as Booking
    }
    const root = item as Record<string, unknown>
    if (looksLikeMarketplaceApplication(root)) {
      return mapMarketplaceApplicationRowToBooking(root as unknown as MarketplaceApplicationApiRow)
    }
    const booking =
      root.booking && typeof root.booking === 'object'
        ? (root.booking as Record<string, unknown>)
        : root
    if (looksLikeMarketplaceOpenRow(booking)) {
      return mapMarketplaceOpenRowToBooking(booking as unknown as MarketplaceOpenBookingRow)
    }
    if (looksLikeArtisanAssignedRow(booking)) {
      return mapArtisanAssignedBookingRowToBooking(booking as unknown as ArtisanAssignedBookingRow)
    }
    return normalizeBookingDetailResponse(booking)
  })
}

/** GET /api/artisan/bookings/marketplace/open — Browse OPEN_FOR_APPLICATIONS marketplace tasks */
export const getOpenMarketplaceTasks = async (
  params?: GetOpenMarketplaceTasksParams
): Promise<GetOpenMarketplaceTasksResponse> => {
  const response = await api.get<GetOpenMarketplaceTasksResponse>(
    '/api/artisan/bookings/marketplace/open',
    { params }
  )
  return response.data
}

/** POST /api/artisan/bookings/:id/respond — body `ArtisanRespondPayload` (e.g. `{ "action": "DECLINE" }`) */
export const respondToBooking = async (
  id: string,
  payload: ArtisanRespondPayload
): Promise<Booking> => {
  const response = await api.post(`/api/artisan/bookings/${id}/respond`, payload)
  return response.data
}

/** POST /api/artisan/bookings/:id/respond — body strictly `{ "action": "DECLINE" }` */
export const declineArtisanBooking = async (id: string): Promise<Booking> => {
  const response = await api.post(`/api/artisan/bookings/${id}/respond`, {
    action: 'DECLINE' as const,
  })
  return response.data
}

/** POST /api/artisan/bookings/{id}/start — CONFIRMED → IN_PROGRESS (after customer payment is held). */
export const startBooking = async (id: string): Promise<Booking> => {
  const response = await api.post(`/api/artisan/bookings/${id}/start`)
  return normalizeArtisanBookingWriteResponse(response.data)
}

/** POST /api/artisan/bookings/{id}/complete — IN_PROGRESS → COMPLETED (escrow release / payout on server). */
export const completeBooking = async (id: string): Promise<Booking> => {
  const response = await api.post(`/api/artisan/bookings/${id}/complete`)
  return normalizeArtisanBookingWriteResponse(response.data)
}

/** POST /api/artisan/bookings/{id}/apply — apply to an OPEN_FOR_APPLICATIONS booking */
export const applyToBooking = async (
  id: string,
  payload: ArtisanApplyPayload
): Promise<Booking> => {
  const response = await api.post(`/api/artisan/bookings/${id}/apply`, payload)
  return response.data
}
