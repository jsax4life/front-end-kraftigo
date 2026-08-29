export const BOOKING_DETAIL_INVALIDATE_EVENT = "kraftigo:booking-detail-invalidate";
export const DISPUTES_INVALIDATE_EVENT = "kraftigo:disputes-invalidate";

export function emitBookingDetailInvalidate(bookingId?: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(BOOKING_DETAIL_INVALIDATE_EVENT, { detail: { bookingId } }),
  );
}

export function emitDisputesInvalidate(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(DISPUTES_INVALIDATE_EVENT));
}
