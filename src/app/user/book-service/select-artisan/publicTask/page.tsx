"use client";

import { Check } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { MARKETPLACE_FIXED_PRICE_OFFER_MESSAGE } from "@/lib/marketplaceFixedPriceOfferValidation";
import {
  clampDurationHours,
  parseDurationHoursParam,
  validateDurationHours,
} from "@/lib/durationHours";
import { useTranslations } from "next-intl";

function parsePublicOfferAmount(raw: string): number {
  const t = raw.trim().replace(/^[€$]\s?/, "").replace(/,/g, "");
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : NaN;
}

function fixedPriceWhenNegotiationOffError(
  amountRaw: string,
  openToNegotiation: boolean,
): string | null {
  if (openToNegotiation) return null;
  const offer = parsePublicOfferAmount(amountRaw);
  if (Number.isFinite(offer) && offer > 0) return null;
  return MARKETPLACE_FIXED_PRICE_OFFER_MESSAGE;
}

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceName = searchParams.get("category") || searchParams.get("service") || "Service";
  const address =
    searchParams.get("address") || "Your selected location";
  const dateParam = searchParams.get("date") || "";
  const timeParam = searchParams.get("time") || "";

  // Format date for display
  const formattedDate = dateParam
    ? (() => {
        try {
          return new Date(dateParam).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          });
        } catch {
          return dateParam;
        }
      })()
    : "";
  const dateDisplay = [formattedDate, timeParam].filter(Boolean).join(" · ");

  const [formData, setFormData] = useState({
    amount: "",
    offerPricingType: "FLAT" as "FLAT" | "HOURLY",
    durationHours: String(parseDurationHoursParam(searchParams.get("hours"))),
    openToNegotiation: true,
    selectedExpiry: "24h",
    customExpiryDate: "",
    selectedRequirement: "any",
    verifiedOnly: false,
  });
  const [fixedPriceListingError, setFixedPriceListingError] = useState<string | null>(null);

  const t = useTranslations("publicTask");

  const timeSlots = [
    { id: "24h", label: t("expiryOptions.24h") },
    { id: "3days", label: t("expiryOptions.3days") },
    { id: "1week", label: t("expiryOptions.1week") },
    { id: "custom", label: t("expiryOptions.custom") },
  ];

  const requirements = [
    { id: "any", label: t("requirementOptions.any") },
    { id: "3.0+", label: "3.0+" },
    { id: "4.0+", label: "4.0+" },
    { id: "4.5+", label: "4.5+" },
  ];

  const handleNext = () => {
    const parsedOffer = parsePublicOfferAmount(formData.amount);
    if (!Number.isFinite(parsedOffer) || parsedOffer <= 0) {
      setFixedPriceListingError(t("errors.invalidAmount"));
      return;
    }
    const err = fixedPriceWhenNegotiationOffError(formData.amount, formData.openToNegotiation);
    if (err) {
      setFixedPriceListingError(err);
      return;
    }
    if (formData.offerPricingType === "HOURLY") {
      const dur = Number(formData.durationHours);
      const durErr = validateDurationHours(dur);
      if (durErr) {
        setFixedPriceListingError(t("errors.hourlyError", { error: durErr }));
        return;
      }
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("isPublic", "true");
    params.set("budget", String(parsedOffer));
    params.set("offerPricingType", formData.offerPricingType);
    if (formData.offerPricingType === "HOURLY") {
      params.set("hours", String(clampDurationHours(Number(formData.durationHours))));
    } else {
      params.delete("hours");
    }
    params.set("openForNegotiation", String(formData.openToNegotiation));
    params.set("expiryOption", formData.selectedExpiry);
    if (formData.selectedExpiry === "custom" && formData.customExpiryDate.trim()) {
      const d = new Date(formData.customExpiryDate);
      if (!Number.isNaN(d.getTime())) params.set("expiryDate", d.toISOString());
    }
    params.set("krafterRatingRequirement", formData.selectedRequirement);
    params.set("verifiedOnly", String(formData.verifiedOnly));
    router.push(`/user/book-service/verifyDetails?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-white pb-8">
      {/* Header */}
      <div className="bg-[#FFF0F0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-0 py-6 flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="w-9 h-9 bg-brand-orange rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-colors">
              <Check size={20} className="text-white" />
            </span>
            <span className="w-9 h-9 bg-brand-orange rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-colors">
              <Check size={20} className="text-white" />
            </span>
            <span className="w-fit px-3 py-2.5 text-xs sm:text-sm bg-brand-orange text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-colors">
              {t("krafter")}
            </span>
            <span className="w-9 h-9 bg-white font-bold rounded-full text-[#00000066] flex items-center justify-center text-sm">
              4
            </span>
            <span className="w-9 h-9 bg-white font-bold rounded-full text-[#00000066] flex items-center justify-center text-sm">
              5
            </span>
          </div>
          <button
            className="text-brand-orange text-[14px] sm:text-[16px] font-poppins font-semibold"
            onClick={() => router.back()}
          >
            {t("back")}
          </button>
        </div>

        {/* Service Info */}
        <div className="max-w-4xl mx-auto px-4 sm:px-0 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-2">
                {serviceName}
              </h1>
              <p className="text-[13px] sm:text-[14px] text-gray-700 font-poppins">
                {address}
              </p>
              <p className="text-[13px] sm:text-[14px] text-gray-700 font-poppins">
                {dateDisplay}
              </p>
            </div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#FFF4E6] rounded-lg flex items-center justify-center">
              <Image
                src="/card.svg"
                alt="service"
                width={40}
                height={40}
                className="w-10 h-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Budget Section */}
      <div className="max-w-4xl mx-auto ">
        <div className="p-4 sm:p-5 border-b border-[#0000001A]">
          <h2 className="text-[20px] sm:text-[22px] font-poppins font-semibold mb-3">
            {t("budget")}
          </h2>
          <span className="text-[14px] sm:text-[15px] font-poppins text-gray-800 block mb-2">
            {t("offerPricingType")}
          </span>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
            {(["FLAT", "HOURLY"] as const).map((typeKey) => (
              <button
                key={typeKey}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    offerPricingType: typeKey,
                  }))
                }
                className={`py-3 rounded-xl text-[13px] sm:text-[14px] font-poppins font-medium transition-colors border ${
                  formData.offerPricingType === typeKey
                    ? "text-brand-orange border-brand-orange bg-[#FF66001A]"
                    : "bg-[#F6F6F6] text-gray-800 border-transparent hover:bg-gray-100"
                }`}
              >
                {t(`pricingType.${typeKey}`)}
              </button>
            ))}
          </div>
          <span className="text-[14px] sm:text-[15px] font-poppins text-gray-800 block mb-2">
            {t("offerAmount")}
          </span>
          <Input
            placeholder="€ 0.00"
            value={formData.amount}
            onChange={(value) => {
              setFormData({ ...formData, amount: value });
              if (
                fixedPriceListingError &&
                fixedPriceWhenNegotiationOffError(value, formData.openToNegotiation) === null
              ) {
                setFixedPriceListingError(null);
              }
            }}
            onBlur={() =>
              setFixedPriceListingError(
                fixedPriceWhenNegotiationOffError(formData.amount, formData.openToNegotiation),
              )
            }
            className="mb-4"
          />
          {formData.offerPricingType === "HOURLY" && (
            <>
              <span className="text-[14px] sm:text-[15px] font-poppins text-gray-800 block mb-2">
                {t("estimatedDuration")}
              </span>
              <Input
                placeholder={t("durationPlaceholder")}
                value={formData.durationHours}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    durationHours: value,
                  }))
                }
                className="mb-4"
              />
            </>
          )}

          {/* Open to Negotiation Toggle */}
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-1 px-1">
              <Image src="/neg.svg" alt="icon" width={18} height={18} />
              <span className="text-[14px] sm:text-[15px] font-poppins font-semibold text-gray-800">
                {t("openToNegotiation")}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextOpen = !formData.openToNegotiation;
                setFormData({
                  ...formData,
                  openToNegotiation: nextOpen,
                });
                if (!nextOpen) {
                  setFixedPriceListingError(
                    fixedPriceWhenNegotiationOffError(formData.amount, false),
                  );
                } else {
                  setFixedPriceListingError(null);
                }
              }}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                formData.openToNegotiation ? "bg-brand-orange" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  formData.openToNegotiation ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          {fixedPriceListingError ? (
            <p
              className="text-[12px] font-poppins text-red-600 -mt-1 pb-1"
              role="alert"
            >
              {fixedPriceListingError}
            </p>
          ) : null}
        </div>

        {/* Kraft Expiry */}
        <div className="p-4 sm:p-5 border-b border-[#0000001A]">
          <h2 className="text-[20px] sm:text-[22px] font-poppins font-semibold mb-3 pt-2">
            {t("kraftExpiry")}
          </h2>
          <div className="grid grid-cols-4 gap-2 sm:gap-3 pb-3">
            {timeSlots.map((time) => (
              <button
                key={time.id}
                type="button"
                onClick={() =>
                  setFormData({ ...formData, selectedExpiry: time.id })
                }
                className={`py-3 rounded-xl text-[13px] sm:text-[14px] font-poppins font-medium transition-colors border ${
                  formData.selectedExpiry === time.id
                    ? "text-brand-orange border-brand-orange bg-[#FF66001A]"
                    : "bg-[#F6F6F6] text-gray-800 border-transparent hover:bg-gray-100"
                }`}
              >
                {time.label}
              </button>
            ))}
          </div>
          {formData.selectedExpiry === "custom" && (
            <label className="block pt-2 pb-1">
              <span className="text-[12px] font-poppins text-gray-600 mb-1 block">
                {t("expiresOn")}
              </span>
              <input
                type="datetime-local"
                value={formData.customExpiryDate}
                onChange={(e) =>
                  setFormData({ ...formData, customExpiryDate: e.target.value })
                }
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[14px] font-poppins"
              />
            </label>
          )}
        </div>

        {/* Krafter Requirement */}
        <div className="p-4 sm:p-5 border-b border-[#0000001A]">
          <h2 className="text-[20px] sm:text-[22px] font-poppins font-semibold mb-3 pt-3">
            {t("krafterRequirement")}
          </h2>
          <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4">
            {requirements.map((req) => (
              <button
                key={req.id}
                onClick={() =>
                  setFormData({ ...formData, selectedRequirement: req.id })
                }
                className={`py-3 rounded-xl text-[13px] sm:text-[14px] font-poppins font-medium transition-colors border ${
                  formData.selectedRequirement === req.id
                    ? "text-brand-orange border-brand-orange bg-[#FF66001A]"
                    : "bg-[#F6F6F6] text-gray-800 border-transparent hover:bg-gray-100"
                }`}
              >
                {req.label}
              </button>
            ))}
          </div>

          {/* Verified Only Toggle */}
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center gap-1 ">
              <Image src="/verified.svg" alt="icon" width={22} height={22} />
              <span className="text-[14px] sm:text-[15px] font-poppins font-semibold text-gray-800">
                {t("verifiedOnly")}
              </span>
            </div>
            <button
              onClick={() =>
                setFormData({
                  ...formData,
                  verifiedOnly: !formData.verifiedOnly,
                })
              }
              className={`relative w-12 h-6 rounded-full transition-colors ${
                formData.verifiedOnly ? "bg-brand-orange" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  formData.verifiedOnly ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="p-4 sm:p-5">
        <div className="max-w-4xl mx-auto pt-15">
          <Button
            variant="primary"
            fullWidth
            onClick={handleNext}
            className="text-[16px] sm:text-[17px]"
          >
            {t("reviewAndPost")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Page;
