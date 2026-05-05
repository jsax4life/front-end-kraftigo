import type { Booking } from "@/types";

/** Sub-tabs for `GET /api/artisan/bookings` on the Krafter Requests page (filtered client-side). */
export type KrafterAssignedTabId =
  | "needs_attention"
  | "confirmed"
  | "in_progress"
  | "completed";

const norm = (status: string) => status.replace(/-/g, "_").toUpperCase();

export function krafterAssignedTabForStatus(status: string): KrafterAssignedTabId {
  const s = norm(status);
  if (s === "CONFIRMED") return "confirmed";
  if (s === "IN_PROGRESS") return "in_progress";
  if (s === "EXPIRED") return "completed";
  if (s === "COMPLETED") return "completed";
  return "needs_attention";
}

export function filterBookingsByKrafterTab(
  bookings: Booking[],
  tab: KrafterAssignedTabId,
): Booking[] {
  return bookings.filter((b) => krafterAssignedTabForStatus(b.status) === tab);
}

export const KRAFTER_ASSIGNED_TAB_ORDER: KrafterAssignedTabId[] = [
  "needs_attention",
  "confirmed",
  "in_progress",
  "completed",
];

export const KRAFTER_ASSIGNED_TAB_LABEL: Record<KrafterAssignedTabId, string> = {
  needs_attention: "Needs attention",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
};
