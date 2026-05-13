import type { Application } from "@/types";

type LooseRecord = Record<string, unknown>;

function asRecord(v: unknown): LooseRecord | null {
  return v !== null && typeof v === "object" ? (v as LooseRecord) : null;
}

/** Pending-only filter for customer applicants list. */
export function isPendingBookingApplication(row: unknown): boolean {
  const r = asRecord(row);
  if (!r) return true;
  const s = String(r.status ?? r.applicationStatus ?? "").toUpperCase();
  return !s || s === "PENDING";
}

/**
 * Maps `GET /api/bookings/:id/applicants` rows to the legacy `Application` UI shape.
 * `Application.id` is the booking-application row id (used for select-applicant).
 */
export function mapBookingApplicationRowToApplication(
  row: unknown,
  bookingId: string,
): Application | null {
  const r = asRecord(row);
  if (!r) return null;
  const applicationId = r.id ?? r.applicationId;
  if (applicationId == null || String(applicationId).trim() === "") return null;

  const artisan = asRecord(r.artisan) ?? asRecord(r.krafter) ?? {};
  const artisanId =
    artisan.id ?? artisan.artisanId ?? r.artisanId ?? r.artisan_id ?? applicationId;
  const fullNameRaw =
    (typeof artisan.fullName === "string" && artisan.fullName) ||
    [artisan.firstName, artisan.lastName].filter(Boolean).join(" ").trim() ||
    "Krafter";
  const avatar =
    (typeof artisan.avatar === "string" && artisan.avatar) ||
    (typeof artisan.profilePhotoUrl === "string" && artisan.profilePhotoUrl) ||
    "/images/pro.jpg";

  const proposed = r.proposedPrice ?? r.proposed_price ?? r.hourlyRate ?? r.hourly_rate;
  const pricingTypeRaw =
    r.proposedPricingType ??
    r.proposed_pricing_type ??
    r.offerPricingType ??
    r.offer_pricing_type;
  const isHourly = String(pricingTypeRaw ?? "").toUpperCase() === "HOURLY";
  let priceStr = "—";
  if (proposed != null && proposed !== "") {
    const n = Number(proposed);
    if (Number.isFinite(n)) {
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(n);
      priceStr = isHourly ? `${formatted}/hr` : formatted;
    }
  }

  const message =
    (typeof r.message === "string" && r.message) ||
    (typeof r.proposalMessage === "string" && r.proposalMessage) ||
    (typeof r.proposal_message === "string" && r.proposal_message) ||
    "";

  const rating = Number(artisan.rating ?? 0) || 0;
  const reviews_count =
    Number(artisan.reviews_count ?? artisan.reviewsCount ?? 0) || 0;
  const tasks_count =
    Number(artisan.completed_jobs ?? artisan.completedJobs ?? artisan.tasks_count ?? 0) ||
    0;
  const bio =
    (typeof artisan.bio === "string" && artisan.bio) ||
    (typeof r.notes === "string" && r.notes) ||
    "";

  return {
    id: String(applicationId),
    job_id: bookingId,
    artisan_id: String(artisanId),
    artisan_name: fullNameRaw,
    proposal_message: message,
    proposed_price_optional:
      proposed != null && proposed !== "" && Number.isFinite(Number(proposed))
        ? Number(proposed)
        : undefined,
    price: priceStr,
    status: "pending",
    rating,
    reviews_count,
    tasks_count,
    image: avatar,
    description: bio || message,
    is_top_pro: Boolean(artisan.isTopPro ?? artisan.is_top_pro),
  };
}
