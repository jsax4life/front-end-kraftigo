import React from "react";
import Image from "next/image";

interface RequestCardProps {
  id: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  reviewsCount: number;
  offerAmount: number;
  description: string;
  showRenegotiate?: boolean;
  onAccept?: (requestId: string) => void;
  onDecline?: (requestId: string) => void;
  onRenegotiate?: (requestId: string) => void;
}

const RequestCard = ({
  id,
  customerName,
  customerAvatar = "/images/pro.jpg",
  rating,
  reviewsCount,
  offerAmount,
  description,
  showRenegotiate = false,
  onAccept,
  onDecline,
  onRenegotiate,
}: RequestCardProps) => {
  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => (
      <svg
        key={index}
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={index < rating ? "#0000ff" : "#e5e7eb"}
        stroke="none"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ));
  };

  return (
    <div className="bg-white p-2 border-b border-gray-200 pb-8">
      {/* Customer Info */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200">
            <Image
              src={customerAvatar}
              alt={customerName}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h3 className="font-bold text-base">{customerName}</h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">{renderStars()}</div>
              <span className="text-sm text-gray-600">
                ({reviewsCount} Reviews)
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-brand-orange font-bold text-xl">
            ${offerAmount}
          </div>
          <div className="text-gray-500 text-sm">Offer</div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 bg-[#F6F6F6] p-1.5 rounded-lg mb-4 line-clamp-2">
        {description}
      </p>

      {/* Renegotiate Button */}
      {showRenegotiate && (
        <button
          onClick={() => onRenegotiate?.(id)}
          className="w-full text-brand-orange font-medium text-sm mb-3 hover:underline"
        >
          Renegotiate Offer
        </button>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => onDecline?.(id)}
          className="flex-1 py-3 bg-brand-blue text-white rounded-xl  hover:opacity-90 transition-opacity"
        >
          Decline
        </button>
        <button
          onClick={() => onAccept?.(id)}
          className="flex-1 py-3 bg-brand-orange text-white rounded-xl  hover:opacity-90 transition-opacity"
        >
          Accept request
        </button>
      </div>
    </div>
  );
};

export default RequestCard;
