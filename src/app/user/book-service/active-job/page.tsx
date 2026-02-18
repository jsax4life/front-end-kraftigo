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
import type { Booking } from "@/types";

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
  priceBreakdown: {
    hourlyRate: { label: "Hourly Rate ($65/hr x 2hrs)", amount: 100.0 },
    serviceFee: { label: "Service fee", amount: 9.0 },
    discount: { label: "Discount (Welcome 10)", amount: -15.0 },
    total: 95.0,
  },
};

const ActiveJobContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const bookingId = searchParams.get("id");
  const statusParam = searchParams.get("status") || "accepted";
  const isAccepted = statusParam === "accepted";

  const { fetchBookingById, cancelBooking, updateBooking, isLoading, isSubmitting, error, clearError, selectedBooking } =
    useBookingsStore();

  const [showCancel, setShowCancel] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
  const [showKraftDetails, setShowKraftDetails] = useState(false);

  // Fetch real booking if ID is provided
  useEffect(() => {
    if (bookingId) {
      fetchBookingById(bookingId);
    }
  }, [bookingId]);

  // Derive display data from real booking or fall back to mock
  const displayData = bookingId && selectedBooking
    ? {
        service: selectedBooking.service?.title ?? "Service",
        date: new Date(selectedBooking.scheduled_date).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        time: selectedBooking.scheduled_time ?? "",
        timeLabel: "",
        artisan: {
          name: selectedBooking.service?.artisan?.fullName ?? "Artisan",
          location: selectedBooking.location,
          image: selectedBooking.service?.artisan?.avatar ?? "/images/pro.jpg",
        },
        jobLocation: selectedBooking.location,
        kraftDetails: selectedBooking.notes ?? "",
        priceBreakdown: {
          hourlyRate: { label: "Service price", amount: selectedBooking.price ?? 0 },
          serviceFee: { label: "Service fee", amount: 9.0 },
          discount: { label: "Discount", amount: 0 },
          total: (selectedBooking.price ?? 0) + 9.0,
        },
      }
    : MOCK_BOOKING;

  const handleCancel = async (reason?: string) => {
    if (bookingId) {
      await cancelBooking(bookingId, reason);
    }
    setShowCancel(false);
    router.push("/user/krafts");
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

      {/* Status Badge + Steps */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2">
          <span
            className={`text-white text-[12px] font-poppins font-semibold px-3 py-1 rounded-full ${
              isAccepted ? "bg-brand-blue" : "bg-brand-orange"
            }`}
          >
            {isAccepted ? "Upcoming" : "Pending"}
          </span>
          {[2, 3, 4].map((n) => (
            <span
              key={n}
              className="w-7 h-7 bg-gray-100 text-gray-400 text-[12px] font-poppins font-semibold rounded-full flex items-center justify-center"
            >
              {n}
            </span>
          ))}
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

      {/* Artisan Card */}
      <div className="mx-4 border border-gray-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm mb-4">
        <div className="flex-1">
          <p className="text-[14px] font-poppins font-bold text-black mb-1">
            {displayData.artisan.name}
          </p>
          <div className="flex items-center gap-1.5 text-[12px] text-gray-500 font-poppins mb-1">
            <MapPin size={13} className="shrink-0" />
            <span>{displayData.artisan.location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-gray-500 font-poppins">
            <Calendar size={13} className="shrink-0" />
            <span>
              {displayData.date} {displayData.timeLabel && `(${displayData.timeLabel})`}
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
            <div className="flex justify-between text-[13px] font-poppins text-gray-600">
              <span>{displayData.priceBreakdown.hourlyRate.label}</span>
              <span>${displayData.priceBreakdown.hourlyRate.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[13px] font-poppins text-gray-600">
              <span>{displayData.priceBreakdown.serviceFee.label}</span>
              <span>${displayData.priceBreakdown.serviceFee.amount.toFixed(2)}</span>
            </div>
            {displayData.priceBreakdown.discount.amount !== 0 && (
              <div className="flex justify-between text-[13px] font-poppins text-brand-orange">
                <span>{displayData.priceBreakdown.discount.label}</span>
                <span>-${Math.abs(displayData.priceBreakdown.discount.amount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-[14px] font-poppins font-bold text-black border-t border-gray-100 pt-2 mt-2">
              <span>Total</span>
              <span>${displayData.priceBreakdown.total.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-4 space-y-3">
        {isAccepted ? (
          <button
            onClick={() => setShowReschedule(true)}
            disabled={isSubmitting}
            className="w-full py-4 bg-brand-orange text-white rounded-2xl text-[15px] font-poppins font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60"
          >
            Reschedule
          </button>
        ) : (
          <button
            onClick={() => router.replace("/user/book-service/active-job?status=accepted" + (bookingId ? `&id=${bookingId}` : ""))}
            className="w-full py-4 bg-brand-orange text-white rounded-2xl text-[15px] font-poppins font-semibold hover:bg-orange-600 transition-colors"
          >
            Accept &amp; Schedule
          </button>
        )}

        <button
          onClick={() => router.push("/user/chat")}
          className="w-full py-4 bg-brand-blue text-white rounded-2xl text-[15px] font-poppins font-semibold hover:bg-blue-700 transition-colors"
        >
          Report Issue
        </button>

        <button
          onClick={() => setShowCancel(true)}
          className="w-full py-2 text-brand-orange text-[14px] font-poppins font-semibold"
        >
          Cancel Kraft
        </button>
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
    </main>
  );
};

const ActiveJobPage = () => (
  <Suspense>
    <ActiveJobContent />
  </Suspense>
);

export default ActiveJobPage;
