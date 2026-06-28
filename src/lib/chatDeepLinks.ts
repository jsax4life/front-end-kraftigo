import type { Booking } from "@/types";
import type { DirectArtisanBookingRequest } from "@/lib/api/bookings";

/** Krafter’s user id for customer → `/user/chat?artisanId=…&name=…`. */
export function getKrafterUserIdFromBooking(b: Booking): string | undefined {
  const raw =
    b.artisanId ??
    b.artisan_id ??
    (b.service?.artisan?.id != null ? String(b.service.artisan.id) : undefined);
  const s = raw != null ? String(raw).trim() : "";
  return s || undefined;
}

export function getKrafterDisplayNameForChat(b: Booking): string {
  return (
    b.artisanName?.trim() ||
    b.artisan?.fullName?.trim() ||
    [b.artisan?.firstName, b.artisan?.lastName].filter(Boolean).join(" ").trim() ||
    b.service?.artisan?.fullName?.trim() ||
    "Krafter"
  );
}

/** Deep-link into customer Messages with the assigned Krafter pre-selected when possible. */
export function buildCustomerMessageKrafterUrl(b: Booking): string | null {
  const artisanId = getKrafterUserIdFromBooking(b);
  if (!artisanId) return null;
  const params = new URLSearchParams();
  params.set("artisanId", artisanId);
  params.set("name", getKrafterDisplayNameForChat(b));
  if (b.id?.trim()) params.set("bookingId", b.id.trim());
  return `/user/chat?${params.toString()}`;
}

const CUSTOMER_CHAT_BLOCKED_STATUSES = new Set([
  "EXPIRED",
  "CANCELLED",
  "COMPLETED",
  "DISPUTED",
  "DECLINED",
]);

/** Customer may message assigned Krafter only while the booking is still active. */
export function canCustomerMessageKrafter(b: Booking): boolean {
  const status = String(b.status ?? "")
    .trim()
    .toUpperCase()
    .replace(/-/g, "_");
  if (CUSTOMER_CHAT_BLOCKED_STATUSES.has(status)) return false;
  return buildCustomerMessageKrafterUrl(b) !== null;
}

/** Deep-link into tasker Messages with the customer pre-selected. */
export function buildTaskerMessageCustomerUrlFromDirectRequest(
  req: DirectArtisanBookingRequest,
): string | null {
  const cid = req.customerId?.trim();
  if (!cid) return null;
  const params = new URLSearchParams();
  params.set("userId", cid);
  params.set("name", "Customer");
  if (req.id?.trim()) params.set("bookingId", req.id.trim());
  return `/tasker/chat?${params.toString()}`;
}

export function buildTaskerMessageCustomerUrlFromBooking(b: Booking): string | null {
  const ext = b as unknown as Record<string, unknown>;
  const cid = String(
    b.customer?.id ?? b.customer_id ?? ext.customerId ?? ext.customer_id ?? "",
  ).trim();
  if (!cid) return null;
  const name =
    [b.customer?.firstName, b.customer?.lastName].filter(Boolean).join(" ").trim() ||
    b.customerName?.trim() ||
    "Customer";
  const params = new URLSearchParams();
  params.set("userId", cid);
  params.set("name", name);
  if (b.id?.trim()) params.set("bookingId", b.id.trim());
  return `/tasker/chat?${params.toString()}`;
}
