const norm = (s: string) => s.replace(/-/g, "_").toUpperCase();

/**
 * Customer-only: `POST /api/bookings/:id/cancel` is rejected for IN_PROGRESS, COMPLETED, CANCELLED (400).
 * Allowed for other statuses (e.g. REQUESTED, PAYMENT_PENDING, CONFIRMED, …).
 */
export function canCustomerCancelBookingStatus(status: string | undefined | null): boolean {
  if (status == null || status === "") return false;
  const s = norm(status);
  return s !== "IN_PROGRESS" && s !== "COMPLETED" && s !== "CANCELLED";
}

/** Short UI copy when cancel is hidden (customer). */
export function customerCancelDisabledReason(status: string | undefined | null): string | null {
  if (status == null || status === "") return null;
  const s = norm(status);
  if (s === "IN_PROGRESS") {
    return "You can’t cancel while the job is in progress. Message your Krafter or contact support if you need help.";
  }
  if (s === "COMPLETED") {
    return "This booking is already completed.";
  }
  if (s === "CANCELLED") {
    return "This booking is already cancelled.";
  }
  return null;
}
