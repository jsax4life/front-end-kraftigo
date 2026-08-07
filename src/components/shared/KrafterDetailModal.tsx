"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { X, Star } from "lucide-react";
import toast from "react-hot-toast";
import { formatDistanceDisplay, readDistanceFields } from "@/utils/distance";
import {
  formatOfferingRate,
  type KrafterBookableOffering,
} from "@/lib/krafterDetailDisplay";
import { formatHourlyRate } from "@/utils/currency";
import { DistanceBadge } from "@/components/ui/DistanceBadge";

export interface KrafterDetail {
  id: string;
  name: string;
  profileImage: string;
  badge?: string | null;
  rating: number;
  reviewCount: number;
  taskCount: number;
  description: string;
  location: string;
  distance?: number | null;
  distanceLabel?: string | null;
  pricePerHour: number;
  isAvailable?: boolean;
  bio?: string;
  uniqueSellingPoint?: string;
  occupationDescription?: string;
  languagesSpoken?: string[];
  address?: string;
  skillTags?: string[];
  portfolioImages?: string[];
  responseRate?: number | null;
  averageResponseHours?: number | null;
  yearsWithUs?: number;
  reviews?: string[];
  serviceOfferings?: KrafterBookableOffering[];
}

interface KrafterDetailModalProps {
  krafter: KrafterDetail;
  onClose: () => void;
  /** Selected bookable service is required when the Krafter has offerings. */
  onSelect: (id: string, offering?: KrafterBookableOffering) => void;
  /** Pre-select a service (e.g. current booking category on select-artisan). */
  preselectedCategoryId?: string;
  /** Home / direct book flows must pick a service before booking. */
  requireServiceSelection?: boolean;
  isLoadingProfile?: boolean;
}

