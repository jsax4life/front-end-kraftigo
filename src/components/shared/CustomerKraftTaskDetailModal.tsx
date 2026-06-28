"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, ChevronRight, MapPin, Calendar, MessageCircle } from "lucide-react";
import type { Booking } from "@/types";
import type { CancelBookingPayload } from "@/lib/api/bookings";
import { getBookingById } from "@/lib/api/bookings";
import {
  deriveActiveJobDisplay,
  buildSelectArtisanQuery,
  upcomingStatusLabel,
  bookingNeedsKrafterSelection,
} from "@/lib/bookingDisplay";
import { buildCustomerMessageKrafterUrl, canCustomerMessageKrafter, getKrafterUserIdFromBooking } from "@/lib/chatDeepLinks";
import { useBookingsStore } from "@/store/useBookingsStore";
import CancelModal from "@/components/shared/CancelModal";
import RescheduleModal from "@/components/shared/RescheduleModal";
import {
  canCustomerCancelBookingStatus,
  customerCancelDisabledReason,
} from "@/lib/customerBookingCancel";

function parseJobDescription(raw: string): { description: string; specialFromBody: string } {
  if (!raw?.trim()) return { description: "", specialFromBody: "" };
  const split = raw.split(/\r?\n\r?\nSpecial instructions:\s*/i);
  if (split.length < 2) {
    return { description: raw.trim(), specialFromBody: "" };
  }
  return {
    description: split[0].trim(),
    specialFromBody: split.slice(1).join("\n\n").trim(),
  };
}

function readBookingLoose(b: Booking, key: string, snake: string): unknown {
  const r = b as unknown as Record<string, unknown>;
  return r[key] ?? r[snake];
}

function ratingLabel(value: string | undefined): string {
  if (!value || value === "any") return "Any";
  return value;
}

type Props = {
  booking: Booking;
  open: boolean;
  onClose: () => void;
  onBookingUpdated?: () => void;
};

