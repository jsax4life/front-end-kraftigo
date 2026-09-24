import type { KrafterPersonalDetailsSubmitPayload } from "@/lib/api/krafter-profile-completion";
import { normalizeGermanPostcode } from "@/lib/geoapify";

export type InitialOnboardingAddressFields = {
  streetNo: string;
  postCode: string;
  city: string;
  addressLatitude: number | null;
  addressLongitude: number | null;
};

/**
 * Marks complete-profile personal details using data from initial onboarding.
 * BE only requires initial onboarding done + not submitAsDraft for this timestamp.
 */
export function buildPersonalDetailsPayloadFromInitialOnboarding(
  fields: InitialOnboardingAddressFields,
): KrafterPersonalDetailsSubmitPayload {
  const postCode = normalizeGermanPostcode(fields.postCode);
  const whereYouLive = [fields.streetNo, postCode, fields.city]
    .filter(Boolean)
    .join(", ");

  const payload: KrafterPersonalDetailsSubmitPayload = { submitAsDraft: false };
  if (whereYouLive.trim()) payload.whereYouLive = whereYouLive.trim();
  if (
    fields.addressLatitude != null &&
    fields.addressLongitude != null &&
    Number.isFinite(fields.addressLatitude) &&
    Number.isFinite(fields.addressLongitude)
  ) {
    payload.latitude = fields.addressLatitude;
    payload.longitude = fields.addressLongitude;
  }
  return payload;
}
