/** Booking `durationHours` sent to `select-krafter` / `select-applicant` (backend default is 1 if omitted). */

export const DURATION_HOURS_MIN = 0.25
export const DURATION_HOURS_MAX = 24
export const DEFAULT_DURATION_HOURS = 1

/** Snap to quarter-hour steps within [min, max]. */
export function clampDurationHours(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_DURATION_HOURS
  const stepped = Math.round(n * 4) / 4
  return Math.min(DURATION_HOURS_MAX, Math.max(DURATION_HOURS_MIN, stepped))
}

/** Parse `hours` query param (or similar); empty / invalid → default 1. */
export function parseDurationHoursParam(raw: string | null | undefined): number {
  if (raw == null || String(raw).trim() === "") return DEFAULT_DURATION_HOURS
  return clampDurationHours(Number(raw))
}

/** Inline validation for controlled inputs (Confirm / Next). */
export function validateDurationHours(n: number): string | null {
  if (!Number.isFinite(n)) return "Enter a valid number of hours."
  if (n < DURATION_HOURS_MIN) return `Hours must be at least ${DURATION_HOURS_MIN}.`
  if (n > DURATION_HOURS_MAX) return `Hours cannot exceed ${DURATION_HOURS_MAX}.`
  const stepped = Math.round(n * 4) / 4
  if (Math.abs(stepped - n) > 1e-9) {
    return "Use increments of 0.25 hours (15 minutes)."
  }
  return null
}