export default function CustomerKraftTaskDetailModal({
  booking,
  open,
  onClose,
  onBookingUpdated,
}: Props) {
  const router = useRouter();
  const { cancelBooking, updateBooking, reviveFromExpired, isSubmitting } = useBookingsStore();

  const [enriched, setEnriched] = useState<Booking>(booking);
  const [loading, setLoading] = useState(false);
  const [showKraftDetails, setShowKraftDetails] = useState(false);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEnriched(booking);
    setShowKraftDetails(false);
    setShowPriceBreakdown(false);
    setShowCancel(false);
    setShowReschedule(false);
    let cancelled = false;
    setLoading(true);
    void getBookingById(booking.id)
      .then((b) => {
        if (!cancelled) setEnriched(b);
      })
      .catch(() => {
        /* keep list snapshot */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, booking.id, booking]);

  if (!open) return null;

  const b = enriched;
  const displayData = deriveActiveJobDisplay(b);
  const apiStatus = b.status;
  const needsKrafterSelection = Boolean(bookingNeedsKrafterSelection(b));
  const isDeclined = apiStatus === "DECLINED";
  const isPaymentPending = apiStatus === "PAYMENT_PENDING";
  const isCompleted = apiStatus === "COMPLETED";
  const isExpired = apiStatus === "EXPIRED";
  const isTerminal = isCompleted || isExpired || apiStatus === "CANCELLED" || apiStatus === "DISPUTED";

  const badgeTreatAccepted =
    apiStatus === "CONFIRMED" ||
    apiStatus === "ACCEPTED" ||
    apiStatus === "IN_PROGRESS" ||
    apiStatus === "PAYMENT_PENDING";

  const canCustomerCancel = Boolean(apiStatus && canCustomerCancelBookingStatus(apiStatus));
  const cancelDisabledHint =
    apiStatus && !canCustomerCancelBookingStatus(apiStatus)
      ? customerCancelDisabledReason(apiStatus)
      : null;

  const canReschedule =
    badgeTreatAccepted &&
    b.id &&
    !needsKrafterSelection &&
    apiStatus !== "IN_PROGRESS" &&
    !["DECLINED", "COMPLETED", "EXPIRED", "CANCELLED", "DISPUTED", "RECOMMENDATION_PENDING", "PAYMENT_PENDING"].includes(
      String(apiStatus ?? ""),
    );

  const canRescheduleExpired =
    isExpired && Boolean(b.id) && !needsKrafterSelection && Boolean(getKrafterUserIdFromBooking(b));

  const canReviveExpired = isExpired && Boolean(b.id);

  const looseSpecial = readBookingLoose(b, "specialInstructions", "special_instructions");
  const specialExplicit =
    (typeof b.specialInstructions === "string" && b.specialInstructions.trim()
      ? b.specialInstructions.trim()
      : typeof looseSpecial === "string"
        ? looseSpecial.trim()
        : "") || "";
  const { description: descFromBody, specialFromBody } = parseJobDescription(b.jobDescription ?? "");
  const description = descFromBody || (b.jobDescription ?? "").trim() || "—";
  const specialInstructions = specialExplicit.trim() || specialFromBody || "—";

  const openRaw = readBookingLoose(b, "openForNegotiation", "open_for_negotiation");
  const openForNegotiation =
    typeof openRaw === "boolean"
      ? openRaw
      : openRaw === "true"
        ? true
        : openRaw === "false"
          ? false
          : undefined;

  const ratingRaw = readBookingLoose(b, "krafterRatingRequirement", "krafter_rating_requirement");
  const krafterRatingRequirement =
    typeof ratingRaw === "string" && ratingRaw.trim()
      ? ratingRaw.trim()
      : typeof b.krafterRatingRequirement === "string" && b.krafterRatingRequirement.trim()
        ? b.krafterRatingRequirement.trim()
        : undefined;

  const mediaUrls = Array.isArray(b.mediaUrls)
    ? b.mediaUrls.filter((u): u is string => typeof u === "string" && u.trim().length > 0)
    : [];

  const handleCancel = async (payload: CancelBookingPayload) => {
    if (!b.id) return;
    try {
      await cancelBooking(b.id, payload);
      setShowCancel(false);
      onBookingUpdated?.();
      onClose();
    } catch {
      /* store surfaces error */
    }
  };

  const handleReschedule = async (newDate: string, newTime: string) => {
    if (!b.id) return;
    try {
      await updateBooking(b.id, {
        scheduled_date: newDate,
        scheduled_time: newTime,
      });
      setShowReschedule(false);
      const fresh = await getBookingById(b.id).catch(() => null);
      if (fresh) setEnriched(fresh);
      onBookingUpdated?.();
    } catch {
      /* store surfaces error */
    }
  };

  const handleReviveTask = async () => {
    if (!b.id) return;
    try {
      const updated = await reviveFromExpired(b.id);
      onBookingUpdated?.();
      onClose();
      router.push(`/user/book-service/select-artisan?${buildSelectArtisanQuery(updated)}`);
    } catch {
      /* store surfaces error */
    }
  };

  return (
    <div
      className="fixed inset-0 z-55 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={() => {
        if (!showReschedule && !showCancel) onClose();
      }}
      role="presentation"
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-hidden flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-kraft-detail-title"
      >
        <div className="flex items-start justify-between px-4 pt-5 pb-3 shrink-0">
          <h2
            id="customer-kraft-detail-title"
            className="text-[22px] font-gerat font-bold text-gray-900 pr-8 leading-tight"
          >
            {displayData.service}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 shrink-0 rounded-lg hover:bg-gray-50"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {loading && (
            <p className="text-[13px] font-poppins text-gray-500 mb-3">Refreshing details…</p>
          )}

          {/* Status + step indicators */}
          <div className="mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-white text-[12px] font-poppins font-semibold px-3 py-1 rounded-full ${
                  needsKrafterSelection || apiStatus === "DECLINED"
                    ? "bg-brand-orange"
                    : badgeTreatAccepted
                      ? "bg-brand-blue"
                      : "bg-brand-orange"
                }`}
              >
                {upcomingStatusLabel(apiStatus, badgeTreatAccepted)}
              </span>
              {[2, 3, 4].map((step) => (
                <span
                  key={step}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-[12px] font-poppins font-semibold text-gray-500"
                >
                  {step}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2 text-[13px] font-poppins text-gray-500">
              <Calendar size={14} />
              <span>
                {displayData.date}
                {displayData.time ? ` ${displayData.time}` : ""}
              </span>
            </div>
          </div>

          <div className="border border-gray-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm mb-4">
            <div className="flex-1">
              <p className="text-[14px] font-poppins font-bold text-black mb-1">
                {displayData.artisan.name}
              </p>
              {needsKrafterSelection && (
                <p className="text-[12px] font-poppins text-gray-500 mb-2">
                  Choose a Krafter to send your request and continue booking.
                </p>
              )}
              <div className="flex items-center gap-1.5 text-[12px] text-gray-500 font-poppins mb-1">
                <MapPin size={13} className="shrink-0" />
                <span>{displayData.artisan.location}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-gray-500 font-poppins">
                <Calendar size={13} className="shrink-0" />
                <span>
                  {displayData.date}
                  {displayData.time ? ` · ${displayData.time}` : ""}
                  {displayData.timeLabel ? ` (${displayData.timeLabel})` : ""}
                </span>
              </div>
            </div>
            <Image
              src={displayData.artisan.image}
              alt="artisan"
              width={72}
              height={72}
              className="rounded-xl object-cover w-[72px] h-[72px] shrink-0"
            />
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-[14px] font-poppins font-semibold text-black">Job Location</p>
              <p className="text-[12px] font-poppins text-gray-500 text-right truncate max-w-[55%]">
                {displayData.jobLocation}
              </p>
            </div>
            <div className="relative rounded-2xl overflow-hidden h-44 bg-gray-100">
              <Image src="/images/map.png" alt="map" fill className="object-cover" sizes="(max-width: 640px) 100vw, 400px" />
              <div className="absolute bottom-3 left-3">
                <span className="bg-brand-orange text-white text-[12px] font-poppins font-semibold px-3 py-1.5 rounded-full shadow">
                  Service Area
                </span>
              </div>
            </div>
            <p className="text-[13px] font-poppins text-gray-500 mt-1.5">{displayData.jobLocation}</p>
          </div>

          <div className="mb-2">
            <button
              type="button"
              onClick={() => setShowKraftDetails(!showKraftDetails)}
              className="w-full flex items-center justify-between py-4 border-b border-gray-100"
            >
              <span className="text-[15px] font-poppins font-semibold text-black">Kraft Details</span>
              <ChevronRight
                size={18}
                className={`text-gray-400 transition-transform shrink-0 ${showKraftDetails ? "rotate-90" : ""}`}
              />
            </button>
            {showKraftDetails && (
              <div className="space-y-4 py-3">
                <div>
                  <p className="text-[11px] font-poppins font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Description
                  </p>
                  <p className="text-[13px] font-poppins text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {description}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-poppins font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Special instructions
                  </p>
                  <p className="text-[13px] font-poppins text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {specialInstructions}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] font-poppins font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Open to negotiation
                    </p>
                    <p className="text-[13px] font-poppins text-gray-900">
                      {openForNegotiation === undefined
                        ? "—"
                        : openForNegotiation
                          ? "Yes"
                          : "No"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-poppins font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Krafter rating requirement
                    </p>
                    <p className="text-[13px] font-poppins text-gray-900">
                      {ratingLabel(krafterRatingRequirement)}
                    </p>
                  </div>
                </div>
                {mediaUrls.length > 0 && (
                  <div>
                    <p className="text-[11px] font-poppins font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Photos
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scroll-smooth [scrollbar-width:thin]">
                      {mediaUrls.map((url) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative shrink-0 w-28 h-28 rounded-xl overflow-hidden border border-gray-100 bg-gray-50"
                        >
                          <Image src={url} alt="" fill className="object-cover" sizes="112px" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowPriceBreakdown(!showPriceBreakdown)}
              className="w-full flex items-center justify-between py-4 border-b border-gray-100"
            >
              <span className="text-[15px] font-poppins font-semibold text-black">Price Breakdown</span>
              <ChevronRight
                size={18}
                className={`text-gray-400 transition-transform shrink-0 ${showPriceBreakdown ? "rotate-90" : ""}`}
              />
            </button>
            {showPriceBreakdown && (
              <div className="py-3 space-y-2">
                {displayData.priceBreakdown.rows.length === 0 ? (
                  <p className="text-[13px] font-poppins text-gray-500">No pricing details yet.</p>
                ) : (
                  displayData.priceBreakdown.rows.map((row) => (
                    <div
                      key={row.key}
                      className="flex justify-between text-[13px] font-poppins text-gray-600"
                    >
                      <span>{row.label}</span>
                      <span>€{row.amount.toFixed(2)}</span>
                    </div>
                  ))
                )}
                {displayData.priceBreakdown.total != null && (
                  <div className="flex justify-between text-[14px] font-poppins font-bold text-black border-t border-gray-100 pt-2 mt-2">
                    <span>Total</span>
                    <span>€{displayData.priceBreakdown.total.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3 pb-2">
            {isPaymentPending && b.id && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push(`/user/book-service/active-job?status=accepted&id=${b.id}`);
                }}
                className="w-full py-4 bg-brand-orange text-white rounded-2xl text-[15px] font-poppins font-semibold hover:bg-orange-600 transition-colors"
              >
                Confirm payment
              </button>
            )}
            {needsKrafterSelection && b.id ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push(`/user/book-service/select-artisan?${buildSelectArtisanQuery(b)}`);
                }}
                className="w-full py-4 bg-brand-orange text-white rounded-2xl text-[15px] font-poppins font-semibold hover:bg-orange-600 transition-colors"
              >
                Choose a Krafter
              </button>
            ) : canReschedule || canRescheduleExpired ? (
              <button
                type="button"
                onClick={() => setShowReschedule(true)}
                disabled={isSubmitting}
                className="w-full py-4 bg-brand-orange text-white rounded-2xl text-[15px] font-poppins font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60"
              >
                Reschedule
              </button>
            ) : null}

            {!isTerminal && canCustomerMessageKrafter(b) ? (
              <button
                type="button"
                onClick={() => {
                  const url = buildCustomerMessageKrafterUrl(b);
                  onClose();
                  if (url) router.push(url);
                }}
                className="w-full py-4 rounded-2xl border-2 border-brand-orange text-brand-orange bg-white text-[15px] font-poppins font-semibold hover:bg-[#FFF5F0] transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle size={20} strokeWidth={2} aria-hidden />
                Message Krafter
              </button>
            ) : null}

            {isExpired && (
              <p className="w-full py-2 text-center text-[12px] font-poppins text-amber-900 bg-amber-50 border border-amber-100 rounded-xl px-3">
                This booking expired because the scheduled time passed. Reschedule with your Krafter or revive the task to pick a new date.
              </p>
            )}

            {canReviveExpired ? (
              <button
                type="button"
                onClick={handleReviveTask}
                disabled={isSubmitting}
                className="w-full py-4 bg-brand-blue text-white rounded-2xl text-[15px] font-poppins font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                Revive task
              </button>
            ) : isDeclined && b.id ? (
              <button
                type="button"
                onClick={handleReviveTask}
                disabled={isSubmitting}
                className="w-full py-4 bg-brand-blue text-white rounded-2xl text-[15px] font-poppins font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                Reopen Task
              </button>
            ) : !isExpired ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push("/user/support");
                }}
                className="w-full py-4 bg-brand-blue text-white rounded-2xl text-[15px] font-poppins font-semibold hover:bg-blue-700 transition-colors"
              >
                Report issue
              </button>
            ) : null}

            {canCustomerCancel ? (
              <button
                type="button"
                onClick={() => setShowCancel(true)}
                className="w-full py-2 text-brand-orange text-[14px] font-poppins font-semibold"
              >
                Cancel Kraft
              </button>
            ) : cancelDisabledHint ? (
              <p className="w-full py-2 text-center text-[12px] font-poppins text-gray-500 px-1">{cancelDisabledHint}</p>
            ) : null}
          </div>
        </div>
      </div>

      {showCancel && (
        <CancelModal booking={displayData} onClose={() => setShowCancel(false)} onConfirm={handleCancel} />
      )}

      {showReschedule && (
        <RescheduleModal booking={displayData} onClose={() => setShowReschedule(false)} onConfirm={handleReschedule} />
      )}
    </div>
  );
}
