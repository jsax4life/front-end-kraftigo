"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Check, Minus, Plus } from "lucide-react";
import { useState, useMemo } from "react";
import RecurringScheduleSection from "@/components/shared/RecurringScheduleSection";
import {
  appendRecurrenceToUrlParams,
  buildRecurrenceSchedulePayload,
  readRecurrenceFromUrlParams,
  recurrenceFieldsToState,
  validateRecurrenceScheduleState,
  type RecurrenceScheduleState,
} from "@/lib/bookingRecurrence";
import Button from "@/components/ui/button";
import toast from "react-hot-toast";
import { DistanceBadge } from "@/components/ui/DistanceBadge";
import {
  clampDurationHours,
  parseDurationHoursParam,
  validateDurationHours,
  DURATION_HOURS_MIN,
} from "@/lib/durationHours";
import { useTranslations } from "next-intl";
import { readFlexibleScheduleFromUrlParams } from "@/lib/flexibleSchedule";
import { parseLocalDateYmd } from "@/utils/date";
import {
  isFlexibleScheduleFieldsActive,
  isRecurrenceScheduleActive,
  scheduleCombinationErrorKey,
} from "@/lib/bookingScheduleOptions";

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

  const tn = useTranslations("booking.nav");
  const td = useTranslations("booking.verifyDetailsStep");
  const tSchedule = useTranslations("booking.serviceDetailsStep");

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
  const [recurrenceSchedule, setRecurrenceSchedule] = useState<RecurrenceScheduleState>(() =>
    recurrenceFieldsToState(readRecurrenceFromUrlParams(searchParams)),
  );
  const flexFieldsFromUrl = useMemo(
    () => readFlexibleScheduleFromUrlParams(searchParams),
    [searchParams],
  );
  const flexActiveFromUrl = isFlexibleScheduleFieldsActive(flexFieldsFromUrl);
  const hasRecurrenceFromEarlier = useMemo(
    () => Boolean(readRecurrenceFromUrlParams(searchParams).recurrenceFrequency),
    [searchParams],
  );

  const anchorDate = useMemo(() => {
    const raw = searchParams.get("date")?.trim();
    if (!raw) return undefined;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return parseLocalDateYmd(raw) ?? undefined;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }, [searchParams]);

  const preferredTime24 = useMemo(() => {
    const raw = searchParams.get("time")?.trim() || "";
    if (raw.includes("AM") || raw.includes("PM")) {
      const timeParts = raw.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (timeParts) {
        let hour24 = parseInt(timeParts[1], 10);
        const minutes = timeParts[2];
        const period = timeParts[3].toUpperCase();
        if (period === "PM" && hour24 !== 12) hour24 += 12;
        else if (period === "AM" && hour24 === 12) hour24 = 0;
        return `${hour24.toString().padStart(2, "0")}:${minutes}`;
      }
    }
    return raw;
  }, [searchParams]);

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
    const recurrenceError = validateRecurrenceScheduleState(recurrenceSchedule);
    if (recurrenceError) {
      toast.error(recurrenceError);
      return;
    }
    const mutexKey = scheduleCombinationErrorKey(
      flexActiveFromUrl,
      isRecurrenceScheduleActive(recurrenceSchedule),
    );
    if (mutexKey) {
      toast.error(tSchedule(mutexKey));
      return;
    }
    appendRecurrenceToUrlParams(
      params,
      buildRecurrenceSchedulePayload(recurrenceSchedule),
    );
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
              {td("verifyLabel")}
            </span>
            <span className="w-9 h-9 bg-white font-bold rounded-full text-[#00000066] flex items-center justify-center text-sm">
              5
            </span>
          </div>
          <button
            className="text-brand-orange text-[14px] sm:text-[16px] font-poppins font-semibold"
            onClick={() => router.back()}
          >
            {td("back")}
          </button>
        </div>
        <h2 className="text-[18px] sm:text-[20px] font-poppins font-semibold px-4 sm:px-0 max-w-4xl mx-auto">
          {td("verifyYourDetails")}
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
          {td("kraftDetails")}
        </h3>
        <div className="bg-[#F6F6F6] rounded-lg p-4 border border-[#0000001A]">
          <p className="text-[13px] sm:text-[14px] text-gray-700 font-poppins leading-relaxed">
            {taskDetails || td("noTaskDetails")}
          </p>
        </div>
      </div>

      {/* Estimated hours (hidden for public FLAT pricing) */}
      {shouldShowEstimatedHours && (
        <div className="max-w-4xl mx-auto px-4 sm:px-0 py-6 border-t border-[#0000001A]">
          <h3 className="text-[18px] sm:text-[20px] font-poppins font-semibold mb-3">
            {td("estimatedHours")}
          </h3>
          <p className="text-[13px] sm:text-[14px] text-gray-700 font-poppins mb-4">
            {td("howManyHours")}
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
                {td("youWillBeCharged")}
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

      <div className="max-w-4xl mx-auto border-t border-[#0000001A] pb-20">
        <RecurringScheduleSection
          state={recurrenceSchedule}
          onChange={setRecurrenceSchedule}
          alwaysExpanded={hasRecurrenceFromEarlier && !flexActiveFromUrl}
          blockedByFlexibleSchedule={flexActiveFromUrl}
          anchorDate={anchorDate}
          preferredTime24={preferredTime24}
        />
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
            {tn("next")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Page;
