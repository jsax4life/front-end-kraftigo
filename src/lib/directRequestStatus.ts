/** Direct-request row status from `GET /api/artisan/bookings/direct-requests` (same as booking: after Krafter Accept, before customer authorizes). */
export function isDirectRequestPendingPayment(status: string | null | undefined): boolean {
  if (!status) return false
  return status.toUpperCase().replace(/-/g, "_") === "PAYMENT_PENDING"
}

export function directRequestStatusBadgeLabel(status: string | null | undefined): string | null {
  if (isDirectRequestPendingPayment(status)) return "Payment pending"
  return null
}
