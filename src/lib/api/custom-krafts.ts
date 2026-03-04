import api from "@/lib/axios";
import type {
  CustomKraft,
  CustomKraftFrequency,
  CustomKraftExpiryOption,
  CustomKraftStatus,
} from "@/types";

export interface CreateCustomKraftPayload {
  description: string;
  photos?: string[];
  roughCategoryId?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  addressId?: string;        // optional — filled in Step 2
  bookingHours?: number;     // optional — filled in Step 2
  frequency?: CustomKraftFrequency;    // optional — filled in Step 2
  offerAmount?: number;
  openToNegotiation?: boolean;
  expiryOption?: CustomKraftExpiryOption; // optional — filled in Step 3
  expiryDate?: string;
  urgentBoost?: boolean;
  status?: Extract<CustomKraftStatus, "DRAFT" | "PUBLISHED">;
}
// Re-export for convenience so consumers can import from one place
export type {
  CustomKraft,
  CustomKraftFrequency,
  CustomKraftExpiryOption,
  CustomKraftStatus,
};

export interface UpdateStep1Payload {
  description: string;
  photos?: string[];
  roughCategoryId?: string;
}

export interface UpdateStep2Payload {
  addressId: string;
  bookingHours: number;
  frequency: CustomKraftFrequency;
  scheduledDate?: string;
  scheduledTime?: string;
}

export interface UpdateStep3Payload {
  offerAmount?: number;
  openToNegotiation: boolean;
  expiryOption: CustomKraftExpiryOption;
  expiryDate?: string;
  urgentBoost?: boolean;
}

// ─── Query Params ─────────────────────────────────────────────────────────────

export interface GetCustomKraftsParams {
  /**
   * Filter by user ID.
   * Pass "me" to get the current user's requests (includes drafts).
   * Omit or pass a specific user ID to get only published requests.
   */
  userId?: string | "me";
}

// ─── API Functions ────────────────────────────────────────────────────────────

/** GET /api/custom-krafts - Get Custom Kraft requests. */
export const getCustomKrafts = async (
  params?: GetCustomKraftsParams,
): Promise<CustomKraft[]> => {
  const response = await api.get("/api/custom-krafts", { params });
  return response.data;
};

/** GET /api/custom-krafts/{id} - Get a single Custom Kraft request by ID. */
export const getCustomKraftById = async (id: string): Promise<CustomKraft> => {
  const response = await api.get(`/api/custom-krafts/${id}`);
  return response.data;
};

/** POST /api/custom-krafts/{id}/publish - Publish a draft. Validates all required fields before making it visible to artisans. */
export const publishCustomKraft = async (id: string): Promise<CustomKraft> => {
  const response = await api.post(`/api/custom-krafts/${id}/publish`);
  return response.data;
};

/** PUT /api/custom-krafts/{id}/step/1 - Update Step 1: Description, photos, and rough category. */
export const updateCustomKraftStep1 = async (
  id: string,
  payload: UpdateStep1Payload,
): Promise<CustomKraft> => {
  const response = await api.put(`/api/custom-krafts/${id}/step/1`, payload);
  return response.data;
};

/** PUT /api/custom-krafts/{id}/step/1/upload - Same as Step 1 but accepts photo files as multipart/form-data. */
export const uploadCustomKraftStep1 = async (
  id: string,
  {
    description,
    photos,
    roughCategoryId,
  }: {
    description: string;
    photos?: File[];
    roughCategoryId?: string;
  },
): Promise<CustomKraft> => {
  const formData = new FormData();
  formData.append("description", description);
  if (roughCategoryId) formData.append("roughCategoryId", roughCategoryId);
  photos?.forEach((file) => formData.append("photos", file));

  const response = await api.put(
    `/api/custom-krafts/${id}/step/1/upload`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return response.data;
};

/** PUT /api/custom-krafts/{id}/step/2 - Update Step 2: Address, hours, frequency, and optional schedule. */
export const updateCustomKraftStep2 = async (
  id: string,
  payload: UpdateStep2Payload,
): Promise<CustomKraft> => {
  const response = await api.put(`/api/custom-krafts/${id}/step/2`, payload);
  return response.data;
};

/** PUT /api/custom-krafts/{id}/step/3 - Update Step 3: Budget, negotiation, expiry, and urgent boost. */
export const updateCustomKraftStep3 = async (
  id: string,
  payload: UpdateStep3Payload,
): Promise<CustomKraft> => {
  const response = await api.put(`/api/custom-krafts/${id}/step/3`, payload);
  return response.data;
};

/** POST /api/custom-krafts/draft - Create a new draft Custom Kraft request. All fields are optional except those required by CreateCustomKraftPayload. Status defaults to DRAFT. */
export const createCustomKraftDraft = async (
  payload: CreateCustomKraftPayload,
): Promise<CustomKraft> => {
  const response = await api.post("/api/custom-krafts/draft", {
    status: "DRAFT",
    ...payload,
  });
  return response.data;
};

/** POST /api/custom-krafts/draft/upload - Create a draft and upload photos in one multipart request. Backend uploads files to S3 and populates the photos field automatically. */
export const uploadCustomKraftDraft = async (
  payload: Omit<CreateCustomKraftPayload, "photos"> & { photos?: File[] },
): Promise<CustomKraft> => {
  const formData = new FormData();

  // All fields are conditionally appended — backend accepts partial drafts
  formData.append("description", payload.description);
  if (payload.addressId) formData.append("addressId", payload.addressId);
  if (payload.bookingHours != null)
    formData.append("bookingHours", String(payload.bookingHours));
  if (payload.frequency) formData.append("frequency", payload.frequency);
  if (payload.expiryOption)
    formData.append("expiryOption", payload.expiryOption);

  // Optional fields
  if (payload.roughCategoryId)
    formData.append("roughCategoryId", payload.roughCategoryId);
  if (payload.scheduledDate)
    formData.append("scheduledDate", payload.scheduledDate);
  if (payload.scheduledTime)
    formData.append("scheduledTime", payload.scheduledTime);
  if (payload.offerAmount != null)
    formData.append("offerAmount", String(payload.offerAmount));
  if (payload.openToNegotiation != null)
    formData.append("openToNegotiation", String(payload.openToNegotiation));
  if (payload.expiryDate) formData.append("expiryDate", payload.expiryDate);
  if (payload.urgentBoost != null)
    formData.append("urgentBoost", String(payload.urgentBoost));
  formData.append("status", payload.status ?? "DRAFT");

  // Photo files
  payload.photos?.forEach((file) => formData.append("photos", file));

  const response = await api.post("/api/custom-krafts/draft/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};
