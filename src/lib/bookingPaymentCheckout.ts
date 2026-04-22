import type { Booking } from '@/types'

/** Stripe PaymentIntent client secrets look like `pi_…_secret_…` (not SetupIntent `seti_…`). */
export function isPaymentIntentClientSecret(secret: string | null | undefined): boolean {
  if (!secret || typeof secret !== 'string') return false
  const s = secret.trim()
  return /^pi_[a-zA-Z0-9]+_secret_[a-zA-Z0-9]+$/.test(s)
}

/** Stripe PaymentIntent client secret from booking detail/list `payment` object (camelCase or snake_case). */
export function bookingPaymentClientSecret(
  booking: Pick<Booking, 'payment'> | null | undefined,
): string | undefined {
  const p = booking?.payment
  if (!p) return undefined
  return p.clientSecret ?? p.client_secret ?? undefined
}