const KrafterDetailModal = ({
  krafter,
  onClose,
  onSelect,
  preselectedCategoryId,
  requireServiceSelection = false,
  isLoadingProfile = false,
}: KrafterDetailModalProps) => {
  const distanceText = formatDistanceDisplay(readDistanceFields(krafter));
  const offerings = krafter.serviceOfferings ?? [];
  const requiresOffering = requireServiceSelection || offerings.length > 0;

  const defaultOfferingId = useMemo(() => {
    if (offerings.length === 0) return "";
    if (preselectedCategoryId) {
      const match = offerings.find(
        (o) => o.serviceCategoryId === preselectedCategoryId,
      );
      if (match) return match.serviceCategoryId;
    }
    return offerings.length === 1 ? offerings[0].serviceCategoryId : "";
  }, [offerings, preselectedCategoryId]);

  const [selectedOfferingId, setSelectedOfferingId] = useState(defaultOfferingId);

  useEffect(() => {
    setSelectedOfferingId(defaultOfferingId);
  }, [defaultOfferingId, krafter.id]);

  const selectedOffering = offerings.find(
    (o) => o.serviceCategoryId === selectedOfferingId,
  );

  const displaySkills =
    krafter.skillTags && krafter.skillTags.length > 0
      ? krafter.skillTags
      : offerings.map((o) => o.serviceCategoryName);

  const displayPrice = selectedOffering
    ? formatOfferingRate(selectedOffering)
    : krafter.pricePerHour > 0
      ? formatHourlyRate(krafter.pricePerHour)
      : "Rate on request";

  const handleBook = () => {
    if (isLoadingProfile) {
      toast.error("Still loading this Krafter's services. Please wait.");
      return;
    }
    if (requiresOffering && !selectedOffering) {
      toast.error("Select a service before booking this Krafter.");
      return;
    }
    if (requireServiceSelection && !selectedOffering) {
      toast.error("Select a service before booking this Krafter.");
      return;
    }
    onSelect(krafter.id, selectedOffering);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />

      <div className="fixed bottom-0 md:bottom-auto md:top-1/2 left-0 md:left-1/2 right-0 md:right-auto md:-translate-x-1/2 md:-translate-y-1/2 mx-auto z-50 bg-white max-h-[100vh] md:h-[90vh] md:max-h-[90vh] w-full max-w-4xl md:max-w-[600px] flex flex-col shadow-2xl md:rounded-[32px] overflow-hidden">
        <div className="flex justify-center pt-3 pb-1 shrink-0 md:hidden">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="flex justify-end px-6 pt-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <X size={16} className="text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-40 px-5">
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-[24px] font-poppins font-bold text-gray-900">
              {krafter.name}
            </h2>
            {distanceText && (
              <DistanceBadge label={distanceText} size="sm" align="center" />
            )}
            <div className="flex justify-center items-center gap-4 relative">
              <Image
                src={krafter.profileImage || "/images/pro.jpg"}
                alt={krafter.name}
                width={150}
                height={150}
                className="w-35 h-35 rounded-2xl object-cover"
              />
              {krafter.isAvailable && (
                <Image
                  src="/active.svg"
                  alt="active"
                  width={43}
                  height={51}
                  className="absolute -bottom-5.5 -right-6"
                />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between relative mb-5 mt-6 py-3">
            <div className="flex-1 text-center">
              <p className="text-[20px] font-mabry font-bold text-gray-900">
                {krafter.reviewCount}
              </p>
              <p className="text-[14px] font-poppins mt-0.5">Reviews</p>
            </div>
            <div className="w-[3px] h-10 bg-[#D9D9D9] rounded-full" />
            <div className="flex-1 text-center">
              <p className="text-[20px] font-mabry font-bold text-gray-900">
                {krafter.rating > 0 ? krafter.rating.toFixed(1) : "—"}
              </p>
              <p className="text-[14px] font-poppins mt-0.5">Rating</p>
            </div>
            <div className="w-[3px] h-10 bg-[#D9D9D9] rounded-full" />
            <div className="flex-1 text-center">
              <p className="text-[20px] font-mabry font-bold text-gray-900">
                {krafter.yearsWithUs != null ? krafter.yearsWithUs : "—"}
              </p>
              <p className="text-[14px] font-poppins mt-0.5">Krafting</p>
            </div>
          </div>

          {(krafter.bio || krafter.description) && (
            <div className="mb-5 bg-[#F6F6F6] rounded-[8px] py-2 px-3">
              <p className="text-[14px] font-poppins leading-relaxed">
                {krafter.bio || krafter.description}
              </p>
            </div>
          )}

          <div>
            <p className="font-poppins font-bold text-center">Krafter details</p>
            <div>
              <div className="flex items-center gap-1 mt-2">
                <p className="font-poppins text-[16px]">No of Krafts done:</p>
                <p className="font-poppins text-[16px]">{krafter.taskCount}</p>
              </div>
              <div className="flex items-center gap-1">
                <p className="font-poppins text-[16px]">Response rate:</p>
                <p className="font-poppins text-[16px]">
                  {krafter.responseRate != null ? `${krafter.responseRate}%` : "0%"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <p className="font-poppins text-[16px]">Responds within </p>
                <p className="font-poppins text-[16px]">
                  {krafter.averageResponseHours != null
                    ? `<${krafter.averageResponseHours}hours`
                    : "an hour"}
                </p>
              </div>
            </div>
            <div className="mt-8 space-y-3">
              <span className="flex items-center gap-2">
                <Image src="/work.svg" alt="icon" width={22} height={22} />
                My Work: {krafter.occupationDescription || "—"}
              </span>
              <span className="flex items-center gap-2">
                <Image src="/speaks.svg" alt="icon" width={22} height={22} />
                Speaks: {krafter.languagesSpoken?.join(" and ") || "—"}
              </span>
              <span className="flex items-center gap-2">
                <Image src="/lives.svg" alt="icon" width={22} height={22} />
                Lives in: {krafter.address || krafter.location || "—"}
              </span>
              <span className="flex items-center gap-2">
                <Image src="/unique.svg" alt="icon" width={22} height={22} />
                What makes me unique: {krafter.uniqueSellingPoint || "—"}
              </span>
            </div>
          </div>

          {krafter.portfolioImages && krafter.portfolioImages.length > 0 && (
            <div className="mb-5">
              <h3 className="text-[16px] font-poppins font-semibold text-center mb-2 mt-10">
                Images
              </h3>
              <div className="grid grid-cols-3 gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {krafter.portfolioImages.map((img, i) => (
                  <div
                    key={i}
                    className="relative w-27 h-27 shrink-0 rounded-xl overflow-hidden bg-gray-100"
                  >
                    <Image src={img} alt={`Portfolio ${i + 1}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {displaySkills.length > 0 && (
            <div className="mb-10 mt-10">
              <h3 className="text-[16px] font-poppins font-bold text-center mb-2">
                Skills & Expertise
              </h3>
              <div className="flex flex-wrap gap-2">
                {displaySkills.map((skill) => (
                  <span
                    key={skill}
                    className="text-[12px] font-poppins border border-[#FF6600] text-[#FF6600] bg-[#FF66001A] rounded-full px-5 py-3"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(requiresOffering || isLoadingProfile) && (
            <div className="mb-6">
              <h3 className="text-[16px] font-poppins font-bold text-center mb-3">
                Select a service to book
              </h3>
              {isLoadingProfile && offerings.length === 0 ? (
                <p className="text-center text-[14px] font-poppins text-gray-500 py-4">
                  Loading services…
                </p>
              ) : null}
              {!isLoadingProfile && requireServiceSelection && offerings.length === 0 ? (
                <p className="text-center text-[14px] font-poppins text-gray-500 py-4">
                  {displaySkills.length > 0
                    ? "We couldn't match this Krafter's skills to bookable services. Try again later or pick another Krafter."
                    : "No bookable services found for this Krafter in your area."}
                </p>
              ) : null}
              <div className="space-y-2">
                {offerings.map((offering) => {
                  const selected = offering.serviceCategoryId === selectedOfferingId;
                  return (
                    <button
                      key={offering.serviceCategoryId}
                      type="button"
                      onClick={() => setSelectedOfferingId(offering.serviceCategoryId)}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition-colors cursor-pointer ${
                        selected
                          ? "border-[#FF6600] bg-[#FF66000D]"
                          : "border-[#0000001A] bg-white hover:border-[#FF6600]/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-poppins text-[14px] font-semibold text-gray-900">
                            {offering.serviceCategoryName}
                          </p>
                          {offering.experienceYears != null && offering.experienceYears > 0 ? (
                            <p className="font-poppins text-[12px] text-gray-500 mt-0.5">
                              {offering.experienceYears} yrs experience
                            </p>
                          ) : null}
                        </div>
                        <p className="font-mabry text-[15px] font-bold text-[#FF6600] shrink-0">
                          {formatOfferingRate(offering)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#0000001A] px-5 py-4">
          <div className="flex my-5 justify-between items-center gap-4">
            <div>
              <p className="text-[22px] font-mabry font-bold text-gray-900">{displayPrice}</p>
              {selectedOffering && selectedOffering.pricingType === "HOURLY" ? (
                <p className="text-[12px] font-poppins text-gray-500">Hourly rate</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handleBook}
              disabled={
                isLoadingProfile ||
                (requiresOffering && !selectedOffering) ||
                (requireServiceSelection && offerings.length === 0)
              }
              className="w-[200px] h-12 bg-brand-orange text-white text-[15px] font-poppins font-semibold rounded-lg hover:bg-orange-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Book Krafter
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default KrafterDetailModal;
