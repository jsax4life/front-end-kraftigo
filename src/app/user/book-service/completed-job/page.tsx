"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { X, ChevronRight } from "lucide-react";
import RatingModal from "@/components/shared/RatingModal";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ErrorBanner from "@/components/shared/ErrorBanner";
import { useBookingsStore } from "@/store/useBookingsStore";
import { getMyReviews, submitReview } from "@/lib/api/reviews";
import { findMyReviewForBooking, type MyReview } from "@/lib/reviewDisplay";
import SubmittedReviewSummary from "@/components/shared/SubmittedReviewSummary";
import { createDispute } from "@/lib/api/disputes";
import { bookingArtisanName, deriveActiveJobDisplay } from "@/lib/bookingDisplay";
import { useTranslations } from "next-intl";

function bookingTimeField(booking: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const v = booking[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function completedDuration(booking: unknown): { h: number; m: number; s: number } {
  const fallback = { h: 0, m: 0, s: 0 };
  if (!booking || typeof booking !== "object") return fallback;
  const b = booking as Record<string, unknown>;
  const workDurationRaw = b.workDurationSeconds ?? b.work_duration_seconds;
  if (typeof workDurationRaw === "number" && Number.isFinite(workDurationRaw) && workDurationRaw >= 0) {
    const secs = Math.floor(workDurationRaw);
    return {
      h: Math.floor(secs / 3600),
      m: Math.floor((secs % 3600) / 60),
      s: secs % 60,
    };
  }
  if (typeof workDurationRaw === "string" && workDurationRaw.trim()) {
    const parsedSecs = Number(workDurationRaw);
    if (Number.isFinite(parsedSecs) && parsedSecs >= 0) {
      const secs = Math.floor(parsedSecs);
      return {
        h: Math.floor(secs / 3600),
        m: Math.floor((secs % 3600) / 60),
        s: secs % 60,
      };
    }
  }
  const startedAt = bookingTimeField(
    b,
    "startedAt",
    "started_at",
    "workStartedAt",
    "work_started_at",
    "inProgressAt",
    "in_progress_at",
  );
  const completedAt = bookingTimeField(
    b,
    "completedAt",
    "completed_at",
  );
  if (!startedAt || !completedAt) return fallback;
  const startMs = Date.parse(startedAt);
  const endMs = Date.parse(completedAt);
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) return fallback;
  const secs = Math.floor((endMs - startMs) / 1000);
  return {
    h: Math.floor(secs / 3600),
    m: Math.floor((secs % 3600) / 60),
    s: secs % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

const CompletedJobContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("id");

  const { fetchBookingById, isLoading, error, clearError, selectedBooking } = useBookingsStore();

  const [showRating, setShowRating] = useState(false);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
  const [showKraftDetails, setShowKraftDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState<MyReview | null>(null);
  
  const td = useTranslations("booking.completedJob");

  useEffect(() => {
    if (bookingId) {
      void fetchBookingById(bookingId);
    }
  }, [bookingId, fetchBookingById]);

  useEffect(() => {
    if (!bookingId) return;
    let cancelled = false;
    void (async () => {
      try {
        const reviews = await getMyReviews();
        if (cancelled) return;
        const found = findMyReviewForBooking(reviews, bookingId);
        if (found) setExistingReview(found);
      } catch (err) {
        console.error("Failed to load your review:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  // Derive display data
  const booking = bookingId && selectedBooking ? selectedBooking : null;
  const displayData = booking ? deriveActiveJobDisplay(booking) : null;
  const elapsed = completedDuration(booking);
  const artisanFullNameRaw = booking ? bookingArtisanName(booking) : "Krafter";
  const artisanName = artisanFullNameRaw.split(" ")[0] ?? artisanFullNameRaw;
  const artisanImage = displayData?.artisan.image ?? "/images/pro.jpg";
  const serviceName = displayData?.service ?? booking?.service?.title ?? "Service";
  const artisanFullName = booking
    ? `${serviceName} with ${artisanFullNameRaw}`
    : `${serviceName} with ${artisanFullNameRaw}`;
  const location = displayData?.jobLocation ?? booking?.address ?? booking?.location ?? "—";
  const dateStr = displayData
    ? [displayData.date, displayData.time].filter(Boolean).join(" · ")
    : "—";
  const priceRows = displayData?.priceBreakdown.rows ?? [];
  const fallbackServicePrice =
    priceRows.length === 0 && booking?.price != null
      ? [{ key: "servicePrice", label: "Service price", amount: Number(booking.price) }]
      : [];
  const resolvedPriceRows = priceRows.length > 0 ? priceRows : fallbackServicePrice;
  const resolvedTotal =
    displayData?.priceBreakdown.total ??
    (resolvedPriceRows.length > 0
      ? resolvedPriceRows.reduce((sum, row) => sum + row.amount, 0)
      : null);

  const isCompletedBooking = booking?.status === "COMPLETED";

  const handleRatingDone = async (rating: number, tags: string[], feedback: string, tipAmount: number) => {
    if (!isCompletedBooking || existingReview) return;
    setIsSubmitting(true);
    try {
      if (bookingId) {
        const created = await submitReview({
          bookingId,
          rating,
          feedback: feedback.trim() || undefined,
          selectedTags: tags,
          highlights: tags,
        });
        setExistingReview(created);
      }
      void tipAmount;
      setShowRating(false);
      router.push("/user/krafts?tab=completed");
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      if ((ax.response?.data?.message ?? "").toLowerCase().includes("already")) {
        if (bookingId) {
          try {
            const reviews = await getMyReviews();
            const found = findMyReviewForBooking(reviews, bookingId);
            if (found) setExistingReview(found);
          } catch {
            /* ignore */
          }
        }
      }
      console.error("Failed to submit review:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReport = async () => {
    if (bookingId) {
      try {
        await createDispute({
          booking_id: bookingId,
          reason: "Service issue",
        });
      } catch (err) {
        console.error("Failed to create dispute:", err);
      }
    }
    router.push("/user/support");
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
        <h1 className="text-[22px] font-gerat font-bold">{serviceName}</h1>
        <button onClick={() => router.push("/user/krafts")} className="p-1">
          <X size={20} className="text-gray-400" />
        </button>
      </div>

      {error && (
        <div className="px-4 mb-3">
          <ErrorBanner message={error} onDismiss={clearError} />
        </div>
      )}

      {/* Status Steps */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="w-8 h-8 bg-brand-orange rounded-full flex items-center justify-center"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ))}
          <span className="bg-brand-orange/10 text-brand-orange text-[12px] font-poppins font-semibold px-3 py-1 rounded-full border border-brand-orange/30">
            {td("completed")}
          </span>
        </div>
      </div>

      {/* Completed badge */}
      <div className="px-4 mb-4">
        <span className="bg-orange-50 text-brand-orange text-[12px] font-poppins font-semibold px-3 py-1 rounded-full border border-orange-200">
          {td("completed")}
        </span>
      </div>

      {/* Elapsed Timer */}
      <div className="mx-4 mb-5">
        <div className="flex items-end justify-center gap-6">
          <div className="text-center">
            <p className="text-[48px] font-gerat font-bold text-brand-blue leading-none">{pad(elapsed.h)}</p>
            <p className="text-[12px] font-poppins text-gray-400 mt-1">{td("hours")}</p>
          </div>
          <div className="text-center">
            <p className="text-[48px] font-gerat font-bold text-brand-orange leading-none">{pad(elapsed.m)}</p>
            <p className="text-[12px] font-poppins text-gray-400 mt-1">{td("minutes")}</p>
          </div>
          <div className="text-center">
            <p className="text-[48px] font-gerat font-bold text-gray-700 leading-none">{pad(elapsed.s)}</p>
            <p className="text-[12px] font-poppins text-gray-400 mt-1">{td("seconds")}</p>
          </div>
        </div>
      </div>

      {/* Artisan Card */}
      <div className="mx-4 border border-gray-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm mb-4">
        <div className="flex-1">
          <p className="text-[14px] font-poppins font-bold text-black mb-1">{artisanFullName}</p>
          <p className="text-[12px] font-poppins text-gray-500 mb-1">{location}</p>
          <p className="text-[12px] font-poppins text-gray-500 mb-2">{dateStr}</p>
          <span className="bg-orange-50 text-brand-orange text-[11px] font-poppins font-semibold px-2.5 py-1 rounded-full border border-orange-200">
            {td("completed")}
          </span>
        </div>
        <Image
          src={artisanImage}
          alt="artisan"
          width={72}
          height={72}
          className="rounded-xl object-cover w-18 h-18 shrink-0"
        />
      </div>

      {/* Map */}
      <div className="mx-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[14px] font-poppins font-semibold text-black">{td("jobLocation")}</p>
          <p className="text-[13px] font-poppins text-gray-500">{location}</p>
        </div>
        <div className="relative rounded-2xl overflow-hidden h-44 bg-gray-100">
          <Image src="/images/map.png" alt="map" fill className="object-cover" />
          <div className="absolute bottom-3 left-3">
            <span className="bg-brand-orange text-white text-[12px] font-poppins font-semibold px-3 py-1.5 rounded-full shadow">
              {td("serviceArea")}
            </span>
          </div>
        </div>
      </div>

      {/* Kraft Details Accordion */}
      <div className="mx-4 mb-2">
        <button
          onClick={() => setShowKraftDetails(!showKraftDetails)}
          className="w-full flex items-center justify-between py-4 border-b border-gray-100"
        >
          <span className="text-[15px] font-poppins font-semibold text-black">{td("kraftDetails")}</span>
          <ChevronRight size={18} className={`text-gray-400 transition-transform ${showKraftDetails ? "rotate-90" : ""}`} />
        </button>
        {showKraftDetails && (
          <p className="text-[13px] font-poppins text-gray-600 py-3 leading-relaxed">
            {booking?.notes ?? td("noDetails")}
          </p>
        )}
      </div>

      {/* Price Breakdown Accordion */}
      <div className="mx-4 mb-6">
        <button
          onClick={() => setShowPriceBreakdown(!showPriceBreakdown)}
          className="w-full flex items-center justify-between py-4 border-b border-gray-100"
        >
          <span className="text-[15px] font-poppins font-semibold text-black">{td("priceBreakdown")}</span>
          <ChevronRight size={18} className={`text-gray-400 transition-transform ${showPriceBreakdown ? "rotate-90" : ""}`} />
        </button>
        {showPriceBreakdown && (
          <div className="py-3 space-y-2">
            {resolvedPriceRows.length === 0 ? (
              <p className="text-[13px] font-poppins text-gray-500">{td("noPricingDetails")}</p>
            ) : (
              resolvedPriceRows.map((row) => (
                <div key={row.key} className="flex justify-between text-[13px] font-poppins text-gray-600">
                  <span>{row.label}</span>
                  <span>€{row.amount.toFixed(2)}</span>
                </div>
              ))
            )}
            {resolvedTotal != null && (
              <div className="flex justify-between text-[14px] font-poppins font-bold text-black border-t border-gray-100 pt-2 mt-2">
                <span>{td("totalPaid")}</span>
                <span>€{resolvedTotal.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {existingReview && (
        <div className="mx-4 mb-4">
          <SubmittedReviewSummary review={existingReview} revieweeLabel={artisanName} />
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-4 space-y-3">
        {isCompletedBooking && (
          <button
            onClick={() => setShowRating(true)}
            disabled={!!existingReview}
            className="w-full py-4 bg-brand-blue text-white rounded-2xl text-[15px] font-poppins font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {existingReview ? td("reviewSubmitted") : td("rateName", { name: artisanName })}
          </button>
        )}
        <button
          onClick={handleReport}
          className="w-full py-4 bg-red-50 text-red-500 rounded-2xl text-[15px] font-poppins font-semibold border border-red-100 hover:bg-red-100 transition-colors"
        >
          {td("reportName", { name: artisanName })}
        </button>
      </div>

      {/* Rating Modal */}
      {showRating && (
        <RatingModal
          artisan={{ name: artisanName, image: artisanImage }}
          onClose={() => setShowRating(false)}
          onDone={handleRatingDone}
          isSubmitting={isSubmitting}
        />
      )}
    </main>
  );
};

const CompletedJobPage = () => (
  <Suspense>
    <CompletedJobContent />
  </Suspense>
);

export default CompletedJobPage;
