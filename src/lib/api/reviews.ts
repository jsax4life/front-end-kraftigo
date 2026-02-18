import api from '@/lib/axios'
import type { Review } from '@/types'

export interface CreateReviewPayload {
  booking_id: string
  rating: number
  comment?: string
  tags?: string[]
  tip_amount?: number
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
