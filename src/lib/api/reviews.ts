import api from '@/lib/axios'
import type { Review } from '@/types'

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
export const submitReview = async (payload: CreateReviewPayload): Promise<Review> => {
  const response = await api.post('/api/reviews', payload)
  return response.data
}

/** GET /api/reviews/my — all reviews submitted by the current customer */
export const getMyReviews = async (): Promise<Review[]> => {
  const response = await api.get('/api/reviews/my')
  return response.data
}
