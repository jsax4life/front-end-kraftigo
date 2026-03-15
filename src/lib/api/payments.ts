import api from '@/lib/axios'
import type { Payment } from '@/types'

// ─── Request Payloads ─────────────────────────────────────────────────────────

export interface SaveCardPayload {
  /** Optional idempotency key to prevent duplicate SetupIntent creation */
  idempotencyKey?: string
}

export interface SavePaymentMethodPayload {
  paymentMethodId: string
  isDefault?: boolean
}

// ─── Response Shapes ──────────────────────────────────────────────────────────

export interface SetupIntentResponse {
  setupIntentId: string
  clientSecret: string
  paymentMethodId: string
  success: boolean
}

export interface SavedPaymentMethod {
  id: string
  paymentMethodId: string
  type: string
  isDefault: boolean
  card?: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  }
  createdAt: string
}

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

/** POST /api/payments/cards — save and validate a card via Stripe SetupIntent.*/
export const saveCard = async (payload?: SaveCardPayload): Promise<SetupIntentResponse> => {
  const headers: Record<string, string> = {}
  if (payload?.idempotencyKey) {
    headers['Idempotency-Key'] = payload.idempotencyKey
  }

  const response = await api.post('/api/payments/cards', {}, { headers })
  return response.data
}

/** POST /api/payments/saved-methods — save a Stripe payment method ID to the user profile for future use */
export const savePaymentMethod = async (payload: SavePaymentMethodPayload): Promise<void> => {
  await api.post('/api/payments/saved-methods', payload)
}

/** GET /api/payments/saved-methods — returns all saved payment methods for the current customer */
export const getSavedPaymentMethods = async (): Promise<SavedPaymentMethod[]> => {
  const response = await api.get('/api/payments/saved-methods')
  return response.data
}

/** DELETE /api/payments/saved-methods/{id} — remove a saved payment method from the user profile */
export const deleteSavedPaymentMethod = async (id: string): Promise<void> => {
  await api.delete(`/api/payments/saved-methods/${id}`)
}

/** PUT /api/payments/saved-methods/{id}/default — set a saved payment method as the default */
export const setDefaultSavedPaymentMethod = async (id: string): Promise<void> => {
  await api.put(`/api/payments/saved-methods/${id}/default`)
}
