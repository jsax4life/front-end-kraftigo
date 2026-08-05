import Image from "next/image";
import Link from "next/link";
import { CircleEllipsis } from "lucide-react";
import { DistanceBadge } from "@/components/ui/DistanceBadge";
import { formatMoney } from "@/utils/currency";

interface JobCardProps {
  id: string;
  title: string;
  location: string;
  bidsCount?: number;
  description: string;
  category: string;
  priceRange: {
    min: number;
    max: number;
  };
  image: string;
  /** When true, hide primary CTA (e.g. already applied on marketplace). */
  hasApplied?: boolean;
  /** When set, primary CTA is "View Kraft" linking here (deep link / share). Ignored if `onViewKraft` is set. */
  viewKraftHref?: string;
  /** When set, "View Kraft" opens this handler instead of navigating (e.g. marketplace detail modal). */
  onViewKraft?: (jobId: string) => void;
  /** When true with `hasApplied`, still show "View Kraft" (e.g. My applications list). */
  forceViewKraft?: boolean;
  /** Replaces default `$min – $max` badge (e.g. marketplace application “Your offer: …”). */
  priceBadgeLabel?: string;
  /** Small line under the title (e.g. status · listing price · date). */
  metaLine?: string;
  /** e.g. "2km away" from API `distanceLabel`. */
  distanceLabel?: string | null;
  /** Optional note under the description (e.g. application message). */
  noteLine?: string;
  onSendOffer?: (jobId: string) => void;
  onBookmark?: (jobId: string) => void;
}

const JobCard = ({
  id,
  title,
  location,
  bidsCount = 0,
  description,
  category,
  priceRange,
  image,
  hasApplied = false,
  viewKraftHref,
  onViewKraft,
  forceViewKraft = false,
  priceBadgeLabel,
  metaLine,
  distanceLabel,
  noteLine,
  onSendOffer,
  onBookmark,
}: JobCardProps) => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      {/* Job Image */}
      <div className="relative w-full h-48 bg-gray-200">
        <Image src={image} alt={title} fill className="object-cover" />
        {/* Price Badge */}
        <div className="absolute top-3 left-3 max-w-[min(100%,18rem)] truncate bg-brand-blue px-3 py-1 text-sm font-medium text-white rounded-full">
          {priceBadgeLabel ?? `${formatMoney(priceRange.min)} - ${formatMoney(priceRange.max)}`}
        </div>
        {/* Bookmark Icon */}
        <button
          onClick={() => onBookmark?.(id)}
          className="absolute top-3 right-3 w-8 h-8  rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <CircleEllipsis size={20} className="text-white" />
        </button>
      </div>

      {/* Job Details */}
      <div className="p-4">
        <h3 className={`text-lg font-bold ${metaLine ? "" : "mb-2"}`}>{title}</h3>
        {metaLine ? (
          <p className="mt-1 mb-2 text-[11px] font-poppins text-gray-600 sm:text-xs">{metaLine}</p>
        ) : null}

        {/* Location and Bids */}
        <div className="flex items-center gap-4 mb-2 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>{location}</span>
          </div>
          {distanceLabel ? (
            <DistanceBadge label={distanceLabel} size="sm" />
          ) : null}
          {bidsCount > 0 && (
            <div className="flex items-center gap-1 text-brand-orange">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>{bidsCount}+ bids</span>
            </div>
          )}
        </div>

        {/* Description */}
        <p className={`text-sm text-gray-600 line-clamp-2 ${noteLine ? "mb-2" : "mb-3"}`}>{description}</p>
        {noteLine ? (
          <p className="mb-3 text-xs font-poppins text-gray-500 line-clamp-2" title={noteLine}>
            Message: {noteLine}
          </p>
        ) : null}

        {/* Category and Action */}
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 bg-[#0000001A] text-gray-700  text-sm font-medium">
            {category}
          </span>
          {hasApplied && !forceViewKraft ? (
            <span className="shrink-0 px-3 py-1.5 text-xs rounded-md font-medium bg-gray-100 text-gray-500 sm:px-8 sm:py-3 sm:text-sm sm:rounded-lg">
              Applied
            </span>
          ) : onViewKraft ? (
            <button
              type="button"
              onClick={() => onViewKraft(id)}
              className="shrink-0 px-3 py-1.5 text-xs font-medium text-white bg-brand-orange rounded-md hover:opacity-90 transition-opacity sm:px-8 sm:py-3 sm:text-sm sm:rounded-lg"
            >
              View Kraft
            </button>
          ) : viewKraftHref ? (
            <Link
              href={viewKraftHref}
              className="inline-block shrink-0 px-3 py-1.5 text-xs font-medium text-white bg-brand-orange rounded-md hover:opacity-90 transition-opacity text-center sm:px-8 sm:py-3 sm:text-sm sm:rounded-lg"
            >
              View Kraft
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => onSendOffer?.(id)}
              className="shrink-0 px-3 py-1.5 text-xs bg-brand-orange text-white rounded-md font-medium hover:opacity-90 transition-opacity sm:px-8 sm:py-3 sm:text-sm sm:rounded-lg"
            >
              Send Offer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobCard;
