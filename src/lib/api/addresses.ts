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
 