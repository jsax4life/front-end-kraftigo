"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { X, ChevronRight } from "lucide-react";
import RatingModal from "@/components/shared/RatingModal";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ErrorBanner from "@/components/shared/ErrorBanner";
import { useBookingsStore } from "@/store/useBookingsStore";
import { submitReview } from "@/lib/api/reviews";
import { createDispute } from "@/lib/api/disputes";

// ─── Elapsed timer since job "started" ────────────────────────────────────────
const useElapsedTimer = () => {
  const [elapsed, setElapsed] = useState({ h: 2, m: 45, s: 12 });
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed((prev) => {
        let { h, m, s } = prev;
        s++;
        if (s >= 60) { s = 0; m++; }
        if (m >= 60) { m = 0; h++; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return elapsed;
};

const pad = (n: number) => String(n).padStart(2, "0");

const CompletedJobContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("id");

  const { fetchBookingById, isLoading, error, clearError, selectedBooking } = useBookingsStore();
  const elapsed = useElapsedTimer();

  const [showRating, setShowRating] = useState(false);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
  const [showKraftDetails, setShowKraftDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (bookingId) {
      fetchBookingById(bookingId);
    }
  }, [bookingId]);

  // Derive display data
  const booking = bookingId && selectedBooking ? selectedBooking : null;
  const artisanName = booking?.service?.artisan?.fullName?.split(" ")[0] ?? "Edith";
  const artisanImage = booking?.service?.artisan?.avatar ?? "/images/pro.jpg";
  const serviceName = booking?.service?.title ?? "House Cleaning";
  const artisanFullName = booking
    ? `${serviceName} with ${booking.service?.artisan?.fullName ?? "Artisan"}`
    : "House Cleaning with Sarah M.";
  const location = booking?.location ?? "Hauptstraße 123 - 10115, Berlin";
  const dateStr = booking
    ? new Date(booking.scheduled_date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "15th Jan, 2025 12:55 PM";
  const price = booking?.price ?? 95.0;

  const handleRatingDone = async (rating: number, tags: string[], comment: string, tipAmount: number) => {
    setIsSubmitting(true);
    try {
      if (bookingId) {
        await submitReview({
          booking_id: bookingId,
          rating,
          tags,
          comment,
          tip_amount: tipAmount,
        });
      }
      setShowRating(false);
      router.push("/user/krafts?tab=completed");
    } catch (err) {
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
            Completed
          </span>
        </div>
      </div>

      {/* Completed badge */}
      <div className="px-4 mb-4">
        <span className="bg-orange-50 text-brand-orange text-[12px] font-poppins font-semibold px-3 py-1 rounded-full border border-orange-200">
          Completed
        </span>
      </div>

      {/* Elapsed Timer */}
      <div className="mx-4 mb-5">
        <div className="flex items-end justify-center gap-6">
          <div className="text-center">
            <p className="text-[48px] font-gerat font-bold text-brand-blue leading-none">{pad(elapsed.h)}</p>
            <p className="text-[12px] font-poppins text-gray-400 mt-1">Hours</p>
          </div>
          <div className="text-center">
            <p className="text-[48px] font-gerat font-bold text-brand-orange leading-none">{pad(elapsed.m)}</p>
            <p className="text-[12px] font-poppins text-gray-400 mt-1">Minutes</p>
          </div>
          <div className="text-center">
            <p className="text-[48px] font-gerat font-bold text-gray-700 leading-none">{pad(elapsed.s)}</p>
            <p className="text-[12px] font-poppins text-gray-400 mt-1">Seconds</p>
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
            Completed
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
          <p className="text-[14px] font-poppins font-semibold text-black">Job Location</p>
          <p className="text-[13px] font-poppins text-gray-500">{location}</p>
        </div>
        <div className="relative rounded-2xl overflow-hidden h-44 bg-gray-100">
          <Image src="/images/map.png" alt="map" fill className="object-cover" />
          <div className="absolute bottom-3 left-3">
            <span className="bg-brand-orange text-white text-[12px] font-poppins font-semibold px-3 py-1.5 rounded-full shadow">
              Service Area
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
          <span className="text-[15px] font-poppins font-semibold text-black">Kraft Details</span>
          <ChevronRight size={18} className={`text-gray-400 transition-transform ${showKraftDetails ? "rotate-90" : ""}`} />
        </button>
        {showKraftDetails && (
          <p className="text-[13px] font-poppins text-gray-600 py-3 leading-relaxed">
            {booking?.notes ?? "No additional details provided."}
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
          <ChevronRight size={18} className={`text-gray-400 transition-transform ${showPriceBreakdown ? "rotate-90" : ""}`} />
        </button>
        {showPriceBreakdown && (
          <div className="py-3 space-y-2">
            <div className="flex justify-between text-[13px] font-poppins text-gray-600">
              <span>Service price</span>
              <span>${price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[13px] font-poppins text-gray-600">
              <span>Service fee</span>
              <span>$9.00</span>
            </div>
            <div className="flex justify-between text-[14px] font-poppins font-bold text-black border-t border-gray-100 pt-2 mt-2">
              <span>Total Paid</span>
              <span>${(price + 9).toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-4 space-y-3">
        <button
          onClick={() => setShowRating(true)}
          className="w-full py-4 bg-brand-blue text-white rounded-2xl text-[15px] font-poppins font-semibold hover:bg-blue-700 transition-colors"
        >
          Rate {artisanName}
        </button>
        <button
          onClick={handleReport}
          className="w-full py-4 bg-red-50 text-red-500 rounded-2xl text-[15px] font-poppins font-semibold border border-red-100 hover:bg-red-100 transition-colors"
        >
          Report {artisanName}
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
