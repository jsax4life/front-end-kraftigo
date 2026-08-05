import type { BookingStatus } from "@/types";
import { formatDistanceDisplay, readDistanceFields } from "@/utils/distance";
import { appendFlexibleScheduleToUrlParams, formatFlexibleScheduleLabel } from "@/lib/flexibleSchedule";

/** Shape returned by `GET /api/bookings/my` and `GET /api/bookings/:id` (camelCase + relations). */
export type BookingLike = {
  id?: string;
  status?: BookingStatus | string;
  service?: {
    title?: string;
    artisan?: {
      fullName?: string;
      firstName?: string;
      lastName?: string;
      username?: string;
      userName?: string;
      avatar?: string;
    };
  };
  service_id?: string;
  serviceCategoryId?: string | null;
  serviceCategory?: { id?: string; name?: string; imageUrl?: string };
  jobTitle?: string;
  jobDescription?: string;
  notes?: string;
  address?: string;
  serviceAddress?: string;
  location?: string;
  preferredDate?: string;
  preferredTime?: string;
  preferredDateEnd?: string;
  additionalPreferredDates?: string[];
  scheduledDate?: string;
  scheduledTime?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  createdAt?: string;
  created_at?: string;
  artisanId?: string | null;
  artisan_id?: string | null;
  artisanName?: string;
  artisan_name?: string;
  artisan?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    username?: string;
    userName?: string;
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
  platformFee?: number | string | null;
  platform_fee?: number | string | null;
  artisanEarning?: number | string | null;
  artisan_earning?: number | string | null;
  pricingRuleId?: string | null;
  pricing_rule_id?: string | null;
  durationHours?: number | string | null;
  duration_hours?: number | string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  distanceKm?: number | null;
  distanceLabel?: string | null;
  krafterDistanceKm?: number | null;
  krafterDistanceLabel?: string | null;
};

