import api from '@/lib/axios'
import { normalizeMyReview, normalizeMyReviews, type MyReview } from '@/lib/reviewDisplay'

export interface CreateReviewPayload {
  bookingId: string
  rating: number
  // Backend accepts any one of these as review text.
  comment?: string
  feedback?: string
  details?: string
  reviewText?: string
  // Backend merges/dedupes these into standoutTags.
  selectedTags?: string[]
  standoutTags?: string[]
  highlights?: string[]
  // Optional media URLs (max 10 on backend).
  mediaUrls?: string[]
  // Krafter-side structured feedback (optional).
  instructionClarity?: number
  clearInstructions?: number
  environmentSafety?: number
  safeEnvironment?: number
  customerCourtesy?: number
  respectful?: number
  accessPreparedness?: number
  wouldWorkAgain?: boolean
}

/** POST /api/reviews — submit a review for a completed booking */
export const submitReview = async (payload: CreateReviewPayload): Promise<MyReview> => {
  const response = await api.post('/api/reviews', payload)
  const normalized = normalizeMyReview(response.data)
  if (normalized) return normalized
  return {
    id: payload.bookingId,
    bookingId: payload.bookingId,
    rating: payload.rating,
    comment: payload.comment ?? payload.feedback ?? payload.details ?? payload.reviewText,
    standoutTags: payload.standoutTags ?? payload.selectedTags ?? payload.highlights,
  }
}

/** GET /api/reviews/my — reviews submitted by the current user (customer or krafter) */
export const getMyReviews = async (): Promise<MyReview[]> => {
  const response = await api.get('/api/reviews/my')
  const data = response.data
  if (Array.isArray(data)) return normalizeMyReviews(data)
  if (data && typeof data === 'object') {
    const nested = (data as { reviews?: unknown }).reviews
    if (Array.isArray(nested)) return normalizeMyReviews(nested)
  }
  return []
}
