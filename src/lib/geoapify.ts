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

/** Normalize to 5-digit German PLZ (digits only). */
export function normalizeGermanPostcode(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 5);
}

export type GermanPostcodeLookup = {
  city: string;
  latitude?: number;
  longitude?: number;
  /** Geoapify `place_id` — use with `filter=place:…` to scope street autocomplete. */
  placeId?: string;
};

/** Resolve city (and optional centroid) from a German postal code. */
export async function lookupGermanPostcode(
  postcode: string,
): Promise<GermanPostcodeLookup | null> {
  const plz = normalizeGermanPostcode(postcode);
  if (plz.length !== 5) return null;

  try {
    const res = await fetch(
      `https://api.geoapify.com/v1/geocode/search?postcode=${encodeURIComponent(plz)}&country=de&format=json&limit=1&apiKey=${GEOAPIFY_KEY}`,
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { results?: Record<string, unknown>[] };
    const row = json.results?.[0];
    if (!row) return null;
    const city =
      (typeof row.city === "string" && row.city) ||
      (typeof row.town === "string" && row.town) ||
      (typeof row.village === "string" && row.village) ||
      (typeof row.municipality === "string" && row.municipality) ||
      "";
    if (!city.trim()) return null;
    const coords = parseGeoapifyLatLon(row);
    const placeId =
      typeof row.place_id === "string" && row.place_id.trim()
        ? row.place_id.trim()
        : undefined;
    return { city: city.trim(), ...(coords ?? {}), ...(placeId ? { placeId } : {}) };
  } catch {
    return null;
  }
}

export type GermanStreetAutocompleteOptions = {
  postcode?: string;
  city?: string;
  latitude?: number | null;
  longitude?: number | null;
};

function buildGermanStreetSearchText(
  query: string,
  options?: Pick<GermanStreetAutocompleteOptions, "postcode" | "city">,
): string {
  const trimmed = query.trim();
  const plz = options?.postcode ? normalizeGermanPostcode(options.postcode) : "";
  const city = options?.city?.trim() ?? "";
  if (plz.length === 5 && city) {
    return `${trimmed}, ${plz} ${city}`;
  }
  if (plz.length === 5) {
    return `${trimmed}, ${plz}`;
  }
  return trimmed;
}

/** Geoapify autocomplete URL scoped to Germany and the entered PLZ / city. */
export function buildGermanStreetAutocompleteUrl(
  query: string,
  options?: GermanStreetAutocompleteOptions,
): string {
  const params = new URLSearchParams({
    text: buildGermanStreetSearchText(query, options),
    filter: "countrycode:de",
    format: "json",
    limit: "12",
    apiKey: GEOAPIFY_KEY,
  });

  const lat = options?.latitude;
  const lon = options?.longitude;
  if (isValidCoordinatePair(lat, lon)) {
    params.set("bias", `proximity:${lon},${lat}`);
  }

  return `https://api.geoapify.com/v1/geocode/autocomplete?${params.toString()}`;
}

function buildGermanStreetSearchUrl(
  query: string,
  options?: GermanStreetAutocompleteOptions,
): string | null {
  const plz = options?.postcode ? normalizeGermanPostcode(options.postcode) : "";
  if (plz.length !== 5) return null;
  const params = new URLSearchParams({
    text: query.trim(),
    postcode: plz,
    country: "de",
    format: "json",
    limit: "12",
    apiKey: GEOAPIFY_KEY,
  });
  return `https://api.geoapify.com/v1/geocode/search?${params.toString()}`;
}

const STREETISH_RESULT_TYPES = new Set([
  "street",
  "building",
  "amenity",
  "suburb",
  "district",
]);

/** Map Geoapify rows into street picker options. */
export function mapGeoapifyStreetSuggestionRows(
  rows: Record<string, unknown>[],
  postcode?: string,
  city?: string,
): Array<{
  label: string;
  street: string;
  postcode: string;
  city: string;
  latitude?: number;
  longitude?: number;
}> {
  const plz = postcode ? normalizeGermanPostcode(postcode) : "";

  const mapped = rows
    .filter((r) => streetResultMatchesGermanPostcode(r, plz, city))
    .filter((r) => {
      const resultType = String(r.result_type ?? "").toLowerCase();
      if (STREETISH_RESULT_TYPES.has(resultType)) return true;
      return Boolean(r.street || r.housenumber || r.address_line1);
    })
    .map((r) => {
      const street =
        (typeof r.address_line1 === "string" && r.address_line1) ||
        (typeof r.street === "string"
          ? `${r.street}${r.housenumber ? ` ${String(r.housenumber)}` : ""}`.trim()
          : typeof r.name === "string"
            ? r.name
            : "");
      const resultPostcode = String(r.postcode ?? "");
      const city =
        (typeof r.city === "string" && r.city) ||
        (typeof r.town === "string" && r.town) ||
        (typeof r.village === "string" && r.village) ||
        (typeof r.county === "string" && r.county) ||
        "";
      const label =
        (typeof r.formatted === "string" && r.formatted) ||
        [street, resultPostcode, city].filter(Boolean).join(", ");
      const coords = parseGeoapifyLatLon(r);
      return {
        label,
        street,
        postcode: resultPostcode,
        city,
        ...(coords ?? {}),
      };
    })
    .filter((r) => r.street.trim().length > 0);

  const seen = new Set<string>();
  return mapped.filter((r) => {
    if (seen.has(r.label)) return false;
    seen.add(r.label);
    return true;
  });
}

/** Autocomplete with search fallback when PLZ is known (short prefixes). */
export async function fetchGermanStreetSuggestions(
  query: string,
  options?: GermanStreetAutocompleteOptions,
): Promise<
  Array<{
    label: string;
    street: string;
    postcode: string;
    city: string;
    latitude?: number;
    longitude?: number;
  }>
> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const autocompleteRes = await fetch(buildGermanStreetAutocompleteUrl(trimmed, options));
  let rows: Record<string, unknown>[] = [];
  if (autocompleteRes.ok) {
    const json = (await autocompleteRes.json()) as { results?: Record<string, unknown>[] };
    rows = json.results ?? [];
  }

  let suggestions = mapGeoapifyStreetSuggestionRows(
    rows,
    options?.postcode,
    options?.city,
  );

  if (suggestions.length === 0) {
    const searchUrl = buildGermanStreetSearchUrl(trimmed, options);
    if (searchUrl) {
      const searchRes = await fetch(searchUrl);
      if (searchRes.ok) {
        const json = (await searchRes.json()) as { results?: Record<string, unknown>[] };
        suggestions = mapGeoapifyStreetSuggestionRows(
          json.results ?? [],
          options?.postcode,
          options?.city,
        );
      }
    }
  }

  return suggestions;
}

/** Keep rows that match PLZ, or the resolved city when Geoapify omits / mismatches PLZ. */
export function streetResultMatchesGermanPostcode(
  row: Record<string, unknown>,
  postcode: string,
  city?: string,
): boolean {
  const plz = normalizeGermanPostcode(postcode);
  if (plz.length !== 5) return true;
  const resultPlz = normalizeGermanPostcode(String(row.postcode ?? ""));
  if (resultPlz === plz) return true;
  if (!resultPlz) return true;

  const expectedCity = city?.trim().toLowerCase();
  if (!expectedCity) return false;
  const resultCity = String(row.city ?? row.town ?? row.village ?? "")
    .trim()
    .toLowerCase();
  return resultCity === expectedCity;
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
