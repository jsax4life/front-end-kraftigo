"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, ChevronRight, MapPin, Calendar, X } from "lucide-react";
import CancelModal from "@/components/shared/CancelModal";
import RescheduleModal from "@/components/shared/RescheduleModal";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ErrorBanner from "@/components/shared/ErrorBanner";
import { useBookingsStore } from "@/store/useBookingsStore";
import { deriveActiveJobDisplay, buildSelectArtisanQuery, upcomingStatusLabel } from "@/lib/bookingDisplay";
import type { CancelBookingPayload } from "@/lib/api/bookings";
import {
  canCustomerCancelBookingStatus,
  customerCancelDisabledReason,
} from "@/lib/customerBookingCancel";
import BookingPaymentConfirmModal from "@/components/shared/BookingPaymentConfirmModal";
import { bookingPaymentClientSecret } from "@/lib/bookingPaymentCheckout";

// ─── Fallback mock for when no real booking ID is provided ───────────────────
const MOCK_BOOKING = {
  service: "House Cleaning",
  date: "15th Jan, 2025",
  time: "4:30 PM",
  timeLabel: "In 15 Minutes",
  artisan: {
    name: "House Cleaning with Sarah M.",
    location: "Hauptstraße 123 - 10115, Berlin",
    image: "/images/pro.jpg",
  },
  jobLocation: "123 Maple Street",
  kraftDetails:
    "I need someone with six years of experience cleaning houses, whose priority is to bring a good service and leave everything very clean✨.",
  priceBreakdown: { rows: [], total: null as number | null },
  needsKrafterSelection: false as const,
};

const ActiveJobContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const bookingId = searchParams.get("id");
  const statusParam = searchParams.get("status") || "accepted";
  const isAccepted = statusParam === "accepted";

  const {
    fetchBookingById,
    cancelBooking,
    updateBooking,
    reopenRecommendation,
    isLoading,
    isSubmitting,
    error,
    clearError,
    selectedBooking,
  } = useBookingsStore();

  const [showCancel, setShowCancel] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
  const [showKraftDetails, setShowKraftDetails] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);

  // Fetch real booking if ID is provided
  useEffect(() => {
    if (bookingId) {
      fetchBookingById(bookingId);
    }
  }, [bookingId, fetchBookingById]);

  // Derive display data from real booking (camelCase API or legacy) or fall back to mock
  const displayData =
    bookingId && selectedBooking ? deriveActiveJobDisplay(selectedBooking) : MOCK_BOOKING;

  const needsKrafterSelection = Boolean(displayData.needsKrafterSelection);
  const apiStatus = bookingId && selectedBooking ? selectedBooking.status : undefined;
  const isDeclined = apiStatus === "DECLINED";
  const isPaymentPending = apiStatus === "PAYMENT_PENDING";
  const canCustomerCancel =
    Boolean(bookingId && apiStatus && canCustomerCancelBookingStatus(apiStatus));
  const cancelDisabledHint =
    bookingId && apiStatus && !canCustomerCancelBookingStatus(apiStatus)
      ? customerCancelDisabledReason(apiStatus)
      : null;

  const canReschedule =
    isAccepted &&
    bookingId &&
    selectedBooking &&
    !needsKrafterSelection &&
    !["DECLINED", "COMPLETED", "CANCELLED", "DISPUTED", "RECOMMENDATION_PENDING", "PAYMENT_PENDING"].includes(
      String(apiStatus ?? ""),
    );

  const handleCancel = async (payload: CancelBookingPayload) => {
    if (!bookingId) return;
    try {
      await cancelBooking(bookingId, payload);
      setShowCancel(false);
      router.push("/user/krafts");
    } catch {
      // Error surfaced via store `error` / ErrorBanner
    }
  };

  const handleReschedule = async (newDate: string, newTime: string) => {
    if (bookingId) {
      await updateBooking(bookingId, {
        scheduled_date: newDate,
        scheduled_time: newTime,
      });
    }
    setShowReschedule(false);
  };

  const handleReopenTask = async () => {
    if (!bookingId) return;
    try {
      const updated = await reopenRecommendation(bookingId);
      router.push(`/user/book-service/select-artisan?${buildSelectArtisanQuery(updated)}`);
    } catch {
      // Error surfaced via store `error` / ErrorBanner
    }
  };

  if (isLoading && bookingId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white pb-10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-[22px] font-gerat font-bold">{displayData.service}</h1>
        </div>
        <button onClick={() => router.push("/user/home")} className="p-1">
          <X size={20} className="text-gray-400" />
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="px-4 mb-3">
          <ErrorBanner message={error} onDismiss={clearError} />
        </div>
      )}

      {isPaymentPending && bookingId && (
        <div className="mx-4 mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-[13px] font-poppins font-semibold text-amber-900 mb-1">
            Your Krafter accepted — payment authorization required
          </p>
          <p className="text-[12px] font-poppins text-amber-800/90">
            Confirm below to place a card hold and move this booking toward confirmed status (final confirmation follows Stripe processing).
          </p>
        </div>
      )}

      {/* Status Badge + Steps */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2">
          <span
            className={`text-white text-[12px] font-poppins font-semibold px-3 py-1 rounded-full ${
              needsKrafterSelection || apiStatus === "DECLINED"
                ? "bg-brand-orange"
                : isAccepted
                  ? "bg-brand-blue"
                  : "bg-brand-orange"
            }`}
          >
            {upcomingStatusLabel(apiStatus, isAccepted)}
          </span>
        </div>
      </div>

      {/* Date/Time */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2 text-[13px] font-poppins text-gray-500">
          <Calendar size={14} />
          <span>
            {displayData.date} {displayData.time}
          </span>
        </div>
      </div>

      {/* Artisan / Krafter card */}
      <div className="mx-4 border border-gray-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm mb-4">
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
              {displayData.timeLabel && ` (${displayData.timeLabel})`}
            </span>
          </div>
        </div>
        <Image
          src={displayData.artisan.image}
          alt="artisan"
          width={72}
          height={72}
          className="rounded-xl object-cover w-18 h-18 shrink-0"
        />
      </div>

      {/* Map */}
      <div className="mx-4 mb-4">
        <p className="text-[14px] font-poppins font-semibold text-black mb-2">Job Location</p>
        <div className="relative rounded-2xl overflow-hidden h-44 bg-gray-100">
          <Image src="/images/map.png" alt="map" fill className="object-cover" />
          <div className="absolute bottom-3 left-3">
            <span className="bg-brand-orange text-white text-[12px] font-poppins font-semibold px-3 py-1.5 rounded-full shadow">
              Service Area
            </span>
          </div>
        </div>
        <p className="text-[13px] font-poppins text-gray-500 mt-1.5">{displayData.jobLocation}</p>
      </div>

      {/* Kraft Details Accordion */}
      <div className="mx-4 mb-2">
        <button
          onClick={() => setShowKraftDetails(!showKraftDetails)}
          className="w-full flex items-center justify-between py-4 border-b border-gray-100"
        >
          <span className="text-[15px] font-poppins font-semibold text-black">Kraft Details</span>
          <ChevronRight
            size={18}
            className={`text-gray-400 transition-transform ${showKraftDetails ? "rotate-90" : ""}`}
          />
        </button>
        {showKraftDetails && (
          <p className="text-[13px] font-poppins text-gray-600 py-3 leading-relaxed">
            {displayData.kraftDetails}
          </p>
        )}
      </div>

      {/* Price Breakdown Accordion */}
      <div className="mx-4 mb-6">
        <button
          onClick={() => setShowPriceBreakdown(!showPriceBreakdown)}
          className="w-full flex items-center justify-between py-4 border-b border-gray-100"
        >
          <span className="text-[15px] font-poppins font-semibold text-black">Price Breakdown</span>
          <ChevronRight
            size={18}
            className={`text-gray-400 transition-transform ${showPriceBreakdown ? "rotate-90" : ""}`}
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
                  <span>${row.amount.toFixed(2)}</span>
                </div>
              ))
            )}
            {displayData.priceBreakdown.total != null && (
              <div className="flex justify-between text-[14px] font-poppins font-bold text-black border-t border-gray-100 pt-2 mt-2">
                <span>Total</span>
                <span>${displayData.priceBreakdown.total.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-4 space-y-3">
        {isPaymentPending && bookingId && selectedBooking && (
          <button
            type="button"
            onClick={() => setShowPaymentConfirm(true)}
            className="w-full py-4 bg-brand-orange text-white rounded-2xl text-[15px] font-poppins font-semibold hover:bg-orange-600 transition-colors"
          >
            Confirm payment
          </button>
        )}
        {needsKrafterSelection && bookingId && selectedBooking ? (
          <button
            type="button"
            onClick={() =>
              router.push(`/user/book-service/select-artisan?${buildSelectArtisanQuery(selectedBooking)}`)
            }
            className="w-full py-4 bg-brand-orange text-white rounded-2xl text-[15px] font-poppins font-semibold hover:bg-orange-600 transition-colors"
          >
            Choose a Krafter
          </button>
        ) : canReschedule ? (
          <button
            onClick={() => setShowReschedule(true)}
            disabled={isSubmitting}
            className="w-full py-4 bg-brand-orange text-white rounded-2xl text-[15px] font-poppins font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60"
          >
            Reschedule
          </button>
        ) : !isAccepted ? (
          <button
            onClick={() => router.replace("/user/book-service/active-job?status=accepted" + (bookingId ? `&id=${bookingId}` : ""))}
            className="w-full py-4 bg-brand-orange text-white rounded-2xl text-[15px] font-poppins font-semibold hover:bg-orange-600 transition-colors"
          >
            Accept &amp; Schedule
          </button>
        ) : null}

        {isDeclined && bookingId ? (
          <button
            type="button"
            onClick={handleReopenTask}
            disabled={isSubmitting}
            className="w-full py-4 bg-brand-blue text-white rounded-2xl text-[15px] font-poppins font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            Reopen Task
          </button>
        ) : (
          <button
            type="button"
            onClick={() => router.push("/user/chat")}
            className="w-full py-4 bg-brand-blue text-white rounded-2xl text-[15px] font-poppins font-semibold hover:bg-blue-700 transition-colors"
          >
            Report Issue
          </button>
        )}

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

      {/* Cancel Modal */}
      {showCancel && (
        <CancelModal
          booking={displayData}
          onClose={() => setShowCancel(false)}
          onConfirm={handleCancel}
        />
      )}

      {/* Reschedule Modal */}
      {showReschedule && (
        <RescheduleModal
          booking={displayData}
          onClose={() => setShowReschedule(false)}
          onConfirm={handleReschedule}
        />
      )}

      {showPaymentConfirm && bookingId && selectedBooking && (
        <BookingPaymentConfirmModal
          open={showPaymentConfirm}
          bookingId={bookingId}
          initialClientSecret={bookingPaymentClientSecret(selectedBooking)}
          returnUrl={
            typeof window !== "undefined"
              ? `${window.location.origin}/user/book-service/active-job?status=accepted&id=${bookingId}`
              : undefined
          }
          onClose={() => setShowPaymentConfirm(false)}
          onComplete={() => {
            void fetchBookingById(bookingId);
          }}
        />
      )}
    </main>
  );
};

const ActiveJobPage = () => (
  <Suspense>
    <ActiveJobContent />
  </Suspense>
);

export default ActiveJobPage;
