import api from "@/lib/axios";
import type { Address } from "@/types";

export interface CreateAddressPayload {
  fullAddress: string;
  label?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  postalCode?: string;
  country?: string;
  externalPlaceId?: string;
}

const COORD_MATCH_EPSILON = 0.0001;

function normalizeAddressText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function parseCoord(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

function coordsMatch(
  latA: number,
  lngA: number,
  latB: number | null,
  lngB: number | null,
): boolean {
  if (latB == null || lngB == null) return false;
  return (
    Math.abs(latA - latB) < COORD_MATCH_EPSILON &&
    Math.abs(lngA - lngB) < COORD_MATCH_EPSILON
  );
}

/** Normalise API / store address for UI (`address` display field). */
export function normalizeAddressRecord(addr: Address): Address {
  return {
    ...addr,
    address: addr.address || addr.fullAddress || addr.label || "Unnamed Location",
    label: addr.label || "Unnamed Location",
  };
}

export interface AddressMatchInput {
  fullAddress: string;
  latitude?: number;
  longitude?: number;
  externalPlaceId?: string;
}

/**
 * Find an existing saved address matching the candidate.
 * Priority: externalPlaceId → normalized fullAddress → lat/lng.
 */
export function findMatchingAddress(
  existing: Address[],
  input: AddressMatchInput,
): Address | null {
  const normInput = normalizeAddressText(input.fullAddress);
  const placeId = input.externalPlaceId?.trim();

  if (placeId) {
    const byPlace = existing.find((a) => a.externalPlaceId?.trim() === placeId);
    if (byPlace) return byPlace;
  }

  const byText = existing.find((a) => {
    const text = a.fullAddress ?? a.address ?? "";
    return text.trim() && normalizeAddressText(text) === normInput;
  });
  if (byText) return byText;

  const lat = input.latitude;
  const lng = input.longitude;
  if (lat != null && lng != null) {
    const byCoords = existing.find((a) =>
      coordsMatch(lat, lng, parseCoord(a.latitude), parseCoord(a.longitude)),
    );
    if (byCoords) return byCoords;
  }

  return null;
}

/**
 * GET /api/addresses, reuse a matching row when possible, otherwise POST.
 */
export async function findOrCreateAddress(
  payload: CreateAddressPayload,
): Promise<{ address: Address; created: boolean }> {
  const existing = (await getAddresses()).map(normalizeAddressRecord);
  const match = findMatchingAddress(existing, {
    fullAddress: payload.fullAddress,
    latitude: payload.latitude,
    longitude: payload.longitude,
    externalPlaceId: payload.externalPlaceId,
  });

  if (match) {
    return { address: match, created: false };
  }

  const created = await createAddress(payload);
  return { address: normalizeAddressRecord(created), created: true };
}

/**
 * Persists an address on the backend and returns the saved record with a
 * server-generated UUID `id`. The returned `id` should be used as `addressId`
 * when creating or updating a Custom Kraft.
 */
export const createAddress = async (
  payload: CreateAddressPayload,
): Promise<Address> => {
  const response = await api.post("/api/addresses", payload);
  return response.data;
};

/**
 * GET /api/addresses — returns all addresses for the current user
 */
export const getAddresses = async (): Promise<Address[]> => {
  const response = await api.get("/api/addresses");
  return response.data;
};

/**
 * GET /api/addresses/{id} — returns a single address that belongs to the current user
 */
export const getAddressById = async (id: string): Promise<Address> => {
  const response = await api.get(`/api/addresses/${id}`);
  return response.data;
};
 