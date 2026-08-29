import type { Booking } from "@/types";
import { clearArrivalPin } from "@/lib/arrivalPinMemory";

export const DEFAULT_NO_SHOW_GRACE_MINUTES = 15;

export function normBookingStatus(status: string | undefined | null): string {
  return String(status ?? "")
    .replace(/-/g, "_")
    .toUpperCase();
}

export function isCompletionSubmittedStatus(status: string | undefined | null): boolean {
  return normBookingStatus(status) === "COMPLETION_SUBMITTED";
}

export function isDisputedStatus(status: string | undefined | null): boolean {
  return normBookingStatus(status) === "DISPUTED";
}

export function isCompletedStatus(status: string | undefined | null): boolean {
  return normBookingStatus(status) === "COMPLETED";
}

export function isInProgressStatus(status: string | undefined | null): boolean {
  return normBookingStatus(status) === "IN_PROGRESS";
}

export function isConfirmedStatus(status: string | undefined | null): boolean {
  return normBookingStatus(status) === "CONFIRMED";
}

export function syncArrivalPinWithBookingStatus(
  bookingId: string,
  status: string | undefined | null,
): void {
  if (!isConfirmedStatus(status)) {
    clearArrivalPin(bookingId);
  }
}

function pickBookingField(booking: Booking, ...keys: string[]): unknown {
  const row = booking as unknown as Record<string, unknown>;
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
      return row[key];
    }
  }
  return undefined;
}

/** Combine scheduled date + time from whatever fields the booking carries. */
export function resolveScheduledStartMs(booking: Booking): number | null {
  const dateRaw = pickBookingField(
    booking,
    "scheduled_date",
    "scheduledDate",
    "preferredDate",
    "preferred_date",
  );
  const timeRaw = pickBookingField(
    booking,
    "scheduled_time",
    "scheduledTime",
    "preferredTime",
    "preferred_time",
  );
  if (typeof dateRaw !== "string" || !dateRaw.trim()) return null;

  const datePart = dateRaw.trim();
  const timePart = typeof timeRaw === "string" && timeRaw.trim() ? timeRaw.trim() : "00:00";
  const hasTz = /[zZ]|[+-]\d{2}:?\d{2}$/.test(datePart);
  const combined = datePart.includes("T")
    ? datePart
    : `${datePart}T${/^\d{1,2}:\d{2}/.test(timePart) ? timePart : "00:00"}`;
  const parsed = Date.parse(hasTz ? datePart : combined);
  return Number.isNaN(parsed) ? null : parsed;
}

export function resolveNoShowGraceMinutes(booking: Booking): number {
  const raw = pickBookingField(
    booking,
    "noShowGraceMinutes",
    "no_show_grace_minutes",
    "krafterNotHereGraceMinutes",
    "krafter_not_here_grace_minutes",
  );
  const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  if (Number.isFinite(n) && n >= 0) return n;
  return DEFAULT_NO_SHOW_GRACE_MINUTES;
}

/** True once scheduled start + grace have elapsed. Server still remains authoritative. */
export function isKrafterNotHereWindowOpen(booking: Booking, nowMs = Date.now()): boolean {
  const start = resolveScheduledStartMs(booking);
  if (start == null) return false;
  const graceMs = resolveNoShowGraceMinutes(booking) * 60_000;
  return nowMs >= start + graceMs;
}

export function completionDueAt(booking: Booking): string | null {
  const raw = pickBookingField(
    booking,
    "completionConfirmationDueAt",
    "completion_confirmation_due_at",
  );
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

export function completionMediaUrls(booking: Booking): string[] {
  const evidence = booking.completionMediaEvidence ?? booking.completion_media_evidence;
  const fromEvidence = Array.isArray(evidence)
    ? evidence
        .map((row) => {
          if (!row || typeof row !== "object") return "";
          const url = (row as { url?: unknown }).url;
          return typeof url === "string" ? url : "";
        })
        .filter(Boolean)
    : [];
  const urls = booking.completionMediaUrls ?? booking.completion_media_urls ?? [];
  const fromUrls = Array.isArray(urls)
    ? urls.filter((u): u is string => typeof u === "string" && u.trim().length > 0)
    : [];
  return [...fromEvidence, ...fromUrls];
}

export function completionAnomalyFlags(booking: Booking): string[] {
  const flags = booking.completionAnomalyFlags ?? booking.completion_anomaly_flags;
  return Array.isArray(flags) ? flags.filter((f): f is string => typeof f === "string") : [];
}

export function formatAnomalyFlag(flag: string): string {
  return flag.replace(/_/g, " ").toLowerCase();
}

export function canOpenGeneralDispute(status: string | undefined | null): boolean {
  const s = normBookingStatus(status);
  return [
    "IN_PROGRESS",
    "COMPLETION_SUBMITTED",
    "COMPLETED",
    "CANCELLED",
    "DISPUTED",
  ].includes(s);
}

export function canSubmitDisputeEvidence(status: string | undefined | null): boolean {
  const s = String(status ?? "")
    .replace(/-/g, "_")
    .toUpperCase();
  return s === "OPEN" || s === "UNDER_REVIEW";
}
