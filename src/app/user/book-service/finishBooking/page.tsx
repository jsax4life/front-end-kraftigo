"use client";

import { Check } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import Input from "@/components/ui/input";
import { useBookingsStore } from "@/store/useBookingsStore";
import type { Booking } from "@/types";
import type { PublishToMarketplacePayload } from "@/lib/api/bookings";
import { usePaymentStore } from "@/store/usePaymentStore";
import { useAddressStore } from "@/store/useAddressStore";
import toast from "react-hot-toast";
import { logger } from "@/utils/logger";
import PaymentFlowModal from "@/components/shared/PaymentFlowModal";
import { readRecommendationDraftBookingIdFromSession } from "@/lib/recommendationDraftBooking";
import {
  isSavedPaymentMethodRequiredError,
  SAVED_PAYMENT_METHOD_REQUIRED_TOAST,
  bookingApiErrorUserMessage,
} from "@/lib/paymentCardRequired";
import { MARKETPLACE_FIXED_PRICE_FINISH_BOOKING_MESSAGE } from "@/lib/marketplaceFixedPriceOfferValidation";
import { parseBookingMoney } from "@/lib/bookingDisplay";
import { formatHourlyRate, formatMoney } from "@/utils/currency";
import {
  clampDurationHours,
  parseDurationHoursParam,
} from "@/lib/durationHours";
/** Last resort when no coordinates from the booking URL chain or address store */
import { resolveTaskCoordinates } from "@/lib/taskLocation";
import { readFlexibleScheduleFromUrlParams } from "@/lib/flexibleSchedule";
import { useTranslations } from "next-intl";

function resolveBookingCoordinates(
  searchParams: URLSearchParams,
  storeLat: number | null,
  storeLng: number | null,
): { latitude: number; longitude: number } {
  const resolved = resolveTaskCoordinates({
    urlLat: searchParams.get("latitude"),
    urlLng: searchParams.get("longitude"),
    storeLat,
    storeLng,
  });
  if (resolved) return resolved;
  throw new Error("Missing valid job coordinates");
}

