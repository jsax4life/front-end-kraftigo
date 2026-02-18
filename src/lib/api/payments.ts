import api from '@/lib/axios'
import type { Payment } from '@/types'

/** POST /api/payments/initiate — initiate escrow payment for a confirmed booking */
export const initiatePayment = async (booking_id: string): Promise<Payment> => {
  const response = await api.post('/api/payments/initiate', { booking_id })
  return response.data
}

/** GET /api/payments/my — all payments for the current customer */
export const getMyPayments = async (): Promise<Payment[]> => {
  const response = await api.get('/api/payments/my')
  return response.data
}
