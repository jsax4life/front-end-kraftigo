"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Check, Minus, Plus } from "lucide-react";
import { useState } from "react";
import Button from "@/components/ui/button";
import toast from "react-hot-toast";
import { DistanceBadge } from "@/components/ui/DistanceBadge";
import {
  clampDurationHours,
  parseDurationHoursParam,
  validateDurationHours,
  DURATION_HOURS_MIN,
} from "@/lib/durationHours";

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoryId") || "";
  const categoryName = searchParams.get("category") || "Service";
  const address = searchParams.get("address") || "";
  const date = searchParams.get("date") || new Date().toISOString();
  const taskDetails = searchParams.get("taskDetails") || "";
  const isPublic = searchParams.get("isPublic") === "true";
  const offerPricingType =
    searchParams.get("offerPricingType") === "HOURLY" ? "HOURLY" : "FLAT";
  const shouldShowEstimatedHours = !isPublic || offerPricingType === "HOURLY";

  // Artisan details passed from selection step
  const artisanName = searchParams.get("artisanName") || "";
  const artisanImage = searchParams.get("artisanImage") || "";
  const artisanBadge = searchParams.get("artisanBadge") || "";
  const pricePerHour = parseFloat(searchParams.get("pricePerHour") || "0") || 0;
  const artisanDistanceLabel = searchParams.get("distanceLabel");
  const artisanDistanceKm = searchParams.get("distanceKm");

  const [bookingHours, setBookingHours] = useState(() =>
    parseDurationHoursParam(searchParams.get("hours")),
  );
  const [selectedFrequency, setSelectedFrequency] = useState("just-once");

  const handleIncrement = () => {
    setBookingHours((prev) => clampDurationHours(prev + 1));
  };

  const handleDecrement = () => {
    setBookingHours((prev) => clampDurationHours(prev - 1));
  };

  const handleNext = () => {
    if (shouldShowEstimatedHours) {
      const hoursErr = validateDurationHours(bookingHours);
      if (hoursErr) {
        toast.error(hoursErr);
        return;
      }
    }
    const params = new URLSearchParams(searchParams.toString());
    if (shouldShowEstimatedHours) {
      params.set("hours", String(bookingHours));
    } else {
      params.delete("hours");
    }
    params.set("frequency", selectedFrequency);
    router.push(`/user/book-service/finishBooking?${params.toString()}`);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      };
      return date.toLocaleDateString("en-US", options);
    } catch {
      return dateString;
    }
  };

  const frequencyOptions = [
    { id: "just-once", label: "Just Once" },
    { id: "weekly", label: "Weekly" },
    { id: "every-2-weeks", label: "Every 2 weeks" },
    { id: "monthly", label: "Monthly" },
  ];

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="bg-[#FFF0F0] pb-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-0 py-6 flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="w-9 h-9 bg-brand-orange rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-colors">
              <Check size={20} className="text-white" />
            </span>
            <span className="w-9 h-9 bg-brand-orange rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-colors">
              <Check size={20} className="text-white" />
            </span>
            <span className="w-9 h-9 bg-brand-orange rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-colors">
              <Check size={20} className="text-white" />
            </span>
            <span className="w-fit px-3 py-2.5 text-xs sm:text-sm bg-brand-orange text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-colors">
              Verify
            </span>
            <span className="w-9 h-9 bg-white font-bold rounded-full text-[#00000066] flex items-center justify-center text-sm">
              5
            </span>
          </div>
          <button
            className="text-brand-orange text-[14px] sm:text-[16px] font-poppins font-semibold"
            onClick={() => router.back()}
          >
            Back
          </button>
        </div>
        <h2 className="text-[18px] sm:text-[20px] font-poppins font-semibold px-4 sm:px-0 max-w-4xl mx-auto">
          Verify Your Details
        </h2>
      </div>

      {/* Service Info */}
      <div className="max-w-4xl mx-auto px-4 sm:px-0 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-2">
              {categoryName}
            </h1>
            {!isPublic && artisanName && (
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[13px] sm:text-[14px] font-poppins font-semibold text-gray-900">
                  {artisanName}
                </span>
                {artisanBadge && (
                  <span className="bg-[#E8F5E9] text-[#2E7D32] text-[10px] sm:text-[11px] font-poppins font-semibold px-2 py-0.5 rounded">
                    {artisanBadge}
                  </span>
                )}
                <DistanceBadge
                  size="sm"
                  label={artisanDistanceLabel}
                  sources={artisanDistanceKm ? [{ distanceKm: artisanDistanceKm }] : undefined}
                />
              </div>
            )}
            <p className="text-[13px] sm:text-[14px] text-gray-700 font-poppins">
              {address}
            </p>
            <p className="text-[13px] sm:text-[14px] text-gray-700 font-poppins">
              {formatDate(date)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {!isPublic && pricePerHour > 0 && (
              <span className="text-brand-orange text-[16px] sm:text-[18px] font-mabry font-bold">
                €{pricePerHour.toFixed(2)}/hr
              </span>
            )}
            {!isPublic && artisanImage && (
              <Image
                src={artisanImage}
                alt="artisan profile"
                width={70}
                height={70}
                className="w-20 h-20 rounded-lg object-cover"
              />
            )}
          </div>
        </div>
      </div>

      {/* Kraft Details */}
      <div className="max-w-4xl mx-auto px-4 sm:px-0 py-8 border-t border-[#0000001A]">
        <h3 className="text-[18px] sm:text-[20px] font-poppins font-semibold mb-3">
          Kraft Details
        </h3>
        <div className="bg-[#F6F6F6] rounded-lg p-4 border border-[#0000001A]">
          <p className="text-[13px] sm:text-[14px] text-gray-700 font-poppins leading-relaxed">
            {taskDetails || "No task details provided"}
          </p>
        </div>
      </div>

      {/* Estimated hours (hidden for public FLAT pricing) */}
      {shouldShowEstimatedHours && (
        <div className="max-w-4xl mx-auto px-4 sm:px-0 py-6 border-t border-[#0000001A]">
          <h3 className="text-[18px] sm:text-[20px] font-poppins font-semibold mb-3">
            Estimated hours
          </h3>
          <p className="text-[13px] sm:text-[14px] text-gray-700 font-poppins mb-4">
            How many hours do you want to book
          </p>
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={handleDecrement}
              className="w-12 h-12 rounded-full bg-[#FFE5D9] flex items-center justify-center hover:bg-[#FFD5C2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={bookingHours <= DURATION_HOURS_MIN}
            >
              <Minus size={20} className="text-brand-orange" />
            </button>
            <span className="text-[28px] sm:text-[32px] font-poppins font-semibold min-w-15 text-center">
              {bookingHours % 1 === 0 ? bookingHours : bookingHours.toFixed(2)}
            </span>
            <button
              onClick={handleIncrement}
              className="w-12 h-12 rounded-full bg-[#FFE5D9] flex items-center justify-center hover:bg-[#FFD5C2] transition-colors"
            >
              <Plus size={20} className="text-brand-orange" />
            </button>
          </div>
          {!isPublic && pricePerHour > 0 && (
            <div className="text-center">
              <p className="text-[13px] sm:text-[14px] text-gray-600 font-poppins mb-1">
                You will be charged
              </p>
              <div className="inline-block bg-[#FF66001A] px-6 py-2 rounded-full">
                <span className="text-brand-orange text-[18px] sm:text-[20px] font-poppins font-bold">
                  €{(pricePerHour * bookingHours).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Frequency */}
      <div className="max-w-4xl mx-auto px-4 sm:px-0 pt-6 pb-20 border-t border-[#0000001A]">
        <h3 className="text-[18px] sm:text-[20px] font-poppins font-semibold mb-3">
          Frequency
        </h3>
        <p className="text-[13px] sm:text-[14px] text-gray-700 font-poppins mb-4">
          How often do you want this service
        </p>
        <div className="space-y-3">
          {frequencyOptions.map((option) => (
            <label
              key={option.id}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="relative flex items-center">
                <input
                  type="radio"
                  name="frequency"
                  value={option.id}
                  checked={selectedFrequency === option.id}
                  onChange={(e) => setSelectedFrequency(e.target.value)}
                  className="w-5 h-5 appearance-none border border-black rounded-full checked:border-black checked:border-[6px] transition-all cursor-pointer"
                />
              </div>
              <span className="text-[14px] sm:text-[15px] font-poppins text-gray-800 group-hover:text-brand-orange transition-colors">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Next Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#0000001A] p-4 sm:p-5">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="primary"
            fullWidth
            onClick={handleNext}
            className="text-[16px] sm:text-[17px]"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Page;
