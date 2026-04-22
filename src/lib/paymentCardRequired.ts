/**
 * Detects 400 responses from gated booking/payment routes when the customer
 * has no saved Stripe payment method (see `frontend-payments.md` §1).
 */
export function isSavedPaymentMethodRequiredError(err: unknown): boolean {
  const ax = err as {
    response?: { status?: number; data?: { message?: unknown } }
  }
  if (ax.response?.status !== 400) return false
  const message = String(ax.response?.data?.message ?? '').toLowerCase()
  if (!message) return false
  return (
    message.includes('payment card') ||
    message.includes('saved-methods') ||
    message.includes('setupintent') ||
    message.includes('/api/payments/cards') ||
    message.includes('saved payment')
  )
}

/** Short, friendly copy for toast (avoid echoing raw API / internal route text). */
export const SAVED_PAYMENT_METHOD_REQUIRED_TOAST =
  "You'll need a saved card before we can continue. Add one with \"Add new payment method\", finish the quick Stripe step, then try again."

/** Prefer friendly card-required copy; otherwise API `message` or local `Error.message`. */
export function bookingApiErrorUserMessage(err: unknown, fallback: string): string {
  if (isSavedPaymentMethodRequiredError(err)) return SAVED_PAYMENT_METHOD_REQUIRED_TOAST
  const ax = err as { response?: { data?: { message?: string } }; message?: string }
  return ax.response?.data?.message || ax.message || fallback
}
