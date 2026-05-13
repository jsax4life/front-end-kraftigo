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
import {
  clampDurationHours,
  parseDurationHoursParam,
} from "@/lib/durationHours";

/** Last resort when no coordinates from the booking URL chain or address store */
const FALLBACK_LAT = 52.52;
const FALLBACK_LNG = 13.4;

function resolveBookingCoordinates(
  searchParams: URLSearchParams,
  storeLat: number | null,
  storeLng: number | null,
): { latitude: number; longitude: number } {
  const qLat = parseFloat(searchParams.get("latitude") || "");
  const qLng = parseFloat(searchParams.get("longitude") || "");
  if (Number.isFinite(qLat) && Number.isFinite(qLng)) {
    return { latitude: qLat, longitude: qLng };
  }
  if (
    storeLat != null &&
    storeLng != null &&
    Number.isFinite(storeLat) &&
    Number.isFinite(storeLng)
  ) {
    return { latitude: storeLat, longitude: storeLng };
  }
  return { latitude: FALLBACK_LAT, longitude: FALLBACK_LNG };
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

      const { latitude, longitude } = resolveBookingCoordinates(
        searchParams,
        currentLatitude,
        currentLongitude,
      );
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

      // Construct payload for API in the format backend expects
      const basePayload = {
        serviceCategoryId: searchParams.get("categoryId") || "",
        jobTitle,
        jobDescription: taskDetails,
        consentAcknowledged: true,
        address: address,
        latitude: latitude,
        longitude: longitude,
        preferredDate: new Date(date).toISOString().split("T")[0], // YYYY-MM-DD format
        preferredTime: formattedTime, // HH:mm format
        ...(artisanId && !isPublic ? { artisanId } : {}),
        ...(!isPublic ? { proposedPrice: hourlyRate * durationHours } : {}),
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
            "Missing booking reference. Please return to task details and go through the steps again.",
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
          ? "Public task posted successfully!"
          : artisanId
            ? "Request sent. Your Krafter will need to accept before the booking is confirmed."
            : "Booking confirmed successfully!",
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
        toast.error("Please log in to create a booking");
        router.push("/user/login");
      } else if (isSavedPaymentMethodRequiredError(err)) {
        toast.error(SAVED_PAYMENT_METHOD_REQUIRED_TOAST, { duration: 6500 });
        setShowPaymentModal(true);
      } else {
        toast.error(
          bookingApiErrorUserMessage(
            err,
            "Failed to create booking. Please try again.",
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
        <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-8 py-6 flex items-center justify-between">
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
              {isPublic ? "Details" : "Finish"}
            </span>
          </div>
          <button
            className="text-brand-orange text-[14px] sm:text-[16px] font-poppins font-semibold"
            onClick={() => router.back()}
          >
            Back
          </button>
        </div>
        <h2 className="text-[18px] sm:text-[20px] font-poppins font-semibold px-4 sm:px-8 lg:px-8 max-w-4xl mx-auto">
          {isPublic
            ? "Post Your Task"
            : hasPaymentMethods()
              ? "Complete Order"
              : "Verify Your Details"}
        </h2>
      </div>

      {/* Service Info */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
                Budget: ${budget}{isPublicHourly ? "/hr" : ""}
              </span>
            ) : (
              <>
                <span className="text-brand-orange text-[16px] sm:text-[18px] font-poppins font-bold">
                  ${hourlyRate.toFixed(2)}/hr
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 border-t border-[#0000001A]">
        <h3 className="text-[18px] sm:text-[20px] font-poppins font-semibold mb-4">
          Price Breakdown
        </h3>
        <div className="space-y-3">
          {isPublic ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[13px] sm:text-[14px] font-poppins text-gray-700">
                  {isPublicHourly ? "Your offer rate" : "Your offer budget"} (${Number(budget || 0)}{isPublicHourly ? "/hr" : ""} * {durationHoursDisplay % 1 === 0
                        ? durationHoursDisplay
                        : durationHoursDisplay.toFixed(2)} )
                </span>
                <span className="text-[14px] sm:text-[15px] font-poppins font-semibold text-gray-900">
                  ${estimatedLaborSubtotal.toFixed(2)}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[13px] sm:text-[14px] font-poppins text-gray-700">
                  Hourly rate (€{hourlyRate.toFixed(2)}/hr  * {durationHoursDisplay % 1 === 0
                    ? durationHoursDisplay
                    : durationHoursDisplay.toFixed(2)} hours)
                </span>
                <span className="text-[14px] sm:text-[15px] font-poppins font-semibold text-gray-900">
                  €{estimatedLaborSubtotal.toFixed(2)}
                </span>
              </div>
              
            </>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[13px] sm:text-[14px] font-poppins text-gray-700">
              {isPublic ? "Service fee" : "Service fee (estimate)"}
            </span>
            <span className="text-[14px] sm:text-[15px] font-poppins font-semibold text-gray-900">
              €{serviceFee.toFixed(2)}
            </span>
          </div>
          <div className="pt-3 border-t border-[#0000001A] flex items-center justify-between">
            <span className="text-[15px] sm:text-[16px] font-poppins font-bold text-gray-900">
              {isPublic ? "Total Amount" : "Total (estimate)"}
            </span>
            <span className="text-[16px] sm:text-[18px] font-poppins font-bold text-gray-900">
              €{totalAmount.toFixed(2)}
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8">
        <div className="flex items-center gap-1 relative">
          <Input
            placeholder="Promo Code"
            value={promoCode}
            onChange={setPromoCode}
            className="flex-1"
          />
          <button className="absolute right-2 top-1/2 mt-1 transform -translate-y-1/2 px-6 py-2 bg-[#FFE5D9] text-brand-orange text-[14px] sm:text-[15px] font-poppins font-semibold rounded-lg hover:bg-[#FFD5C2] transition-colors">
            Apply
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-[#0000001A]">
        <h3 className="text-[18px] sm:text-[20px] font-poppins font-semibold mb-4">
          Payment Options
        </h3>

        {!hasPaymentMethods() ? (
          // No Payment Methods State
          <div className="space-y-4 py-5">
            <p className="text-[13px] sm:text-[14px] font-poppins text-gray-500 text-center py-4">
              You do not have any saved payment methods
            </p>
            <button
              onClick={handleAddPayment}
              className="w-full py-3 bg-blue-600 text-white text-[15px] sm:text-[16px] font-poppins font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-xl">+</span>
              add new
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
              let methodTitle = "Debit/Credit Card";
              if (!isCard) {
                if (method.type === "sepa_debit")
                  methodTitle = "SEPA Direct Debit";
                else if (method.type === "paypal") methodTitle = "PayPal";
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
                            Default
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
                        Change
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
              Add new payment method
            </button>
          </div>
        )}
      </div>

      {/* Terms and Confirm Button */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-[#0000001A] mt-3">
        {isPublic ? (
          <p className="text-[11px] sm:text-[12px] font-poppins text-gray-600 text-center mb-4">
            By clicking &apos;Post Public Task&apos;, you agree to Kraftigos
            Terms of Service and Privacy Policy. Taskers will reply with offers
            based on your budget.
          </p>
        ) : (
          <p className="text-[11px] sm:text-[12px] font-poppins text-gray-600 text-center mb-4">
            By Clicking &apos;Confirm & Pay&apos;, you agree to Kraftigos Terms
            of Service and Privacy Policy. Payments are processed securely.
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
            ? "Processing..."
            : isPublic
              ? "Post Public Task"
              : `Confirm Requests`}

        </button>
      </div>

      {showPaymentModal && (
        <PaymentFlowModal onClose={() => setShowPaymentModal(false)} />
      )}
    </div>
  );
};

export default Page;
