import React from "react";
import { DistanceBadge } from "@/components/ui/DistanceBadge";

interface RequestCardProps {
  jobTitle: string;
  description: string;
  proposedPriceLabel: string;
  /** Optional status flag (e.g. `PAYMENT_PENDING` after you accepted, awaiting customer card). */
  statusBadge?: string | null;
  distanceLabel?: string | null;
  onViewRequest: () => void;
}

const RequestCard = ({
  jobTitle,
  description,
  proposedPriceLabel,
  statusBadge,
  distanceLabel,
  onViewRequest,
}: RequestCardProps) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-[#0000001A] shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-poppins font-bold text-[16px] text-gray-900 truncate">
              {jobTitle}
            </h3>
            {statusBadge ? (
              <span className="shrink-0 text-[10px] font-poppins font-semibold uppercase tracking-wide text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                {statusBadge}
              </span>
            ) : null}
          </div>
          {distanceLabel ? (
            <DistanceBadge label={distanceLabel} size="sm" className="mt-1" />
          ) : null}
        </div>
        <div className="text-right shrink-0">
          <div className="text-brand-orange font-bold text-lg font-poppins">
            {proposedPriceLabel}
          </div>
          <div className="text-gray-500 text-xs font-poppins">Offer</div>
        </div>
      </div>

      <p className="text-sm text-gray-600 font-poppins bg-[#F6F6F6] p-2.5 rounded-lg mb-4 line-clamp-3">
        {description}
      </p>

      <button
        type="button"
        onClick={onViewRequest}
        className="w-full py-3 bg-brand-orange text-white rounded-xl font-poppins font-semibold text-[15px] hover:opacity-90 transition-opacity"
      >
        View Request
      </button>
    </div>
  );
};

export default RequestCard;
