import Image from "next/image";
import { CircleEllipsis } from "lucide-react";

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
  onSendOffer,
  onBookmark,
}: JobCardProps) => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      {/* Job Image */}
      <div className="relative w-full h-48 bg-gray-200">
        <Image src={image} alt={title} fill className="object-cover" />
        {/* Price Badge */}
        <div className="absolute top-3 left-3 bg-brand-blue text-white px-3 py-1 rounded-full text-sm font-medium">
          ${priceRange.min} - ${priceRange.max}
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
        <h3 className="text-lg font-bold mb-2">{title}</h3>

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
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{description}</p>

        {/* Category and Action */}
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 bg-[#0000001A] text-gray-700  text-sm font-medium">
            {category}
          </span>
          <button
            onClick={() => onSendOffer?.(id)}
            className="px-8 py-3 bg-brand-orange text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Send Offer
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
