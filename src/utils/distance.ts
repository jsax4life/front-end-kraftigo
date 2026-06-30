export interface DistanceFields {
  distanceKm: number | null;
  distanceLabel: string | null;
}

function parseKm(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "string" ? parseFloat(value) : Number(value);
  return Number.isFinite(n) ? n : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Read canonical `distanceKm` / `distanceLabel` (and legacy aliases) from API rows. */
export function readDistanceFields(...sources: unknown[]): DistanceFields {
  let distanceKm: number | null = null;
  let distanceLabel: string | null = null;

  for (const src of sources) {
    const r = asRecord(src);
    if (!r) continue;

    if (distanceKm == null) {
      const km = parseKm(
        r.distanceKm ?? r.distance_km ?? r.krafterDistanceKm ?? r.krafter_distance_km,
      );
      if (km != null) distanceKm = km;
    }

    if (distanceLabel == null) {
      const lbl =
        r.distanceLabel ??
        r.distance_label ??
        r.krafterDistanceLabel ??
        r.krafter_distance_label;
      if (typeof lbl === "string" && lbl.trim()) distanceLabel = lbl.trim();
    }
  }

  return { distanceKm, distanceLabel };
}

/** Prefer backend `distanceLabel`; fall back to formatting `distanceKm`. */
export function formatDistanceDisplay(fields: DistanceFields): string | null {
  if (fields.distanceLabel) return fields.distanceLabel;
  if (fields.distanceKm == null) return null;
  const km = fields.distanceKm;
  if (km < 1) return `${km.toFixed(1)}km away`;
  return `${Math.round(km)}km away`;
}
