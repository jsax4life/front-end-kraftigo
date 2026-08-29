import type { ArtisanCompleteBookingPayload } from "@/lib/api/bookings";

/** Retain the last Complete payload until the workflow settles (retry after reauth). */
const retained = new Map<string, ArtisanCompleteBookingPayload>();

export function retainCompletePayload(
  bookingId: string,
  payload: ArtisanCompleteBookingPayload,
): void {
  retained.set(bookingId, payload);
}

export function readRetainedCompletePayload(
  bookingId: string,
): ArtisanCompleteBookingPayload | undefined {
  return retained.get(bookingId);
}

export function clearRetainedCompletePayload(bookingId: string): void {
  retained.delete(bookingId);
}
