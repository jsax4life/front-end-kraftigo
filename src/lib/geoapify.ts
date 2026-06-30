import { isValidCoordinatePair } from "@/lib/taskLocation";

const GEOAPIFY_KEY = "21f120cab34b44fdad5b5f4cc2a8105f";

function parseCoord(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

/** Read WGS84 coords from a Geoapify autocomplete/search result row. */
export function parseGeoapifyLatLon(row: Record<string, unknown>): {
  latitude: number;
  longitude: number;
} | null {
  const lat = parseCoord(row.lat);
  const lon = parseCoord(row.lon);
  if (!isValidCoordinatePair(lat, lon)) return null;
  return { latitude: lat!, longitude: lon! };
}

/** Forward-geocode free text (Germany) when the user did not pick a suggestion. */
export async function geocodeAddressText(
  text: string,
): Promise<{ latitude: number; longitude: number } | null> {
  const q = text.trim();
  if (q.length < 3) return null;

  try {
    const res = await fetch(
      `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(q)}&filter=countrycode:de&format=json&limit=1&apiKey=${GEOAPIFY_KEY}`,
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { results?: Record<string, unknown>[] };
    const first = json.results?.[0];
    if (!first) return null;
    return parseGeoapifyLatLon(first);
  } catch {
    return null;
  }
}

/**
 * Prefer picker coords; otherwise geocode `whereYouLive` before PATCH so profile
 * latitude/longitude are populated on artisan_profiles.
 */
export async function resolveKrafterLocationCoords(
  locationText: string,
  pickerCoords: { latitude: number; longitude: number } | null,
): Promise<{ latitude: number; longitude: number } | null> {
  if (
    pickerCoords &&
    isValidCoordinatePair(pickerCoords.latitude, pickerCoords.longitude)
  ) {
    return pickerCoords;
  }
  return geocodeAddressText(locationText);
}
