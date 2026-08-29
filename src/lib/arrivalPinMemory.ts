/**
 * Arrival PINs must never be written to localStorage, sessionStorage, logs,
 * analytics, URLs, or crash reports. This module keeps them in process memory.
 */

type PinRecord = {
  pin: string;
  expiresAt: string;
  issuedAtMs: number;
};

const pins = new Map<string, PinRecord>();
const lastIssueAt = new Map<string, number>();

export const ARRIVAL_PIN_REGEN_COOLDOWN_MS = 60_000;

export function rememberArrivalPin(bookingId: string, pin: string, expiresAt: string): void {
  pins.set(bookingId, {
    pin,
    expiresAt,
    issuedAtMs: Date.now(),
  });
  lastIssueAt.set(bookingId, Date.now());
}

export function readArrivalPin(bookingId: string): { pin: string; expiresAt: string } | null {
  const row = pins.get(bookingId);
  if (!row) return null;
  if (row.expiresAt) {
    const exp = Date.parse(row.expiresAt);
    if (!Number.isNaN(exp) && exp <= Date.now()) {
      pins.delete(bookingId);
      return null;
    }
  }
  return { pin: row.pin, expiresAt: row.expiresAt };
}

export function clearArrivalPin(bookingId: string): void {
  pins.delete(bookingId);
}

export function arrivalPinCooldownRemainingMs(bookingId: string): number {
  const last = lastIssueAt.get(bookingId);
  if (!last) return 0;
  return Math.max(0, ARRIVAL_PIN_REGEN_COOLDOWN_MS - (Date.now() - last));
}
