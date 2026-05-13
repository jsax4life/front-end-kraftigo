"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Calendar, X, MessageCircle } from "lucide-react";
import Button from "@/components/ui/button";
import MarketplaceNegotiationModal from "@/components/shared/MarketplaceNegotiationModal";
import { applyToBooking } from "@/lib/api/bookings";
import type { Booking } from "@/types";
import TaskerNav from "@/components/shared/taskerNav";
import toast from "react-hot-toast";
import { buildTaskerMessageCustomerUrlFromBooking } from "@/lib/chatDeepLinks";

function formatDisplayDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = d.getDate();
  const ord =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
          ? "rd"
          : "th";
  return `${day}${ord} ${d.toLocaleString("en-GB", { month: "short" })}, ${d.getFullYear()}`;
}

/** API often sends `preferredTime` as `HH:mm:ss` (24h). */
function formatPreferredTime(raw: string | undefined | null): string {
  if (!raw?.trim()) return "TBD";
  const t = raw.trim();
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?/.exec(t);
  if (!match) return t;
  let h = parseInt(match[1], 10);
  const m = match[2];
  if (!Number.isFinite(h) || h < 0 || h > 23) return t;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

function parseBookingPrice(booking: Booking): number {
  const ext = booking as Booking & { proposed_price?: string | number | null };
  const raw =
    booking.proposedPrice ?? ext.proposed_price ?? booking.price ?? booking.finalAgreedPrice;
  if (raw == null || raw === "") return 0;
  const n = typeof raw === "string" ? parseFloat(raw) : Number(raw);
  return Number.isFinite(n) ? n : 0;
}

/** Listing flag from camelCase or snake_case API payloads. */
function readOpenForNegotiation(booking: Booking): boolean | undefined {
  const r = booking as unknown as Record<string, unknown>;
  const v = r.openForNegotiation ?? r.open_for_negotiation;
  if (typeof v === "boolean") return v;
  if (v === "true") return true;
  if (v === "false") return false;
  return undefined;
}

function readListingPricingBasis(
  booking: Booking,
): { pricingType: "FLAT" | "HOURLY"; durationHours?: number } {
  const r = booking as unknown as Record<string, unknown>;
  const rawType = r.offerPricingType ?? r.offer_pricing_type ?? r.proposedPricingType ?? r.proposed_pricing_type;
  const pricingType = String(rawType ?? "FLAT").toUpperCase() === "HOURLY" ? "HOURLY" : "FLAT";
  const rawHours =
    r.offerDurationHours ??
    r.offer_duration_hours ??
    r.proposedDurationHours ??
    r.proposed_duration_hours ??
    r.durationHours ??
    r.duration_hours;
  const parsed = Number(rawHours);
  const durationHours = Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  return { pricingType, durationHours };
}

function fmtHours(hours: number): string {
  return hours % 1 === 0 ? String(hours) : hours.toFixed(2);
}

/** Map marketplace list rows and normalized GET `/api/bookings/:id` payloads. */
function deriveMarketplaceKraftFields(booking: Booking) {
  const title =
    booking.jobTitle?.trim() ||
    booking.title?.trim() ||
    booking.service?.title ||
    booking.serviceCategory?.name ||
    "Kraft";

  const hourly = parseBookingPrice(booking);

  const dateIso = booking.preferredDate?.trim() || booking.scheduled_date || "";
  const timeRaw = booking.preferredTime ?? booking.scheduled_time ?? "";

  const locationLine =
    [booking.address, booking.location].find((s) => typeof s === "string" && s.trim())?.trim() || "—";

  /** Photos: only task media from API (`mediaUrls`), not listing cover images. */
  const media =
    Array.isArray(booking.mediaUrls) && booking.mediaUrls.length > 0
      ? booking.mediaUrls.filter((u): u is string => typeof u === "string" && u.length > 0)
      : [];

  return { title, hourly, dateIso, timeRaw, locationLine, media };
}

function splitNotes(notes: string | undefined): { main: string; special: string | null } {
  if (!notes?.trim()) return { main: "", special: null };
  const marker = /special instructions:\s*/i;
  const parts = notes.split(marker);
  if (parts.length >= 2) {
    return { main: parts[0].trim(), special: parts.slice(1).join(" ").trim() || null };
  }
  return { main: notes.trim(), special: null };
}

/** Human-readable label for `GET .../marketplace-applications` row `status`. */
function formatArtisanApplicationStatus(raw: string | undefined | null): string {
  if (!raw?.trim()) return "";
  const s = raw.trim().toUpperCase().replace(/\s+/g, "_");
  const map: Record<string, string> = {
    PENDING: "Pending review",
    SUBMITTED: "Submitted",
    UNDER_REVIEW: "Under review",
    ACCEPTED: "Accepted",
    SELECTED: "Selected",
    REJECTED: "Not selected",
    DECLINED: "Declined",
    WITHDRAWN: "Withdrawn",
    SHORTLISTED: "Shortlisted",
    APPROVED: "Approved",
    INVITED: "Invited",
  };
  return map[s] ?? raw.trim().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function bookingCustomerPresentation(booking: Booking) {
  const c = booking.customer;
  const first = c?.firstName?.trim() || "";
  const last = c?.lastName?.trim() || "";
  const fromCustomer = [first, last].filter(Boolean).join(" ").trim();
  const displayName = fromCustomer || booking.customerName?.trim() || "Customer";
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

export interface MarketplaceKraftDetailPanelProps {
  booking: Booking;
  bookingId: string;
  onDismiss: () => void;
  /** After a successful marketplace apply (optional refresh e.g. `hasApplied`). */
  onApplied?: () => void;
  showTaskerNav?: boolean;
  /**
   * When true (e.g. opened from “My applications”), hide negotiate/apply even if
   * `GET /bookings/:id` omits `hasApplied`.
   */
  readOnlyApplication?: boolean;
  /** Artisan’s application status on the booking (from marketplace-applications list). */
  artisanApplicationStatus?: string | null;
}

/**
 * Shared Kraft details UI for marketplace (full page + in-list modal).
 */
export default function MarketplaceKraftDetailPanel({
  booking,
  bookingId,
  onDismiss,
  onApplied,
  showTaskerNav = false,
  readOnlyApplication = false,
  artisanApplicationStatus = null,
}: MarketplaceKraftDetailPanelProps) {
  const router = useRouter();
  const [offerOpen, setOfferOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [applying, setApplying] = useState(false);

  const derived = useMemo(() => deriveMarketplaceKraftFields(booking), [booking]);
  /** API marketplace detail uses `jobTitle` — show it first in the chrome. */
  const headerTitle = booking.jobTitle?.trim() || derived.title;

  const priceLabel = useMemo(() => {
    if (!derived.hourly || !Number.isFinite(Number(derived.hourly))) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 2,
    }).format(Number(derived.hourly));
  }, [derived.hourly]);

  const dateLine = derived.dateIso ? formatDisplayDate(derived.dateIso) : "—";
  const timeLine = formatPreferredTime(derived.timeRaw);
  const customerCard = useMemo(() => bookingCustomerPresentation(booking), [booking]);
  const jobDescriptionRaw = booking.jobDescription?.trim() ?? "";
  const { main: kraftBody, special: specialInstructions } = splitNotes(
    jobDescriptionRaw || undefined,
  );
  const photos = derived.media;
  const categoryLabel = booking.serviceCategory?.name?.trim();

  const openForNegotiation = useMemo(() => readOpenForNegotiation(booking), [booking]);
  const listingPricing = useMemo(() => readListingPricingBasis(booking), [booking]);
  const negotiationDisabledByListing = openForNegotiation === false;

  const formattedApplicationStatus = formatArtisanApplicationStatus(
    artisanApplicationStatus ?? booking.marketplaceApplicationStatus,
  );
  /** My applications (read-only): always show a status line; default if API omits status. */
  const applicationStatusPillLabel = readOnlyApplication
    ? formattedApplicationStatus || "Submitted"
    : formattedApplicationStatus;
  const showApplicationStatusBlock = Boolean(readOnlyApplication && applicationStatusPillLabel);
  const suppressMarketplaceActions = readOnlyApplication || Boolean(booking.hasApplied);
  const customerChatUrl = buildTaskerMessageCustomerUrlFromBooking(booking);

  const handleOfferSubmit = async (values: {
    amount: string;
    openToNegotiation: boolean;
    message: string;
  }) => {
    const price = parseFloat(values.amount);
    if (!price || price <= 0) {
      toast.error("Please enter a valid offer amount.");
      return;
    }
    setSubmitting(true);
    try {
      await applyToBooking(bookingId, {
        proposedPrice: price,
        proposedPricingType: listingPricing.pricingType,
        ...(listingPricing.pricingType === "HOURLY" && listingPricing.durationHours
          ? { proposedDurationHours: listingPricing.durationHours }
          : {}),
        message: values.message.trim() || undefined,
        openForNegotiation: values.openToNegotiation,
      });
      toast.success("Offer sent! The customer will be notified.");
      setOfferOpen(false);
      onApplied?.();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(ax.response?.data?.message ?? "Could not submit your offer. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickApply = async () => {
    const at = parseBookingPrice(booking);
    if (!at || at <= 0) {
      toast.error("No listing price to apply with. Use Negotiate offer.");
      return;
    }
    setApplying(true);
    try {
      await applyToBooking(bookingId, {
        proposedPrice: at,
        proposedPricingType: listingPricing.pricingType,
        ...(listingPricing.pricingType === "HOURLY" && listingPricing.durationHours
          ? { proposedDurationHours: listingPricing.durationHours }
          : {}),
      });
      toast.success("Application sent! The customer will be notified.");
      onApplied?.();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(ax.response?.data?.message ?? "Could not apply. Try again.");
    } finally {
      setApplying(false);
    }
  };

  const scrollClass = showTaskerNav
    ? "px-4 pt-4 max-w-lg mx-auto flex flex-col gap-5"
    : "flex flex-1 min-h-0 flex-col gap-5 overflow-y-auto overscroll-contain px-4 pt-4 max-w-lg mx-auto w-full";

  return (
    <div
      className={
        showTaskerNav
          ? "min-h-screen bg-white pb-28"
          : "flex flex-col h-full max-h-[100dvh] bg-white overflow-hidden"
      }
    >
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 pt-4 pb-3 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {showApplicationStatusBlock ? (
              <>
                <p className="text-[11px] font-poppins font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                  Your application
                </p>
                <span className="inline-flex items-center rounded-full bg-sky-50 text-sky-800 border border-sky-100 px-2.5 py-1 text-[12px] font-poppins font-semibold mb-2">
                  {applicationStatusPillLabel}
                </span>
              </>
            ) : null}
            <h1
              id="marketplace-kraft-detail-title"
              className={`text-[20px] font-gerat font-bold text-gray-900 pr-2 ${showApplicationStatusBlock ? "mt-1" : ""}`}
            >
              {headerTitle}
            </h1>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="p-2 shrink-0 text-gray-500 hover:bg-gray-50 rounded-full"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      <div className={scrollClass}>
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-[28px] font-bold text-brand-orange font-poppins">{priceLabel}/hr</p>
            {categoryLabel ? (
              <p className="text-[13px] text-gray-500 font-poppins mt-1">{categoryLabel}</p>
            ) : null}
          </div>

          <div className="bg-[#F6F6F6] border border-[#0000001A] rounded-xl p-4 flex items-center gap-3 min-w-0">
            <div className="relative w-14 h-14 rounded-full overflow-hidden bg-brand-blue/15 shrink-0 flex items-center justify-center ring-1 ring-black/5">
              {customerCard.photoUrl ? (
                <Image
                  src={customerCard.photoUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="56px"
                  unoptimized
                />
              ) : (
                <span className="text-base font-bold text-brand-blue font-poppins">{customerCard.initials}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[16px] font-bold text-gray-900 font-poppins truncate">{customerCard.displayName}</p>
              <p className="text-[12px] text-gray-500 font-poppins mt-0.5 truncate" title={customerCard.secondaryLine}>
                {customerCard.secondaryLine}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col divide-y divide-gray-200 border-t border-gray-200">
          <section className="py-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h2 className="text-[15px] font-bold text-gray-900 font-poppins">Job location</h2>
              <p className="text-[13px] text-gray-500 text-right max-w-[55%] leading-tight font-poppins">
                {derived.locationLine}
              </p>
            </div>
            <div className="relative rounded-2xl overflow-hidden h-44 bg-gray-100">
              <Image src="/images/map.png" alt="Map" fill className="object-cover" />
              <span className="absolute bottom-3 left-3 bg-brand-orange text-white text-[12px] font-semibold px-3 py-1.5 rounded-full shadow font-poppins">
                Service area
              </span>
            </div>
          </section>

          <section className="py-5">
            <h2 className="text-[15px] font-bold text-gray-900 font-poppins mb-2">Booking hours</h2>
            <div className="flex items-start gap-3 rounded-xl border border-[#0000001A] bg-[#F6F6F6] px-3 py-3">
              <Calendar size={18} className="mt-0.5 shrink-0 text-gray-400" aria-hidden />
              <div className="min-w-0 text-[14px] text-gray-700 font-poppins leading-relaxed">
                {dateLine !== "—" || timeLine !== "TBD" ? (
                  <>
                    {dateLine !== "—" ? (
                      <p>
                        <span className="font-semibold text-gray-900">Date: </span>
                        {dateLine}
                      </p>
                    ) : null}
                    {timeLine !== "TBD" ? (
                      <p className={dateLine !== "—" ? "mt-1" : ""}>
                        <span className="font-semibold text-gray-900">Time: </span>
                        <span className="font-bold text-gray-900">{timeLine}</span>
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="text-gray-500">No preferred date or time yet.</p>
                )}
                <p className="mt-1">
                  <span className="font-semibold text-gray-900">Pricing basis: </span>
                  {listingPricing.pricingType}
                </p>
                {listingPricing.pricingType === "HOURLY" && listingPricing.durationHours ? (
                  <p className="mt-1">
                    <span className="font-semibold text-gray-900">Proposed duration: </span>
                    {fmtHours(listingPricing.durationHours)}h
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="py-5">
            <h2 className="text-[15px] font-bold text-gray-900 font-poppins mb-2">Kraft details</h2>
            <div className="text-[14px] text-gray-700 font-poppins leading-relaxed bg-[#F6F6F6] border border-[#0000001A] rounded-xl px-3 py-3 whitespace-pre-wrap">
              {kraftBody.trim() || "No details provided."}
            </div>
          </section>

          {photos.length > 0 && (
            <section className="py-5">
              <h2 className="text-[15px] font-bold text-gray-900 font-poppins mb-3">Photos</h2>
              <div className="grid grid-cols-3 gap-2">
                {photos.slice(0, 6).map((url) => (
                  <div key={url} className="relative aspect-square rounded-lg overflow-hidden bg-gray-200">
                    <Image src={url} alt="" fill className="object-cover" sizes="120px" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {specialInstructions ? (
            <section className="py-5">
              <h2 className="text-[15px] font-bold text-gray-900 font-poppins mb-2">Special instructions</h2>
              <div className="text-[14px] text-gray-700 font-poppins bg-[#F6F6F6] border border-[#0000001A] rounded-xl px-3 py-3 whitespace-pre-wrap">
                {specialInstructions}
              </div>
            </section>
          ) : null}
        </div>

        <div className="space-y-3 border-t border-gray-200 pt-5 pb-4">
          {customerChatUrl ? (
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => {
                onDismiss();
                router.push(customerChatUrl);
              }}
              className="flex items-center justify-center gap-2"
            >
              <MessageCircle size={18} strokeWidth={2} aria-hidden />
              Message customer
            </Button>
          ) : null}
          {suppressMarketplaceActions ? (
            <p className="text-center text-sm font-poppins text-gray-500 py-2 px-1">
              {readOnlyApplication
                ? "You already applied to this Kraft. You cannot send another offer or apply again from here."
                : "You already applied to this listing."}
            </p>
          ) : (
            <>
              <Button
                type="button"
                variant="primary"
                fullWidth
                onClick={() => setOfferOpen(true)}
                disabled={submitting || applying || negotiationDisabledByListing}
                className={
                  submitting || applying || negotiationDisabledByListing ? "" : "!bg-brand-orange"
                }
              >
                Negotiate offer
              </Button>
              {negotiationDisabledByListing ? (
                <p className="text-[11px] text-center font-poppins text-gray-500 -mt-1 px-1">
                  This Kraft is listed at a fixed rate — the customer has turned off negotiation.
                </p>
              ) : null}
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => void handleQuickApply()}
                disabled={submitting || applying}
              >
                {applying ? "Applying…" : "Apply"}
              </Button>
            </>
          )}
        </div>
      </div>

      <MarketplaceNegotiationModal
        open={offerOpen}
        mode="offer"
        onClose={() => setOfferOpen(false)}
        onSubmit={handleOfferSubmit}
        isSubmitting={submitting}
        minAmount={derived.hourly > 0 ? Number(derived.hourly) : undefined}
        pricingType={listingPricing.pricingType}
        durationHours={listingPricing.durationHours}
      />

      {showTaskerNav && <TaskerNav />}
    </div>
  );
}
