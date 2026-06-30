import Image from "next/image";
import { DistanceBadge } from "@/components/ui/DistanceBadge";

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
    distanceLabel?: string | null;
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
      className="rounded-xl border border-[#E4E7EC] bg-white p-4 sm:p-5 cursor-pointer transition-all hover:border-brand-orange/60 hover:shadow-sm hover:bg-[#FFFBF8] active:scale-[0.995] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50 focus-visible:ring-offset-2"
    >
      <div className="flex gap-3 sm:gap-4">
        <div className="relative shrink-0">
          <Image
            src={artisan.profileImage || "/images/pro.jpg"}
            alt={artisan.name}
            width={80}
            height={80}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border border-[#F2F4F7]"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-nowrap overflow-hidden">
              <h3 className="text-[16px] sm:text-[17px] font-gerat font-bold text-[#1D2939] truncate min-w-0 shrink">
                {artisan.name}
              </h3>
              {artisan.badge && (
                <span className="shrink-0 whitespace-nowrap text-[10px] font-poppins font-semibold uppercase tracking-wide bg-[#014F2A1A] text-[#014F2A] px-2 py-0.5 rounded">
                  {artisan.badge.replace(/_/g, " ")}
                </span>
              )}
              <DistanceBadge
                size="xs"
                className="shrink-0"
                sources={[
                  { distanceKm: artisan.distance, distanceLabel: artisan.distanceLabel },
                ]}
              />
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[12px] text-gray-600 font-poppins">
                {artisan.taskCount} Krafts
              </span>
            </div>
            <span className="inline-flex w-fit items-center gap-2 text-[#FF6600] text-xs bg-[#FF66001A] px-2 py-1 rounded-full mt-1.5">
              {artisan.isAvailable ? "Available Now" : "Not Available"}
              <Image src="/light.svg" alt="light" width={9} height={12} />
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-[#F2F4F7]">
        <p className="text-[15px] sm:text-[13px] text-gray-700 font-poppins mb-3 line-clamp-2">
          {artisan.description}
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
