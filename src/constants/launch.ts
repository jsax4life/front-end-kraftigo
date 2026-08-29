/**
 * Home-page coming soon gate (customer marketplace only).
 * Krafter signup URLs (`/krafter/signup`, `/user/createacc?intent=krafter`) stay reachable.
 *
 * Set `NEXT_PUBLIC_LAUNCH_AT` to an ISO-8601 datetime (e.g. `2026-09-15T10:00:00+01:00`).
 * Set `NEXT_PUBLIC_HOME_COMING_SOON=0` to show the full home before launch (preview / QA).
 */

const DEFAULT_LAUNCH_AT = "2026-09-15T10:00:00+01:00";

export function getLaunchAt(): Date {
  const raw = process.env.NEXT_PUBLIC_LAUNCH_AT?.trim() || DEFAULT_LAUNCH_AT;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(DEFAULT_LAUNCH_AT);
  }
  return parsed;
}

/** True while the public customer home should show the coming-soon landing. */
export function isHomeComingSoonActive(): boolean {
  if (process.env.NEXT_PUBLIC_HOME_COMING_SOON?.trim() === "0") {
    return false;
  }
  return Date.now() < getLaunchAt().getTime();
}
