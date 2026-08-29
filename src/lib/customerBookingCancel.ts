const norm = (s: string) => s.replace(/-/g, "_").toUpperCase();

/**
 * Customer-only: ordinary cancellation is unavailable after verified work
 * starts or while completion/dispute review is active.
 * Allowed for other statuses (e.g. REQUESTED, PAYMENT_PENDING, CONFIRMED, …).
 */
export function canCustomerCancelBookingStatus(status: string | undefined | null): boolean {
  if (status == null || status === "") return false;
  const s = norm(status);
  return ![
    "IN_PROGRESS",
    "COMPLETION_SUBMITTED",
    "COMPLETED",
    "DISPUTED",
    "EXPIRED",
    "CANCELLED",
  ].includes(s);
}

/** Short UI copy when cancel is hidden (customer). */
export function customerCancelDisabledReason(status: string | undefined | null): string | null {
  if (status == null || status === "") return null;
  const s = norm(status);
  if (s === "IN_PROGRESS") {
    return "You can’t cancel while the job is in progress. Message your Krafter or contact support if you need help.";
  }
  if (s === "COMPLETION_SUBMITTED") {
    return "The Krafter submitted completion proof. Confirm the work or open a dispute instead.";
  }
  if (s === "DISPUTED") {
    return "This booking is under dispute. Ordinary cancellation is unavailable.";
  }
  if (s === "COMPLETED") {
    return "This booking is already completed.";
  }
  if (s === "EXPIRED") {
    return "This booking has expired because the scheduled time passed.";
  }
  if (s === "CANCELLED") {
    return "This booking is already cancelled.";
  }
  return null;
}