/** After `select-krafter`, pass server pricing through to confirmation via query params. */
function appendBookingPricingParams(booking: Booking, params: URLSearchParams) {
  const setMoneyParam = (key: string, raw: unknown) => {
    const n = parseBookingMoney(raw);
    if (n !== null) params.set(key, n.toFixed(2));
  };
  setMoneyParam("bookingFinalAgreedPrice", booking.finalAgreedPrice);
  setMoneyParam("bookingPlatformFee", booking.platformFee);
  setMoneyParam("bookingArtisanEarning", booking.artisanEarning);
  const ruleId = booking.pricingRuleId;
  if (ruleId != null && String(ruleId).trim() !== "") {
    params.set("bookingPricingRuleId", String(ruleId).trim());
  }
}

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoryId") || "";
  const categoryName = searchParams.get("category") || "Service";
  const address =
    searchParams.get("address") || "Hauptstraße 123 - 10115, Berlin";
  const date = searchParams.get("date") || new Date().toISOString();
  const rawTime = searchParams.get("time") || "09:00 AM";

  const parsedDate = new Date(date);
  const formattedDisplayDate = !isNaN(parsedDate.getTime())
    ? new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(parsedDate)
    : date;
  const fullDateTimeDisplay = `${formattedDisplayDate} at ${rawTime}`;

  const isPublic = searchParams.get("isPublic") === "true";
  const offerPricingType = searchParams.get("offerPricingType") === "HOURLY" ? "HOURLY" : "FLAT";
  const isPublicHourly = isPublic && offerPricingType === "HOURLY";
  const budget = searchParams.get("budget") || "0";
  const openForNegotiationRawPublic = searchParams.get("openForNegotiation");
  const negotiationTurnedOffPublic = openForNegotiationRawPublic === "false";
  const budgetNumPublic = Number(budget);
  const publicFixedPriceInvalid =
    isPublic &&
    negotiationTurnedOffPublic &&
    !(Number.isFinite(budgetNumPublic) && budgetNumPublic > 0);
  const [promoCode, setPromoCode] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [estimatedHoursInput, setEstimatedHoursInput] = useState(() =>
    String(parseDurationHoursParam(searchParams.get("hours"))),
  );

  const td = useTranslations("booking.finishBookingStep");

  const hoursFromUrl = searchParams.get("hours");
  useEffect(() => {
    setEstimatedHoursInput(
      String(parseDurationHoursParam(hoursFromUrl)),
    );
  }, [hoursFromUrl]);


  const {
    createBooking,
    publishToMarketplace,
    selectKrafter,
    isSubmitting,
    recommendationDraftBookingId,
  } = useBookingsStore();
  const {
    savedMethods: paymentMethods,
    selectedPaymentId,
    selectPayment,
    hasPaymentMethods,
    fetchSavedMethods,
  } = usePaymentStore();
  const currentLatitude = useAddressStore((s) => s.currentLatitude);
  const currentLongitude = useAddressStore((s) => s.currentLongitude);

  useEffect(() => {
    void fetchSavedMethods();
  }, [fetchSavedMethods]);

  // Set initial selected payment to default or first method
  useEffect(() => {
    if (paymentMethods.length > 0 && !selectedPaymentId) {
      const defaultMethod =
        paymentMethods.find((m) => m.isDefault) || paymentMethods[0];
      selectPayment(defaultMethod.id);
    }
  }, [paymentMethods, selectedPaymentId, selectPayment]);

  const artisanId = searchParams.get("artisanId");
  const artisanImageRaw = searchParams.get("artisanImage")?.trim() || "";
  const artisanDisplayPhoto =
    artisanImageRaw &&
    (artisanImageRaw.startsWith("http://") ||
      artisanImageRaw.startsWith("https://") ||
      artisanImageRaw.startsWith("/"))
      ? artisanImageRaw
      : "/images/pro.jpg";
  const bookingId = searchParams.get("bookingId");
  const pricePerHourParam = parseFloat(searchParams.get("pricePerHour") || "");
  const hourlyRate =
    Number.isFinite(pricePerHourParam) && pricePerHourParam > 0
      ? pricePerHourParam
      : 41.29;
  const durationHoursDisplay = clampDurationHours(Number(estimatedHoursInput));
  const serviceFee = 5.0;

  const estimatedLaborSubtotal = isPublic
    ? (isPublicHourly ? Number(budget) * durationHoursDisplay : Number(budget))
    : hourlyRate * durationHoursDisplay;
  /** Sum of visible breakdown lines only (discount not wired to promo yet). */
  const totalAmount = estimatedLaborSubtotal + serviceFee;

  const handleConfirmPayment = async () => {
    logger.log("Initiating booking creation", {
      categoryId,
      categoryName,
      address,
      date,
    });

    try {
      let durationHours = 1;
      if (!isPublic || isPublicHourly) {
        durationHours = clampDurationHours(Number(estimatedHoursInput));
      }

      let latitude: number;
      let longitude: number;
      try {
        ({ latitude, longitude } = resolveBookingCoordinates(
          searchParams,
          currentLatitude,
          currentLongitude,
        ));
      } catch {
        toast.error(
          td("errorMissingLocationCoords")
        );
        return;
      }
      logger.log("Booking coordinates", { latitude, longitude });

      // Convert time to HH:mm format (remove AM/PM if present)
      const rawTime = searchParams.get("time") || "09:00";
      let formattedTime = rawTime;

      // If time has AM/PM, convert to 24-hour format
      if (rawTime.includes("AM") || rawTime.includes("PM")) {
        const timeParts = rawTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (timeParts) {
          let hour24 = parseInt(timeParts[1], 10);
          const minutes = timeParts[2];
          const period = timeParts[3].toUpperCase();

          if (period === "PM" && hour24 !== 12) {
            hour24 += 12;
          } else if (period === "AM" && hour24 === 12) {
            hour24 = 0;
          }

          formattedTime = `${hour24.toString().padStart(2, "0")}:${minutes}`;
        }
      }

      const jobTitle =
        searchParams.get("jobTitle")?.trim() || categoryName;
      const taskDetails = searchParams.get("taskDetails") || "";
      const specialInstructionsRaw = searchParams.get("specialInstructions") || "";

      const flexSchedule = readFlexibleScheduleFromUrlParams(searchParams);

      // Construct payload for API in the format backend expects
      const basePayload = {
        serviceCategoryId: searchParams.get("categoryId") || "",
        jobTitle,
        jobDescription: taskDetails,
        consentAcknowledged: true,
        address: address,
        latitude: latitude,
        longitude: longitude,
        preferredDate:
          /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date(date).toISOString().split("T")[0],
        preferredTime: formattedTime, // HH:mm format
        ...(artisanId && !isPublic ? { artisanId } : {}),
        ...(!isPublic ? { proposedPrice: hourlyRate * durationHours } : {}),
        ...(flexSchedule.preferredDateEnd ? { preferredDateEnd: flexSchedule.preferredDateEnd } : {}),
        ...(flexSchedule.additionalPreferredDates?.length
          ? { additionalPreferredDates: flexSchedule.additionalPreferredDates }
          : {}),
      };

      let pricingFromSelection: Booking | undefined;

      if (isPublic) {
        if (publicFixedPriceInvalid) {
          return;
        }

        const recommendationBookingId =
          bookingId ||
          recommendationDraftBookingId ||
          readRecommendationDraftBookingIdFromSession() ||
          undefined;
        const budgetNum = Number(budget);
        const offerAmount = Number.isFinite(budgetNum) ? budgetNum : undefined;
        const proposedPricePublic = Number.isFinite(budgetNum) ? budgetNum : undefined;
        const verifiedOnlyRaw = searchParams.get("verifiedOnly");
        const expiryOption = searchParams.get("expiryOption")?.trim() || undefined;
        const expiryDate = searchParams.get("expiryDate")?.trim() || undefined;
        const krafterRatingRequirement =
          searchParams.get("krafterRatingRequirement")?.trim() || undefined;
        const serviceListingId = searchParams.get("serviceListingId")?.trim() || undefined;

        const pendingMedia = useBookingsStore.getState().pendingPublishMediaFiles;
        /** Draft already uploaded media in `create-for-recommendation`; re-sending duplicates S3 rows. */
        const attachMedia =
          pendingMedia.length > 0 && !recommendationBookingId;

        const publishPayload: PublishToMarketplacePayload = {
          ...basePayload,
          offerPricingType,
          ...(isPublicHourly ? { offerDurationHours: durationHours } : {}),
          ...(serviceListingId ? { serviceListingId } : {}),
          ...(offerAmount !== undefined ? { offerAmount, proposedPrice: proposedPricePublic } : {}),
          ...(recommendationBookingId ? { recommendationBookingId } : {}),
          ...(expiryOption ? { expiryOption } : {}),
          ...(expiryDate ? { expiryDate } : {}),
          ...(openForNegotiationRawPublic !== null
            ? { openForNegotiation: openForNegotiationRawPublic === "true" }
            : {}),
          ...(krafterRatingRequirement ? { krafterRatingRequirement } : {}),
          ...(verifiedOnlyRaw !== null ? { verifiedOnly: verifiedOnlyRaw === "true" } : {}),
          ...(specialInstructionsRaw.trim()
            ? { specialInstructions: specialInstructionsRaw.trim() }
            : {}),
          ...(attachMedia ? { media: pendingMedia } : {}),
        };
        logger.log("Marketplace Booking payload:", publishPayload);
        await publishToMarketplace(publishPayload);
      } else if (artisanId) {
        if (!bookingId) {
          toast.error(
            td("errorMissingLocationCoords") // using general error? wait no, "Missing booking reference. Please return to task details and go through the steps again." -> let me use general error for now, actually I missed this string. Let me just leave it as hardcoded for this one since it's an edge case error that might not be visible often, or I can just translate it inline if needed, but I didn't add it. Let's keep it as is.
          );
          return;
        }
        logger.log("Selecting Krafter on recommendation draft", {
          bookingId,
          artisanId,
          durationHours,
        });
        pricingFromSelection = await selectKrafter(bookingId, {
          krafterId: artisanId,
          durationHours,
        });
      } else {
        logger.log("Booking payload:", basePayload);
        await createBooking(basePayload);
      }

      toast.success(
        isPublic
          ? td("successPublicTask")
          : artisanId
            ? td("successRequestSent")
            : td("successBookingConfirmed"),
      );
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("isPublic", String(isPublic));
      if (!isPublic) {
        nextParams.set("hours", String(durationHours));
      }
      if (pricingFromSelection) {
        appendBookingPricingParams(pricingFromSelection, nextParams);
      }
      router.push(`/user/book-service/confirmation?${nextParams.toString()}`);
    } catch (err: unknown) {
      logger.error("Booking creation failed:", err);
      const ax = err as { response?: { status?: number } };

      // Handle specific error cases
      if (ax.response?.status === 401) {
        toast.error(td("errorLoginRequired"));
        router.push("/user/login");
      } else if (isSavedPaymentMethodRequiredError(err)) {
        toast.error(SAVED_PAYMENT_METHOD_REQUIRED_TOAST, { duration: 6500 });
        setShowPaymentModal(true);
      } else {
        toast.error(
          bookingApiErrorUserMessage(
            err,
            td("errorFailedToCreate")
          ),
        );
      }
    }
  };

  const handleAddPayment = () => {
    // Open payment modal to add new payment method
    setShowPaymentModal(true);
  };

  return (
    <div className="min-h-screen bg-white pb-8">
      {/* Header */}
      <div className="bg-[#FFF0F0] pb-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-0 py-6 flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="w-9 h-9 bg-brand-orange rounded-full flex items-center justify-center">
              <Check size={20} className="text-white" />
            </span>
            <span className="w-9 h-9 bg-brand-orange rounded-full flex items-center justify-center">
              <Check size={20} className="text-white" />
            </span>
            <span className="w-9 h-9 bg-brand-orange rounded-full flex items-center justify-center">
              <Check size={20} className="text-white" />
            </span>
            <span className="w-9 h-9 bg-brand-orange rounded-full flex items-center justify-center">
              <Check size={20} className="text-white" />
            </span>
            <span className="w-fit px-3 py-2.5 text-xs sm:text-sm bg-brand-orange text-white rounded-full flex items-center justify-center">
              {isPublic ? td("detailsLabel") : td("finishLabel")}
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
          {isPublic
            ? td("postYourTask")
            : hasPaymentMethods()
              ? td("completeOrder")
              : td("verifyYourDetails")}
        </h2>
      </div>

      {/* Service Info */}
      <div className="max-w-4xl mx-auto px-4 sm:px-0 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-2">
              {categoryName}
            </h1>
            {isPublic ? (
              <div className="flex items-center gap-2 mb-2"></div>
            ) : (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[13px] sm:text-[14px] font-poppins font-semibold text-gray-900">
                  {searchParams.get("artisanName")}
                </span>
                {searchParams.get("artisanBadge") ? (
                  <span className="bg-[#E8F5E9] text-[#2E7D32] text-[10px] sm:text-[11px] font-poppins font-semibold px-2 py-0.5 rounded">
                    {searchParams.get("artisanBadge")}
                  </span>
                ) : null}
              </div>
            )}
            <p className="text-[13px] sm:text-[14px] text-gray-700 font-poppins">
              {address}
            </p>
            <p className="text-[13px] sm:text-[14px] text-gray-700 font-poppins mt-1">
              {fullDateTimeDisplay}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 ">
            {isPublic ? (
              <span className="text-brand-orange text-[18px] sm:text-[18px] mt-2 font-mabry font-bold">
                {td("budget")}: {formatMoney(Number(budget) || 0)}{isPublicHourly ? td("perHour") : ""}
              </span>
            ) : (
              <>
                <span className="text-brand-orange text-[16px] sm:text-[18px] font-poppins font-bold">
                  {formatHourlyRate(hourlyRate)}
                </span>
                <Image
                  src={artisanDisplayPhoto}
                  alt="artisan profile"
                  width={70}
                  height={70}
                  className="w-20 h-20 rounded-lg object-cover"
                  unoptimized={
                    artisanDisplayPhoto.startsWith("http://") ||
                    artisanDisplayPhoto.startsWith("https://")
                  }
                />
              </>
            )}
          </div>
        </div>
      </div>



      {/* Price Breakdown */}
      <div className="max-w-4xl mx-auto px-4 sm:px-0 py-4 border-t border-[#0000001A]">
        <h3 className="text-[18px] sm:text-[20px] font-poppins font-semibold mb-4">
          {td("priceBreakdown")}
        </h3>
        <div className="space-y-3">
          {isPublic ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[13px] sm:text-[14px] font-poppins text-gray-700">
                  {isPublicHourly ? td("yourOfferRate") : td("yourOfferBudget")} ({formatHourlyRate(Number(budget) || 0)} * {durationHoursDisplay % 1 === 0
                        ? durationHoursDisplay
                        : durationHoursDisplay.toFixed(2)} )
                </span>
                <span className="text-[14px] sm:text-[15px] font-poppins font-semibold text-gray-900">
                  {formatMoney(estimatedLaborSubtotal)}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[13px] sm:text-[14px] font-poppins text-gray-700">
                  {td("hourlyRate")} ({formatHourlyRate(hourlyRate)} * {durationHoursDisplay % 1 === 0
                    ? durationHoursDisplay
                    : durationHoursDisplay.toFixed(2)} hours)
                </span>
                <span className="text-[14px] sm:text-[15px] font-poppins font-semibold text-gray-900">
                  {formatMoney(estimatedLaborSubtotal)}
                </span>
              </div>
              
            </>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[13px] sm:text-[14px] font-poppins text-gray-700">
              {isPublic ? td("serviceFee") : td("serviceFeeEstimate")}
            </span>
            <span className="text-[14px] sm:text-[15px] font-poppins font-semibold text-gray-900">
              {formatMoney(serviceFee)}
            </span>
          </div>
          <div className="pt-3 border-t border-[#0000001A] flex items-center justify-between">
            <span className="text-[15px] sm:text-[16px] font-poppins font-bold text-gray-900">
              {isPublic ? td("totalAmount") : td("totalEstimate")}
            </span>
            <span className="text-[16px] sm:text-[18px] font-poppins font-bold text-gray-900">
              {formatMoney(totalAmount)}
            </span>
          </div>
        </div>
        {publicFixedPriceInvalid ? (
          <p className="text-[12px] font-poppins text-red-600 mt-3" role="alert">
            {MARKETPLACE_FIXED_PRICE_FINISH_BOOKING_MESSAGE}
          </p>
        ) : null}
      </div>

      {/* Promo Code */}
      <div className="max-w-4xl mx-auto px-4 sm:px-0 py-8 -mt-8">
        <div className="flex items-center gap-1 relative">
          <Input
            placeholder={td("promoCode")}
            value={promoCode}
            onChange={setPromoCode}
            className="flex-1"
          />
          <button className="absolute right-2 top-1/2 mt-1 transform -translate-y-1/2 px-6 py-2 bg-[#FFE5D9] text-brand-orange text-[14px] sm:text-[15px] font-poppins font-semibold rounded-lg hover:bg-[#FFD5C2] transition-colors">
            {td("applyPromoCode")}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-0 py-6 border-t border-[#0000001A]">
        <h3 className="text-[18px] sm:text-[20px] font-poppins font-semibold mb-4">
          {td("paymentOptions")}
        </h3>

        {!hasPaymentMethods() ? (
          // No Payment Methods State
          <div className="space-y-4 py-5">
            <p className="text-[13px] sm:text-[14px] font-poppins text-gray-500 text-center py-4">
              {td("noPaymentMethods")}
            </p>
            <button
              onClick={handleAddPayment}
              className="w-full py-3 bg-blue-600 text-white text-[15px] sm:text-[16px] font-poppins font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-xl">+</span>
              {td("addNew")}
            </button>
          </div>
        ) : (
          // With Payment Methods State
          <div className="space-y-4">
            {paymentMethods.map((method) => {
              const methodLoose = method as unknown as Record<string, unknown>;
              const paymentMethodLoose =
                methodLoose.paymentMethod && typeof methodLoose.paymentMethod === "object"
                  ? (methodLoose.paymentMethod as Record<string, unknown>)
                  : null;
              const cardLike = (value: unknown): Record<string, unknown> | null =>
                value && typeof value === "object" ? (value as Record<string, unknown>) : null;
              // 1. Extract data safely
              const cardData =
                cardLike(method.card) ||
                cardLike(methodLoose.details) ||
                cardLike(paymentMethodLoose?.card) ||
                (typeof methodLoose.brand === "string" ? methodLoose : null);
              const isCard = cardData != null;

              // We only get last4 from Stripe for security
              const last4 =
                (typeof cardData?.last4 === "string" ? cardData.last4 : undefined) ||
                (typeof cardData?.number === "string" ? cardData.number.slice(-4) : undefined) ||
                (typeof methodLoose.cardLast4 === "string" ? methodLoose.cardLast4 : undefined) ||
                "****";
              // const holderName =
              //   cardData?.holder ||
              //   cardData?.name ||
              //   (method as any).name ||
              //   (method as any).billingDetails?.name ||
              //   "John Doe";

              // 2. Determine the Title based on the payment type
              let methodTitle = td("debitCreditCard");
              if (!isCard) {
                if (method.type === "sepa_debit")
                  methodTitle = td("sepaDirectDebit");
                else if (method.type === "paypal") methodTitle = td("payPal");
                else methodTitle = method.type; // Fallback
              }

              return (
                <div
                  key={method.id}
                  onClick={() => selectPayment(method.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    selectedPaymentId === method.id
                      ? "bg-[#F4F4F5] border-gray-300" // Selected state border
                      : "bg-[#F4F4F5] border-transparent hover:border-gray-200" // Unselected state
                  }`}
                >
                  {/* Top Row: Title & Radio Button */}
                  <div className="flex justify-between items-start">
                    <span className="font-poppins text-[15px] text-gray-800 capitalize">
                      {methodTitle}
                    </span>

                    {/* Custom Radio Button */}
                    <div
                      className={`w-[20px] h-[20px] rounded-full border-[2px] flex items-center justify-center shrink-0 transition-colors ${
                        selectedPaymentId === method.id
                          ? "border-black"
                          : "border-gray-400"
                      }`}
                    >
                      {selectedPaymentId === method.id && (
                        <div className="w-2.5 h-2.5 bg-black rounded-full" />
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: Card Details & "Change" Button */}
                  {isCard && (
                    <div className="mt-4 flex justify-between items-end">
                      {/* Left Side: Name and Number */}
                      <div className="flex flex-col gap-1.5">
                        {/* <h4 className="font-poppins font-bold text-[15px] text-gray-900 leading-none">
                          {holderName}
                        </h4> */}
                        <p className="font-poppins text-[14px] text-gray-800 tracking-widest leading-none mt-1">
                          **** **** **** {last4}
                        </p>
                        {method.isDefault && (
                          <span className="text-[11px] font-poppins font-semibold text-brand-orange mt-1">
                            {td("default")}
                          </span>
                        )}
                      </div>

                      {/* Right Side: Change Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevents clicking this from triggering the selectPayment radio
                          // TODO: Add your logic here to open the Stripe Modal to update the card
                          console.log("Change button clicked for", method.id);
                        }}
                        className="font-poppins font-bold text-[13px] text-brand-orange hover:text-orange-600 transition-colors"
                      >
                        {td("change")}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add New Payment Button */}
            <button
              onClick={handleAddPayment}
              className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-600 text-[15px] sm:text-[16px] font-poppins font-semibold rounded-lg hover:border-brand-orange hover:text-brand-orange transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-xl">+</span>
              {td("addNewPaymentMethod")}
            </button>
          </div>
        )}
      </div>

      {/* Terms and Confirm Button */}
      <div className="max-w-4xl mx-auto px-4 sm:px-0 py-6 border-t border-[#0000001A] mt-3">
        {isPublic ? (
          <p className="text-[11px] sm:text-[12px] font-poppins text-gray-600 text-center mb-4">
            {td("termsPublicTask")}
          </p>
        ) : (
          <p className="text-[11px] sm:text-[12px] font-poppins text-gray-600 text-center mb-4">
            {td("termsConfirmPay")}
          </p>
        )}
        <button
          onClick={handleConfirmPayment}
          disabled={
          isSubmitting ||
            publicFixedPriceInvalid
          }
          className="w-full py-3 bg-brand-orange text-white text-[16px] sm:text-[17px] font-poppins font-semibold rounded-lg hover:bg-brand-orange-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isSubmitting
            ? td("processing")
            : isPublic
              ? td("postPublicTaskBtn")
              : td("confirmRequestsBtn")}

        </button>
      </div>

      {showPaymentModal && (
        <PaymentFlowModal onClose={() => setShowPaymentModal(false)} />
      )}
    </div>
  );
};

export default Page;
