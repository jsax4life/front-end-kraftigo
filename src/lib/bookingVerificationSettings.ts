import api from "@/lib/axios";

export type BookingVerificationSettings = {
  arrivalPinEnabled: boolean;
  completionProofRequired: boolean;
};

const DEFAULTS: BookingVerificationSettings = {
  arrivalPinEnabled: false,
  completionProofRequired: false,
};

let cachedCustomer: BookingVerificationSettings | null = null;
let cachedArtisan: BookingVerificationSettings | null = null;
let inflightCustomer: Promise<BookingVerificationSettings> | null = null;
let inflightArtisan: Promise<BookingVerificationSettings> | null = null;

function parseSettings(data: unknown): BookingVerificationSettings {
  const row =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {};
  const nested =
    row.data && typeof row.data === "object" && !Array.isArray(row.data)
      ? (row.data as Record<string, unknown>)
      : row;
  const arrivalRaw = nested.arrivalPinEnabled ?? nested.arrival_pin_enabled;
  const proofRaw = nested.completionProofRequired ?? nested.completion_proof_required;
  return {
    arrivalPinEnabled: arrivalRaw === true || arrivalRaw === "true" || arrivalRaw === 1,
    completionProofRequired: proofRaw === true || proofRaw === "true" || proofRaw === 1,
  };
}

async function fetchSettings(path: string): Promise<BookingVerificationSettings> {
  try {
    const { data } = await api.get(path);
    return parseSettings(data);
  } catch {
    return DEFAULTS;
  }
}

export async function getCustomerBookingVerificationSettings(): Promise<BookingVerificationSettings> {
  if (cachedCustomer) return cachedCustomer;
  if (!inflightCustomer) {
    inflightCustomer = fetchSettings("/api/bookings/verification-settings").then((s) => {
      cachedCustomer = s;
      inflightCustomer = null;
      return s;
    });
  }
  return inflightCustomer;
}

export async function getArtisanBookingVerificationSettings(): Promise<BookingVerificationSettings> {
  if (cachedArtisan) return cachedArtisan;
  if (!inflightArtisan) {
    inflightArtisan = fetchSettings("/api/artisan/bookings/verification-settings").then((s) => {
      cachedArtisan = s;
      inflightArtisan = null;
      return s;
    });
  }
  return inflightArtisan;
}

/** Test / logout flows */
export function clearBookingVerificationSettingsCache(): void {
  cachedCustomer = null;
  cachedArtisan = null;
  inflightCustomer = null;
  inflightArtisan = null;
}
