import Image from "next/image";
import { formatDistanceDisplay, readDistanceFields } from "@/utils/distance";
import { formatHourlyRate } from "@/utils/currency";

interface ArtisanGridCardProps {
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
  onSelect: (id: string) => void;
  onViewProfile?: (id: string) => void;
}

const ArtisanGridCard = ({ artisan, onSelect, onViewProfile }: ArtisanGridCardProps) => {
  return (
    <div className="rounded-[20px] bg-[#F9FAFB] p-4 transition-all hover:shadow-sm flex flex-col gap-4 w-full relative group">
      {/* Top Section */}
      <div className="flex flex-row gap-3 w-full">
        {/* Image Section */}
        <div className="shrink-0">
          <Image
            src={artisan.profileImage || "/images/pro.jpg"}
            alt={artisan.name}
            width={80}
            height={80}
            className="w-[80px] h-[80px] rounded-[12px] object-cover border border-[#0000001A]"
          />
        </div>

        {/* Content Section (Right of Image) */}
        <div className="flex flex-col flex-1 min-w-0 justify-start">
          {/* Top Row: Name, Badge, Distance */}
          <div className="flex items-start justify-between gap-2 w-full">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[14px] font-poppins font-bold text-[#2F2C2C]">
                {artisan.name}
              </h3>
              {artisan.badge && (
                <span className="bg-[#E2EBE5] text-[#014F2A] px-2 py-0.5 rounded text-[10px] font-poppins font-semibold">
                  {artisan.badge.replace(/_/g, " ")}
                </span>
              )}
            </div>
            <div className="text-[12px] font-poppins text-[#2F2C2C] min-w-0 max-w-[48%] text-right whitespace-normal break-words leading-snug">
              {formatDistanceDisplay(
                readDistanceFields({
                  distanceKm: artisan.distance,
                  distanceLabel: artisan.distanceLabel,
                }),
              ) ?? ""}
            </div>
          </div>

          {/* Second Row: Stars, Reviews, Krafts */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {/* <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4].map((s) => (
                <svg key={s} width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-blue-600">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              ))}
            </div> */}
            {/* <span className="text-[12px] font-poppins text-[#2F2C2C]">
              ({artisan.reviewCount || 23})
            </span> */}
            <span className="text-[12px] font-poppins text-[#2F2C2C]">
              {artisan.taskCount ?? 0} Krafts
            </span>
          </div>

          {/* Third Row: Available Badge */}
          <div className="">
            <span className="inline-flex w-fit items-center gap-1 text-[#FB5D00] text-[10px] font-poppins font-medium bg-[#FFF0E5] px-2 py-0.5 rounded-md">
              {artisan.isAvailable ? "Available Now" : "Available"}
              <Image src="/light.svg" alt="light" width={6} height={9} className="mt-0.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="mt-auto flex items-center justify-between w-full gap-2">
        <div className="text-[18px] sm:text-[20px] font-mabry font-bold text-[#2F2C2C] shrink-0">
          {formatHourlyRate(artisan.pricePerHour)}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewProfile?.(artisan.id);
          }}
          className="flex-1 max-w-[140px] bg-[#FB5D00] text-white py-2 rounded-lg font-poppins font-semibold text-[13px] hover:bg-[#e55500] transition-colors text-center shrink-0"
        >
          View profile
        </button>
      </div>
    </div>
  );
};

export default ArtisanGridCard;
