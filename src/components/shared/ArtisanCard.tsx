import Image from "next/image";
import { ChevronRight } from "lucide-react";

interface ArtisanCardProps {
  artisan: {
    id: string;
    name: string;
    profileImage: string;
    badge?: string | null;
    rating: number;
    reviewCount: number;
    taskCount: number;
    location: string;
    description: string;
    distance?: number | null;
    pricePerHour: number;
    isNewTasker?: boolean;
    isAvailable?: boolean;
  };
  index: number;
  onSelect: (id: string) => void;
  onChat?: (id: string) => void;
  onViewProfile?: (id: string) => void;
}

const ArtisanCard = ({ artisan, onSelect, onViewProfile }: ArtisanCardProps) => {
  const openProfile = () => onViewProfile?.(artisan.id);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openProfile}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openProfile();
        }
      }}
      className="px-3 bg-white cursor-pointer transition-all hover:border-brand-orange hover:shadow-md hover:bg-[#FFFBF8] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50 focus-visible:ring-offset-2 flex flex-col h-full"
    >
      <div className="flex gap-3 sm:gap-4">
        <div className="relative shrink-0">
          <Image
            src={artisan.profileImage || "/images/pro.jpg"}
            alt={artisan.name}
            width={80}
            height={80}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                <h3 className="text-[16px] sm:text-[18px] font-gerat font-bold">
                  {artisan.name}
                </h3>
                {artisan.badge && (
                  <span className="text-[10px] font-poppins bg-[#014F2A1A] text-[#014F2A] px-2 py-0.5">
                    {artisan.badge.replace(/_/g, " ")}
                  </span>
                )}
                {artisan.distance != null && (
                  <span className="inline-block text-[12px] font-poppins text-gray-400">
                    {typeof artisan.distance === "number" ? artisan.distance.toFixed(1) : artisan.distance}km away
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[12px] text-gray-600 font-poppins">
                  {artisan.taskCount} Krafts
                </span>
              </div>
              <span className="flex w-fit items-center gap-2 text-[#FF6600] text-xs bg-[#FF66001A] px-2 py-1 rounded-full">
                {artisan.isAvailable ? "Available Now" : "Not Available"}
                <Image src="/light.svg" alt="light" width={9} height={12} />
              </span>
            </div>
            {/* <div className="flex flex-col items-center gap-0.5 shrink-0 text-brand-orange pt-0.5">
              <ChevronRight size={22} strokeWidth={2.5} aria-hidden />
              <span className="text-[10px] font-poppins font-semibold whitespace-nowrap">
                View profile
              </span>
            </div> */}
          </div>
        </div>
      </div>

      <div className="mt-auto pt-3 flex flex-col justify-end">
        <p className="text-[15px] sm:text-[13px] text-gray-700 font-poppins mb-3 line-clamp-2 min-h-[44px] sm:min-h-[39px]">
          {artisan.description || " "}
        </p>

        <div className="flex items-end justify-between gap-3">
          <p className="text-[24px] sm:text-[20px] font-mabry font-semibold">
            €{artisan.pricePerHour.toFixed(2)}{" "}
            <span className="text-[24px] font-normal text-gray-500">/hr</span>
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(artisan.id);
            }}
            className="py-4 px-14 bg-brand-orange text-white text-[14px] font-poppins font-semibold rounded-xl hover:bg-orange-600 transition-colors shrink-0"
          >
            Select
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArtisanCard;
