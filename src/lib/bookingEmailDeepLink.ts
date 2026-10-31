import type { Booking, BookingStatus, Payment } from "@/types";
import { getMyPayments } from "@/lib/api/payments";

const PAID_PAYMENT_STATUSES = new Set([
  "AUTHORIZED",
  "HELD",
  "ESCROWED",
  "ESCROW_HELD",
  "CAPTURED",
  "RELEASED",
]);

const POST_PAYMENT_BOOKING_STATUSES = new Set<BookingStatus>([
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETION_SUBMITTED",
  "COMPLETED",
]);

export type BookingEmailIntent = "pay" | "receipt" | "auto";

export function paymentBelongsToBooking(payment: Payment, bookingId: string): boolean {
  const linked =
    payment.booking_id ??
    payment.contextId ??
    payment.context_id ??
    "";
  return linked === bookingId;
}

export function isPaidPaymentStatus(status: string | undefined): boolean {
  if (!status) return false;
  return PAID_PAYMENT_STATUSES.has(status.toUpperCase());
}

/** Customer still owes checkout authorization (email: Proceed to payment). */
export function bookingNeedsCustomerPayment(status: BookingStatus | string | undefined): boolean {
  const s = String(status ?? "").toUpperCase();
  return s === "PAYMENT_PENDING" || s === "ACCEPTED";
}

export function bookingLikelyHasReceipt(
  status: BookingStatus | string | undefined,
  payments: Payment[],
): boolean {
  if (payments.some((p) => isPaidPaymentStatus(String(p.status)))) return true;
  const s = String(status ?? "").toUpperCase() as BookingStatus;
  return POST_PAYMENT_BOOKING_STATUSES.has(s);
}

export async function findPaymentIdForBooking(bookingId: string): Promise<string | null> {
  const payments = await getMyPayments();
  const forBooking = payments.filter((p) => paymentBelongsToBooking(p, bookingId));
  if (forBooking.length === 0) return null;

  const paid = forBooking.filter((p) => isPaidPaymentStatus(String(p.status)));
  const pick = (paid.length > 0 ? paid : forBooking).sort((a, b) => {
    const ta = Date.parse(a.transactionDate ?? a.createdAt ?? a.created_at ?? "");
    const tb = Date.parse(b.transactionDate ?? b.createdAt ?? b.created_at ?? "");
    return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
  })[0];
  return pick?.id ?? null;
}

export function resolveBookingEmailIntent(
  requested: BookingEmailIntent,
  booking: Pick<Booking, "status">,
  payments: Payment[],
): "pay" | "receipt" | "details" {
  if (requested === "pay") return "pay";
  if (requested === "receipt") return "receipt";

  if (bookingNeedsCustomerPayment(booking.status)) return "pay";
  if (bookingLikelyHasReceipt(booking.status, payments)) return "receipt";
  return "details";
}
