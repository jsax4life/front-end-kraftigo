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

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
}

function pickStr(r: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = r[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return undefined
}

function pickNum(r: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const v = r[k]
    if (v === null || v === undefined) continue
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

/** Normalize receipt summary or detail from API (camelCase + snake_case). */
export function normalizePaymentResponse(data: unknown): Payment {
  const root = asRecord(data)
  const row =
    root.payment && typeof root.payment === 'object'
      ? asRecord(root.payment)
      : root.data && typeof root.data === 'object' && !Array.isArray(root.data)
        ? asRecord(root.data)
        : root

  const krafterRaw = row.krafter
  const krafter =
    krafterRaw && typeof krafterRaw === 'object'
      ? {
          displayName: pickStr(asRecord(krafterRaw), 'displayName', 'display_name'),
          profilePhotoUrl: pickStr(asRecord(krafterRaw), 'profilePhotoUrl', 'profile_photo_url'),
          rating: pickNum(asRecord(krafterRaw), 'rating'),
          reviewCount: pickNum(asRecord(krafterRaw), 'reviewCount', 'review_count'),
          completedKrafts: pickNum(asRecord(krafterRaw), 'completedKrafts', 'completed_krafts'),
          badges: Array.isArray(asRecord(krafterRaw).badges)
            ? (asRecord(krafterRaw).badges as unknown[]).filter(
                (b): b is string => typeof b === 'string',
              )
            : undefined,
        }
      : undefined

  const breakdownRaw = row.breakdown
  const breakdown =
    breakdownRaw && typeof breakdownRaw === 'object'
      ? (() => {
          const b = asRecord(breakdownRaw)
          const lineItemsRaw = b.lineItems ?? b.line_items
          const lineItems = Array.isArray(lineItemsRaw)
            ? lineItemsRaw
                .map((item) => {
                  const li = asRecord(item)
                  const label = pickStr(li, 'label', 'name') ?? ''
                  const amount = pickNum(li, 'amount') ?? 0
                  return label ? { label, amount } : null
                })
                .filter((x): x is { label: string; amount: number } => x !== null)
            : undefined
          return {
            ...(lineItems?.length ? { lineItems } : {}),
            ...(pickNum(b, 'serviceFee', 'service_fee') !== undefined
              ? { serviceFee: pickNum(b, 'serviceFee', 'service_fee') }
              : {}),
            discountLabel:
              (pickStr(b, 'discountLabel', 'discount_label') as string | null | undefined) ??
              (b.discountLabel === null || b.discount_label === null ? null : undefined),
            ...(pickNum(b, 'discountAmount', 'discount_amount') !== undefined
              ? { discountAmount: pickNum(b, 'discountAmount', 'discount_amount') }
              : {}),
            ...(pickNum(b, 'totalPaid', 'total_paid') !== undefined
              ? { totalPaid: pickNum(b, 'totalPaid', 'total_paid') }
              : {}),
          }
        })()
      : undefined

  const timelineRaw = row.timeline
  const timeline = Array.isArray(timelineRaw)
    ? timelineRaw
        .filter((e): e is Record<string, unknown> => e && typeof e === 'object')
        .map((e) => ({
          label: pickStr(e, 'label'),
          status: pickStr(e, 'status'),
          at: pickStr(e, 'at', 'timestamp'),
          timestamp: pickStr(e, 'timestamp', 'at'),
        }))
    : undefined

  const id = pickStr(row, 'id') ?? String(row.id ?? '')
  const amount = pickNum(row, 'amount', 'totalPaid', 'total_paid') ?? 0
  const status = (pickStr(row, 'status') ?? 'PENDING') as Payment['status']

  return {
    ...(row as unknown as Payment),
    id,
    amount,
    status,
    currency: pickStr(row, 'currency') ?? 'EUR',
    transactionReference: pickStr(row, 'transactionReference', 'transaction_reference'),
    statusLabel: pickStr(row, 'statusLabel', 'status_label'),
    transactionDate: pickStr(row, 'transactionDate', 'transaction_date', 'createdAt', 'created_at'),
    totalPaid: pickNum(row, 'totalPaid', 'total_paid') ?? amount,
    jobTitle: pickStr(row, 'jobTitle', 'job_title'),
    scheduledAt: pickStr(row, 'scheduledAt', 'scheduled_at'),
    createdAt: pickStr(row, 'createdAt', 'created_at'),
    created_at: pickStr(row, 'created_at', 'createdAt'),
    contextId: pickStr(row, 'contextId', 'context_id'),
    context_id: pickStr(row, 'context_id', 'contextId'),
    booking_id: pickStr(row, 'booking_id', 'bookingId'),
    ...(krafter ? { krafter } : {}),
    ...(breakdown ? { breakdown } : {}),
    ...(timeline?.length ? { timeline } : {}),
  }
}

function normalizePaymentList(data: unknown): Payment[] {
  if (Array.isArray(data)) return data.map(normalizePaymentResponse)
  const root = asRecord(data)
  const list = root.data ?? root.payments ?? root.results
  if (Array.isArray(list)) return list.map(normalizePaymentResponse)
  return []
}

/** POST /api/payments/initiate — initiate escrow payment for a confirmed booking */
export const initiatePayment = async (booking_id: string): Promise<Payment> => {
  const response = await api.post('/api/payments/initiate', { booking_id })
  return response.data
}

/** GET /api/payments/my — receipt summary list for the current customer */
export const getMyPayments = async (): Promise<Payment[]> => {
  const response = await api.get('/api/payments/my')
  return normalizePaymentList(response.data)
}

/** GET /api/payments/:id — full receipt with breakdown and timeline */
export const getPaymentById = async (id: string): Promise<Payment> => {
  const response = await api.get(`/api/payments/${id}`)
  return normalizePaymentResponse(response.data)
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
