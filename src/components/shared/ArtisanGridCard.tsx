import Image from "next/image";
import { DistanceBadge } from "@/components/ui/DistanceBadge";

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
}

const ArtisanGridCard = ({ artisan, onSelect }: ArtisanGridCardProps) => {
  return (
    <div className="rounded-xl border border-[#E4E7EC] bg-white overflow-hidden hover:border-brand-orange/60 hover:shadow-sm transition-all">
      {/* Profile Image with Badge */}
      <div className="relative">
        <Image
          src={artisan.profileImage || "/images/pro.jpg"}
          alt={artisan.name}
          width={400}
          height={400}
          className="w-full h-48 object-cover"
        />
        {/* Availability Badge */}
        {artisan.isAvailable ? (
          <span className="absolute top-3 left-2 text-[#FF6600] text-[10px] bg-white px-2 py-1 rounded-full font-poppins font-medium flex items-center gap-1">
            Available Now 
            <Image src="/light.svg" alt="light" width={9} height={12} />
          </span>
        ) : (
          <span className="absolute top-3 left-2 text-purple-600 text-[10px] bg-white px-2 py-1 rounded-full font-poppins font-medium">
            Unavailable
          </span>
        )}
      </div>

      {/* Card Content */}
      <div className="p-3">
        <div className="flex items-center gap-1.5 mb-2 min-w-0 flex-nowrap overflow-hidden">
          <h3 className="text-[14px] font-poppins font-semibold text-[#1D2939] truncate min-w-0 shrink">
            {artisan.name}
          </h3>
          {artisan.badge && (
            <span className="shrink-0 whitespace-nowrap text-[9px] font-poppins font-semibold uppercase tracking-wide bg-[#014F2A1A] text-[#014F2A] px-1.5 py-0.5 rounded">
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
        {/* Rating and Reviews */}
        <div className="flex items-center gap-1 mb-1">
          {/* <span className="text-[14px] font-poppins font-semibold">
            {artisan.rating}
          </span> */}
          {/* <Star size={14} className="fill-black text-black -mt-1" />
          <span className="text-[12px] text-gray-600 font-poppins">
            ({artisan.reviewCount})
          </span> */}
          <span className="text-[14px] text-gray-600 font-poppins">
            {artisan.taskCount} Krafts
          </span>
        </div>

        {/* Price */}
        <div className="text-[16px] font-mabry font-semibold mb-3">
          ${artisan.pricePerHour.toFixed(2)}/hr
        </div>
      </div>
    </div>
  );
};

export default ArtisanGridCard;