/** Parse API money fields that may be `number`, numeric `string`, or empty `""`. */
export function parseBookingMoney(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function personName(
  p: { fullName?: string; firstName?: string; lastName?: string; username?: string; userName?: string } | undefined,
): string | null {
  if (!p) return null;
  if (p.fullName?.trim()) return p.fullName.trim();
  if (p.firstName?.trim()) return p.firstName.trim();
  const n = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
  if (n) return n;
  if (p.username?.trim()) return p.username.trim();
  if (p.userName?.trim()) return p.userName.trim();
  return null;
}

export function bookingArtisanName(b: BookingLike, fallback = "Krafter"): string {
  const explicit =
    (typeof b.artisanName === "string" && b.artisanName.trim()) ||
    (typeof b.artisan_name === "string" && b.artisan_name.trim()) ||
    "";
  return explicit || personName(b.service?.artisan) || personName(b.artisan ?? undefined) || fallback;
}

export type BookingCustomerPresentation = {
  displayName: string;
  initials: string;
  photoUrl: string | null;
  secondaryLine: string;
};

/** Resolve customer display from list/detail booking payloads (camel or snake_case). */
export function deriveBookingCustomerPresentation(
  booking: BookingLike & {
    customer?: {
      id?: string;
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
      phone?: string | null;
      profilePhotoUrl?: string | null;
      avatar?: string | null;
    } | null;
    customerName?: string;
    customer_id?: string;
  },
): BookingCustomerPresentation {
  const loose = booking as Record<string, unknown>;
  const c = booking.customer;
  const first = c?.firstName?.trim() || "";
  const last = c?.lastName?.trim() || "";
  const fromCustomer = [first, last].filter(Boolean).join(" ").trim();
  const explicitName =
    (typeof booking.customerName === "string" && booking.customerName.trim()) ||
    (typeof loose.customer_name === "string" && loose.customer_name.trim()) ||
    "";
  const displayName = fromCustomer || explicitName || "Customer";
  const initials = (() => {
    const a = first.charAt(0);
    const b = last.charAt(0) || first.charAt(1);
    const pair = (a + b).toUpperCase();
    if (pair) return pair;
    const n = displayName.trim();
    if (n.length >= 2) return n.slice(0, 2).toUpperCase();
    return n.charAt(0).toUpperCase() || "?";
  })();
  const photoUrl =
    (c?.profilePhotoUrl && String(c.profilePhotoUrl).trim()) ||
    (c?.avatar && String(c.avatar).trim()) ||
    null;
  const secondaryLine =
    (c?.phone && String(c.phone).trim()) ||
    (c?.email && String(c.email).trim()) ||
    "Customer";
  return { displayName, initials, photoUrl, secondaryLine };
}

function artisanDisplayName(b: BookingLike): string | null {
  const name = bookingArtisanName(b, "");
  return name || null;
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
    case "EXPIRED":
      return "Expired";
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

  appendFlexibleScheduleToUrlParams(params, {
    ...(b.preferredDateEnd ? { preferredDateEnd: b.preferredDateEnd } : {}),
    ...(b.additionalPreferredDates?.length
      ? { additionalPreferredDates: b.additionalPreferredDates }
      : {}),
  });

  return params.toString();
}

/** Shown on Krafts list cards when the booking has no uploaded task media. */
export const KRAFT_TASK_PLACEHOLDER_IMAGE = "/craft.svg";

/** Task-first thumbnail for customer Krafts list cards (media → category → craft icon). */
export function getKraftListCardImage(b: BookingLike): string {
  if (Array.isArray(b.mediaUrls)) {
    const media = b.mediaUrls.find(
      (u): u is string => typeof u === "string" && u.trim().length > 0,
    );
    if (media) return media.trim();
  }

  const categoryImage = b.serviceCategory?.imageUrl?.trim();
  if (categoryImage) return categoryImage;

  return KRAFT_TASK_PLACEHOLDER_IMAGE;
}

export function isKraftTaskPlaceholderImage(src: string): boolean {
  return src === KRAFT_TASK_PLACEHOLDER_IMAGE;
}

export function deriveActiveJobDisplay(b: BookingLike) {
  const service = b.jobTitle ?? b.serviceCategory?.name ?? b.service?.title ?? "Service";
  const preferredDate = b.preferredDate ?? b.scheduledDate ?? b.scheduled_date;
  const preferredTime = b.preferredTime ?? b.scheduledTime ?? b.scheduled_time;
  const flexLabel = formatFlexibleScheduleLabel(
    preferredDate,
    preferredTime,
    b.preferredDateEnd,
    b.additionalPreferredDates,
  );
  const dateRaw =
    preferredDate ?? b.createdAt ?? b.created_at ?? "";
  let date = flexLabel !== "—" ? flexLabel.split(" at ")[0] : "—";
  if (date === "—" && dateRaw) {
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
  const timeRaw = typeof preferredTime === "string" ? preferredTime : "";
  const time =
    typeof timeRaw === "string" && timeRaw.length > 0
      ? timeRaw.length >= 5
        ? timeRaw.slice(0, 5)
        : timeRaw
      : "";

  const artisanName = artisanDisplayName(b);
  const loc = String(b.address ?? b.serviceAddress ?? b.location ?? "—") || "—";
  const needsKrafterSelection = bookingNeedsKrafterSelection(b);
  const krafterDistanceLabel = formatDistanceDisplay(readDistanceFields(b));

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
  const loose = b as BookingLike & {
    proposedPricingType?: string | null;
    proposed_pricing_type?: string | null;
    offerPricingType?: string | null;
    offer_pricing_type?: string | null;
    proposedDurationHours?: number | string | null;
    proposed_duration_hours?: number | string | null;
  };
  const proposedPricingTypeRaw =
    loose.proposedPricingType ??
    loose.proposed_pricing_type ??
    loose.offerPricingType ??
    loose.offer_pricing_type;
  const isHourlyProposal = String(proposedPricingTypeRaw ?? "").toUpperCase() === "HOURLY";
  const proposedDurationHours = parseBookingMoney(
    loose.proposedDurationHours ??
      loose.proposed_duration_hours ??
      b.durationHours ??
      b.duration_hours,
  );
  const finalAgreed = parseBookingMoney(b.finalAgreedPrice ?? b.final_agreed_price);
  const system = parseBookingMoney(b.systemPrice ?? b.system_price);
  const platformFee = parseBookingMoney(b.platformFee ?? b.platform_fee);
  const artisanEarning = parseBookingMoney(b.artisanEarning ?? b.artisan_earning);
  const legacyPrice = parseBookingMoney(b.price);

  const priceRows: { key: string; label: string; amount: number }[] = [];
  const hourlySubtotal =
    isHourlyProposal &&
    finalAgreed === null &&
    proposed !== null &&
    proposedDurationHours !== null &&
    proposedDurationHours > 0
      ? proposed * proposedDurationHours
      : null;

  if (hourlySubtotal !== null) {
    priceRows.push({
      key: "hourlySubtotal",
      label: `Hourly offer (${proposedDurationHours!.toFixed(2)}h × ${proposed!.toFixed(2)})`,
      amount: hourlySubtotal,
    });
  } else if (finalAgreed !== null) {
    priceRows.push({ key: "finalAgreedPrice", label: "Final agreed price", amount: finalAgreed });
  } else if (proposed !== null) {
    priceRows.push({ key: "proposedPrice", label: "Agreed service amount", amount: proposed });
  }
  if (platformFee !== null) {
    priceRows.push({ key: "platformFee", label: "Platform fee", amount: platformFee });
  } else if (system !== null) {
    priceRows.push({ key: "systemPrice", label: "Platform fee", amount: system });
  }
  if (artisanEarning !== null) {
    priceRows.push({ key: "artisanEarning", label: "Krafter payout", amount: artisanEarning });
  }
  if (priceRows.length === 0 && legacyPrice !== null) {
    priceRows.push({ key: "price", label: "Price", amount: legacyPrice });
  }

  const baseForTotal =
    hourlySubtotal !== null
      ? hourlySubtotal
      : finalAgreed !== null
        ? finalAgreed
        : proposed !== null
          ? proposed
          : legacyPrice;
  const feeForTotal = platformFee !== null ? platformFee : system;
  let total: number | null = null;
  if (baseForTotal !== null && feeForTotal !== null) {
    total = baseForTotal + feeForTotal;
  } else if (baseForTotal !== null) {
    total = baseForTotal;
  } else if (feeForTotal !== null) {
    total = feeForTotal;
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
      distanceLabel: needsKrafterSelection ? null : krafterDistanceLabel,
    },
    jobLocation: loc,
    krafterDistanceLabel: needsKrafterSelection ? null : krafterDistanceLabel,
    kraftDetails: kraftDetails || "—",
    priceBreakdown: {
      rows: priceRows,
      total,
    },
    needsKrafterSelection,
    bookingStatus: b.status,
  };
}
