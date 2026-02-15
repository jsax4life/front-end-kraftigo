import Image from "next/image";
import { Star } from "lucide-react";
import Button from "@/componets/ui/button";

interface ArtisanGridCardProps {
  artisan: {
    id: number;
    name: string;
    profileImage: string;
    badge?: "TOP PRO" | "ELITE" | null;
    rating: number;
    reviewCount: number;
    taskCount: number;
    location: string;
    description: string;
    pricePerHour: number;
    isNewTasker?: boolean;
  };
  onSelect: (id: number) => void;
}

const ArtisanGridCard = ({ artisan, onSelect }: ArtisanGridCardProps) => {
  return (
    <div className="bg-white">
      {/* Profile Image with Badge */}
      <div className="relative">
        <Image
          src={artisan.profileImage}
          alt={artisan.name}
          width={400}
          height={400}
          className="w-full h-48 object-cover rounded-xl"
        />
        {/* Availability Badge */}
        {artisan.isNewTasker ? (
          <span className="absolute top-3 left-2 text-[#FF6600] text-[10px] bg-white px-2 py-1 rounded-full font-poppins font-medium flex items-center gap-1">
            Available Now ⚡
          </span>
        ) : (
          <span className="absolute top-3 left-2 text-purple-600 text-[10px] bg-white px-2 py-1 rounded-full font-poppins font-medium">
            Unavailable Until 24th January
          </span>
        )}
      </div>

      {/* Card Content */}
      <div className="p-3">
        {/* Name and Badge */}
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-[16px] font-poppins font-bold">{artisan.name}</h3>
          {artisan.badge && (
            <span className="text-xs font-poppins bg-[#014F2A1A] text-[#014F2A] px-2 py-0.5">
              {artisan.badge}
            </span>
          )}
        </div>

        {/* Rating and Reviews */}
        <div className="flex items-center gap-1 mb-2">
          <span className="text-[14px] font-poppins font-semibold">
            {artisan.rating}
          </span>
          <Star size={14} className="fill-black text-black -mt-1" />
          <span className="text-[12px] text-gray-600 font-poppins">
            ({artisan.reviewCount})
          </span>
          <span className="text-[12px] text-gray-600 font-poppins">
            {artisan.taskCount} tasks
          </span>
        </div>

        {/* Price */}
        <div className="text-sm font-poppins font-semibold mb-3">
          ${artisan.pricePerHour}/hr
        </div>
      </div>
    </div>
  );
};

export default ArtisanGridCard;
