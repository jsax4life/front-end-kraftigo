import type { BookingStatus } from "@/types";

/** Shape returned by `GET /api/bookings/my` and `GET /api/bookings/:id` (camelCase + relations). */
export type BookingLike = {
  id?: string;
  status?: BookingStatus | string;
  service?: { title?: string; artisan?: { fullName?: string; avatar?: string } };
  service_id?: string;
  serviceCategoryId?: string | null;
  serviceCategory?: { id?: string; name?: string; imageUrl?: string };
  jobTitle?: string;
  jobDescription?: string;
  notes?: string;
  address?: string;
  location?: string;
  preferredDate?: string;
  preferredTime?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  createdAt?: string;
  created_at?: string;
  artisanId?: string | null;
  artisan_id?: string | null;
  artisan?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    avatar?: string;
    profilePhotoUrl?: string;
  } | null;
  mediaUrls?: string[];
  price?: number;
  proposedPrice?: number | string | null;
  proposed_price?: number | string | null;
  finalAgreedPrice?: number | string | null;
  final_agreed_price?: number | string | null;
  systemPrice?: number | string | null;
  system_price?: number | string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
};

/** Parse API money fields that may be `number`, numeric `string`, or empty `""`. */
export function parseBookingMoney(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function artisanDisplayName(b: BookingLike): string | null {
  const nested = b.service?.artisan?.fullName;
  if (nested?.trim()) return nested.trim();
  const a = b.artisan;
  if (!a) return null;
  if (a.fullName?.trim()) return a.fullName.trim();
  const n = `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim();
  return n || null;
}

/** Customer-facing status chip label (Active Job, detail modals). */
export function upcomingStatusLabel(status: string | undefined, urlAccepted: boolean): string {
  if (!status) return urlAccepted ? "Upcoming" : "Pending";
  switch (status) {
    case "DECLINED":
      return "Declined";
    case "RECOMMENDATION_PENDING":
      return "Pick a Krafter";
    case "REQUESTED":
      return "Requested";
    case "KRAFTER_SELECTED":
      return "Krafter selected";
    case "COUNTERED":
      return "Countered";
    case "ACCEPTED":
    case "CONFIRMED":
      return "Upcoming";
    case "PAYMENT_PENDING":
      return "Payment needed";
    case "IN_PROGRESS":
      return "In progress";
    case "OPEN_FOR_APPLICATIONS":
      return "Open listing";
    default:
      return urlAccepted ? "Upcoming" : "Pending";
  }
}

/** Customer should pick a Krafter (recommendation draft or no assignee yet). */
export function bookingNeedsKrafterSelection(b: BookingLike): boolean {
  if (b.status === "OPEN_FOR_APPLICATIONS") return false;
  if (b.artisan) return false;
  const aid = b.artisanId ?? b.artisan_id;
  if (aid) return false;
  if (b.status === "RECOMMENDATION_PENDING") return true;
  return false;
}

/** Query string for `/user/book-service/select-artisan` (matches page searchParams). */
export function buildSelectArtisanQuery(b: BookingLike): string {
  const params = new URLSearchParams();
  const catId =
    b.serviceCategoryId ??
    b.serviceCategory?.id ??
    (b as { service_category_id?: string }).service_category_id ??
    b.service_id ??
    "";
  const catName = b.serviceCategory?.name ?? b.jobTitle ?? b.service?.title ?? "Service";
  const addr = (b.address ?? b.location ?? "").trim();
  const dateRaw = b.preferredDate ?? b.scheduled_date ?? "";
  let dateStr = new Date().toISOString().slice(0, 10);
  if (dateRaw) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(dateRaw))) {
      dateStr = String(dateRaw);
    } else {
      const d = new Date(dateRaw);
      if (!isNaN(d.getTime())) dateStr = d.toISOString().split("T")[0];
    }
  }
  const timeRaw = String(b.preferredTime ?? b.scheduled_time ?? "09:00");
  const timeShort = timeRaw.length >= 5 ? timeRaw.slice(0, 5) : "09:00";
  const desc = (b.jobDescription ?? b.notes ?? "").trim();
  const taskDetailsForApi =
    desc || [catName, addr].filter(Boolean).join(" — ") || "Kraft request";

  params.set("categoryId", String(catId));
  params.set("category", catName);
  params.set("address", addr || "—");
  params.set("date", dateStr);
  params.set("time", timeShort);
  params.set("taskDetails", taskDetailsForApi);
  if (b.id) params.set("bookingId", b.id);

  const lat = b.latitude != null ? Number(b.latitude) : NaN;
  const lng = b.longitude != null ? Number(b.longitude) : NaN;
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    params.set("latitude", String(lat));
    params.set("longitude", String(lng));
  }

  return params.toString();
}

export function deriveActiveJobDisplay(b: BookingLike) {
  const service = b.jobTitle ?? b.serviceCategory?.name ?? b.service?.title ?? "Service";
  const dateRaw = b.preferredDate ?? b.scheduled_date ?? b.createdAt ?? b.created_at ?? "";
  let date = "—";
  if (dateRaw) {
    const iso = /^\d{4}-\d{2}-\d{2}$/.test(String(dateRaw)) ? `${dateRaw}T12:00:00` : String(dateRaw);
    const d = new Date(iso);
    if (!isNaN(d.getTime())) {
      date = d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  }
  const timeRaw = b.preferredTime ?? b.scheduled_time ?? "";
  const time =
    typeof timeRaw === "string" && timeRaw.length > 0
      ? timeRaw.length >= 5
        ? timeRaw.slice(0, 5)
        : timeRaw
      : "";

  const artisanName = artisanDisplayName(b);
  const loc = String(b.address ?? b.location ?? "—") || "—";
  const needsKrafterSelection = bookingNeedsKrafterSelection(b);

  const image =
    b.artisan?.avatar ??
    b.artisan?.profilePhotoUrl ??
    b.service?.artisan?.avatar ??
    (Array.isArray(b.mediaUrls) ? b.mediaUrls[0] : undefined) ??
    b.serviceCategory?.imageUrl ??
    "/images/pro.jpg";

  const artisanNameLine = needsKrafterSelection
    ? "Pick a Krafter"
    : artisanName
      ? `${service} with ${artisanName}`
      : service;

  const kraftDetails = (b.jobDescription ?? b.notes ?? "").trim();

  const proposed = parseBookingMoney(b.proposedPrice ?? b.proposed_price);
  const finalAgreed = parseBookingMoney(b.finalAgreedPrice ?? b.final_agreed_price);
  const system = parseBookingMoney(b.systemPrice ?? b.system_price);
  const legacyPrice = parseBookingMoney(b.price);

  const priceRows: { key: string; label: string; amount: number }[] = [];
  if (proposed !== null) {
    priceRows.push({ key: "proposedPrice", label: "Proposed price", amount: proposed });
  }
  if (finalAgreed !== null) {
    priceRows.push({ key: "finalAgreedPrice", label: "Final agreed price", amount: finalAgreed });
  }
  if (system !== null) {
    priceRows.push({ key: "systemPrice", label: "System price", amount: system });
  }
  if (priceRows.length === 0 && legacyPrice !== null) {
    priceRows.push({ key: "price", label: "Price", amount: legacyPrice });
  }

  const baseForTotal = finalAgreed !== null ? finalAgreed : proposed !== null ? proposed : legacyPrice;
  let total: number | null = null;
  if (baseForTotal !== null && system !== null) {
    total = baseForTotal + system;
  } else if (baseForTotal !== null) {
    total = baseForTotal;
  } else if (system !== null) {
    total = system;
  }

  return {
    service,
    date,
    time,
    timeLabel: "",
    artisan: {
      name: artisanNameLine,
      location: loc,
      image,
    },
    jobLocation: loc,
    kraftDetails: kraftDetails || "—",
    priceBreakdown: {
      rows: priceRows,
      total,
    },
    needsKrafterSelection,
    bookingStatus: b.status,
  };
}
