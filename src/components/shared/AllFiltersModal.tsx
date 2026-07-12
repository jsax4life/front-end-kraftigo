"use client";

import { X } from "lucide-react";
import PriceFilterDropdown from "./PriceFilterDropdown";
import RatingFilterDropdown from "./RatingFilterDropdown";
import AvailabilityFilterDropdown from "./AvailabilityFilterDropdown";

interface AllFiltersModalProps {
  onClose: () => void;
  onApplyPrice?: (min: number, max: number) => void;
  onApplyRating?: (rating: number) => void;
  onApplyAvailability?: (avail: string) => void;
}

export default function AllFiltersModal({
  onClose,
  onApplyPrice,
  onApplyRating,
  onApplyAvailability
}: AllFiltersModalProps) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed bottom-0 md:absolute md:top-[65px] left-0 md:left-auto right-0 md:right-0 md:bottom-auto z-50 bg-white max-h-[95vh] md:max-h-[80vh] w-full max-w-4xl md:max-w-[420px] flex flex-col shadow-2xl rounded-t-[32px] md:rounded-[24px] md:border md:border-[#0000001A] overflow-hidden">
        
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0 md:hidden">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Close button */}
        <div className="flex justify-end px-5 pt-2 shrink-0">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X size={16} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 pb-8 pt-2">
          <div className="flex flex-col gap-10">
            <PriceFilterDropdown inline onApply={onApplyPrice} />
            <RatingFilterDropdown inline onApply={onApplyRating} />
            <AvailabilityFilterDropdown inline onApply={onApplyAvailability} />
          </div>
        </div>
      </div>
    </>
  );
}
