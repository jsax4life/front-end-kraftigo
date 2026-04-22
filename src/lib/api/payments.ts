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

/** Normalized from `POST /api/payments/cards` (backend may use camelCase or snake_case). */
export interface SetupIntentResponse {
  clientSecret: string
  setupIntentId?: string
}

export interface SavedPaymentMethod {
  id: string
  paymentMethodId: string
  type: string
  isDefault: boolean
  name?: string
  details?: any
  card?: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
    name?: string
    holder?: string
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

/** POST /api/payments/cards — returns Stripe SetupIntent `clientSecret` (optional `setupIntentId`). */
export const saveCard = async (payload?: SaveCardPayload): Promise<SetupIntentResponse> => {
  const headers: Record<string, string> = {}
  if (payload?.idempotencyKey) {
    headers['Idempotency-Key'] = payload.idempotencyKey
  }

  const response = await api.post('/api/payments/cards', {}, { headers })
  const data = response.data ?? {}
  const clientSecret =
    (typeof data.clientSecret === 'string' && data.clientSecret) ||
    (typeof data.client_secret === 'string' && data.client_secret) ||
    ''
  if (!clientSecret) {
    throw new Error('Invalid SetupIntent response: missing clientSecret')
  }
  const setupIntentId =
    (typeof data.setupIntentId === 'string' && data.setupIntentId) ||
    (typeof data.setup_intent_id === 'string' && data.setup_intent_id) ||
    undefined
  return { clientSecret, setupIntentId }
}

/** POST /api/payments/saved-methods — body `{ paymentMethodId, isDefault }` per API contract */
export const savePaymentMethod = async (payload: SavePaymentMethodPayload): Promise<void> => {
  await api.post('/api/payments/saved-methods', {
    paymentMethodId: payload.paymentMethodId,
    isDefault: payload.isDefault ?? false,
  })
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
