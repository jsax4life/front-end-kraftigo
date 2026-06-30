export function parseCoordinate(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "string" ? parseFloat(value) : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Reject null island and out-of-range coordinates. */
export function isValidCoordinatePair(lat: unknown, lng: unknown): boolean {
  const la = parseCoordinate(lat);
  const lo = parseCoordinate(lng);
  if (la == null || lo == null) return false;
  if (la === 0 && lo === 0) return false;
  if (la < -90 || la > 90 || lo < -180 || lo > 180) return false;
  return true;
}

export function resolveTaskCoordinates(opts: {
  urlLat?: string | null;
  urlLng?: string | null;
  storeLat?: number | null;
  storeLng?: number | null;
  bookingLat?: unknown;
  bookingLng?: unknown;
}): { latitude: number; longitude: number } | null {
  const candidates: [unknown, unknown][] = [
    [opts.urlLat, opts.urlLng],
    [opts.storeLat, opts.storeLng],
    [opts.bookingLat, opts.bookingLng],
  ];

  for (const [latRaw, lngRaw] of candidates) {
    if (isValidCoordinatePair(latRaw, lngRaw)) {
      return {
        latitude: parseCoordinate(latRaw)!,
        longitude: parseCoordinate(lngRaw)!,
      };
    }
  }

  return null;
}

/** True when artisan/krafter profile has stored WGS84 coords for proximity. */
export function hasKrafterProfileCoords(
  profile: { latitude?: unknown; longitude?: unknown } | null | undefined,
): boolean {
  if (!profile) return false;
  return isValidCoordinatePair(profile.latitude, profile.longitude);
}
