import { parseCoordinate } from "@/lib/taskLocation";
import { formatGenderLabel } from "@/lib/genderOptions";
import type { ArtisanProfile } from "@/types";

function pickStr(obj: Record<string, unknown> | undefined, ...keys: string[]): string | undefined {
  if (!obj) return undefined;
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function pickNum(obj: Record<string, unknown> | undefined, ...keys: string[]): number | undefined {
  if (!obj) return undefined;
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim()) {
      const n = parseFloat(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

export function maskIban(iban: string | undefined | null): string | undefined {
  if (!iban?.trim()) return undefined;
  const clean = iban.replace(/\s/g, "");
  if (clean.length <= 4) return clean;
  const last4 = clean.slice(-4);
  return `${clean.slice(0, 2)}•• •••• •••• ••${last4}`;
}

export function maskBic(bic: string | undefined | null): string | undefined {
  if (!bic?.trim()) return undefined;
  if (bic.length <= 4) return bic;
  return `${bic.slice(0, 4)}••••`;
}

export function formatTransportType(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const map: Record<string, string> = {
    NONE: "None",
    CAR: "Car",
    VAN: "Van",
    BIKE: "Bike",
  };
  return map[value.toUpperCase()] ?? value;
}

export function formatGender(value: string | undefined | null): string | undefined {
  return formatGenderLabel(value) ?? (value?.trim() || undefined);
}

export function formatProfileDate(value: string | undefined | null): string | undefined {
  if (!value?.trim()) return undefined;
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) return value;
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatLanguageList(
  languages: ArtisanProfile["languages"] | undefined,
): string | undefined {
  if (!languages?.length) return undefined;
  return languages
    .map((l) => {
      if (typeof l === "string") return l;
      const prof = l.proficiency ? ` (${l.proficiency})` : "";
      return `${l.name}${prof}`;
    })
    .join(", ");
}

export function formatVerificationStatus(status: string | undefined | null): string | undefined {
  if (!status) return undefined;
  const map: Record<string, string> = {
    APPROVED: "Approved",
    PENDING: "Pending review",
    REJECTED: "Rejected",
    SUBMITTED: "Submitted",
  };
  return map[status.toUpperCase()] ?? status;
}

export function formatOfferingRate(offering: {
  pricingType?: string;
  hourlyRate?: number;
  flatRate?: number;
  serviceCategoryName?: string;
  experienceYears?: number;
}): string {
  const name = offering.serviceCategoryName ?? "Service";
  const type = (offering.pricingType ?? "HOURLY").toUpperCase();
  const rate =
    type === "FLAT"
      ? offering.flatRate != null
        ? `€${offering.flatRate} flat`
        : "Flat rate"
      : offering.hourlyRate != null
        ? `€${offering.hourlyRate}/hr`
        : "Hourly rate";
  const exp =
    offering.experienceYears != null && offering.experienceYears > 0
      ? ` · ${offering.experienceYears} yrs experience`
      : "";
  return `${name}: ${rate}${exp}`;
}

export function getArtisanProfileCoords(
  profile: ArtisanProfile | null | undefined,
): { latitude: number; longitude: number } | null {
  if (!profile) return null;
  const lat = parseCoordinate(profile.latitude);
  const lng = parseCoordinate(profile.longitude);
  if (lat == null || lng == null) return null;
  return { latitude: lat, longitude: lng };
}

export function getKycExtractedDetails(
  profile: ArtisanProfile | null | undefined,
): Record<string, unknown> | undefined {
  const raw = profile as Record<string, unknown> | null | undefined;
  const verification = raw?.verification;
  if (!verification || typeof verification !== "object") return undefined;
  const details = (verification as Record<string, unknown>).kycExtractedDetails;
  return details && typeof details === "object" ? (details as Record<string, unknown>) : undefined;
}

export function getProfileUser(
  profile: ArtisanProfile | null | undefined,
): Record<string, unknown> | undefined {
  const raw = profile as Record<string, unknown> | null | undefined;
  const user = raw?.user;
  return user && typeof user === "object" ? (user as Record<string, unknown>) : undefined;
}

export function getProfileVerification(
  profile: ArtisanProfile | null | undefined,
): Record<string, unknown> | undefined {
  const raw = profile as Record<string, unknown> | null | undefined;
  const verification = raw?.verification;
  return verification && typeof verification === "object"
    ? (verification as Record<string, unknown>)
    : undefined;
}

export function readProfileField(
  profile: ArtisanProfile | null | undefined,
  ...keys: string[]
): string | undefined {
  if (!profile) return undefined;
  const root = profile as unknown as Record<string, unknown>;
  return pickStr(root, ...keys);
}

export function readUserField(
  profile: ArtisanProfile | null | undefined,
  ...keys: string[]
): string | undefined {
  return pickStr(getProfileUser(profile), ...keys);
}

export function readVerificationField(
  profile: ArtisanProfile | null | undefined,
  ...keys: string[]
): string | undefined {
  return pickStr(getProfileVerification(profile), ...keys);
}

export function readKycField(
  profile: ArtisanProfile | null | undefined,
  ...keys: string[]
): string | undefined {
  const details = getKycExtractedDetails(profile);
  for (const key of keys) {
    const v = details?.[key];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return undefined;
}

export function readProfileNumber(
  profile: ArtisanProfile | null | undefined,
  ...keys: string[]
): number | undefined {
  if (!profile) return undefined;
  return pickNum(profile as unknown as Record<string, unknown>, ...keys);
}

export function getServiceOfferings(
  profile: ArtisanProfile | null | undefined,
): Array<{
  serviceCategoryName?: string;
  pricingType?: string;
  hourlyRate?: number;
  flatRate?: number;
  experienceYears?: number;
}> {
  const raw = profile as Record<string, unknown> | null | undefined;
  const offerings = raw?.serviceCategoryOfferings ?? raw?.service_category_offerings;
  if (!Array.isArray(offerings)) return [];
  return offerings.map((item) => {
    if (!item || typeof item !== "object") return {};
    const o = item as Record<string, unknown>;
    return {
      serviceCategoryName: pickStr(o, "serviceCategoryName", "service_category_name"),
      pricingType: pickStr(o, "pricingType", "pricing_type"),
      hourlyRate: pickNum(o, "hourlyRate", "hourly_rate"),
      flatRate: pickNum(o, "flatRate", "flat_rate"),
      experienceYears: pickNum(o, "experienceYears", "experience_years"),
    };
  });
}
