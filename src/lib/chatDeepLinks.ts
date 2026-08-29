import type { Booking } from "@/types";
import type { DirectArtisanBookingRequest } from "@/lib/api/bookings";
import { readDmConversationIdFromBooking } from "@/lib/bookingChat";

function normStatus(status: string | undefined | null): string {
  return String(status ?? "")
    .trim()
    .toUpperCase()
    .replace(/-/g, "_");
}

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
  const conversationId = readDmConversationIdFromBooking(b);
  if (conversationId) params.set("conversationId", conversationId);
  return `/user/chat?${params.toString()}`;
}

const CUSTOMER_CHAT_BLOCKED_STATUSES = new Set([
  "EXPIRED",
  "CANCELLED",
  "COMPLETED",
  "DISPUTED",
  "DECLINED",
]);

const CHAT_BLOCKED_UNTIL_PAYMENT = new Set(["PAYMENT_PENDING"]);

/** Statuses where the customer has authorized payment (hold) and DM is allowed. */
const CHAT_PAYMENT_AUTHORIZED_STATUSES = new Set([
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETION_SUBMITTED",
  "COMPLETED",
  "DISPUTED",
]);

export function hasBookingChatConversation(b: Booking): boolean {
  return Boolean(readDmConversationIdFromBooking(b));
}

/** Payment authorized enough for DM (backend creates/opens chat after customer authorizes). */
export function isBookingPaymentAuthorizedForChat(status: string | undefined | null): boolean {
  const s = normStatus(status);
  if (!s) return false;
  if (CHAT_BLOCKED_UNTIL_PAYMENT.has(s)) return false;
  return CHAT_PAYMENT_AUTHORIZED_STATUSES.has(s);
}

/** Chat is available when the API exposes a conversation id or payment is authorized. */
export function isBookingChatAvailable(b: Booking): boolean {
  return hasBookingChatConversation(b) || isBookingPaymentAuthorizedForChat(b.status);
}

export function bookingChatUnavailableHint(
  b: Booking,
  role: "customer" | "tasker",
): string | null {
  if (isBookingChatAvailable(b)) return null;
  if (normStatus(b.status) === "PAYMENT_PENDING") {
    return role === "tasker"
      ? "Chat opens after the customer authorizes payment."
      : "Complete payment to message your Krafter.";
  }
  return "Messaging is not available for this booking yet.";
}

/** Customer may message assigned Krafter only while the booking is active and chat is open. */
export function canCustomerMessageKrafter(b: Booking): boolean {
  const status = normStatus(b.status);
  if (CUSTOMER_CHAT_BLOCKED_STATUSES.has(status)) return false;
  if (!buildCustomerMessageKrafterUrl(b)) return false;
  return isBookingChatAvailable(b);
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
  const conversationId = req.conversationId?.trim();
  if (conversationId) params.set("conversationId", conversationId);
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
  const conversationId = readDmConversationIdFromBooking(b);
  if (conversationId) params.set("conversationId", conversationId);
  return `/tasker/chat?${params.toString()}`;
}

export function canTaskerMessageCustomerFromDirectRequest(
  req: DirectArtisanBookingRequest,
): boolean {
  if (!buildTaskerMessageCustomerUrlFromDirectRequest(req)) return false;
  if (req.conversationId?.trim()) return true;
  return isBookingPaymentAuthorizedForChat(req.status);
}

export function canTaskerMessageCustomer(b: Booking): boolean {
  if (!buildTaskerMessageCustomerUrlFromBooking(b)) return false;
  return isBookingChatAvailable(b);
}
