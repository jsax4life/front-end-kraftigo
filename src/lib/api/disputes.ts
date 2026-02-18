import api from '@/lib/axios'
import type { Dispute } from '@/types'

export interface CreateDisputePayload {
  booking_id: string
  reason: string
  description?: string
}

/** POST /api/disputes — create a dispute for a completed or cancelled booking */
export const createDispute = async (payload: CreateDisputePayload): Promise<Dispute> => {
  const response = await api.post('/api/disputes', payload)
  return response.data
}

/** GET /api/disputes/my — all disputes for the current user */
export const getMyDisputes = async (): Promise<Dispute[]> => {
  const response = await api.get('/api/disputes/my')
  return response.data
}
