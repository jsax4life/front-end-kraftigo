import { Star } from "lucide-react";
import Image from "next/image";
import Button from "@/components/ui/button";
import { DistanceBadge } from "@/components/ui/DistanceBadge";
import { formatDistanceDisplay } from "@/utils/distance";

export interface ProCardProps {
  name: string;
  rating: number;
  reviews: number;
  tasks: number;
  description: string;
  price: string;
  distance?: number | string;
  image: string;
  badge?: string;
  onViewProfile?: () => void;
}

const ProCard = ({
  name,
  rating,
  reviews,
  tasks,
  description,
  price,
  distance,
  image,
  badge,
  onViewProfile,
}: ProCardProps) => {
  return (
    <div className="bg-[#F6F6F6] rounded-xl p-3 sm:p-3 border border-[#0000001A] w-[95%] sm:w-[80%] lg:w-[46%] shrink-0 flex flex-col h-full min-w-0 overflow-hidden">
      <div className="flex gap-4 min-w-0">
        {/* Pro Image */}
        <div className="relative shrink-0">
          <Image
            src={image}
            alt={name}
            width={80}
            height={80}
            className="w-20 h-20 sm:w-20 sm:h-20 rounded-xl object-cover"
          />
        </div>

        {/* Pro Details */}
        <div className="flex-1 min-w-0">
          <div className="mb-2 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
              <h3 className="text-[14px] sm:text-[16px] font-poppins font-bold">
                {name}
              </h3>
              {badge && (
                <span className="text-[10px] font-poppins bg-[#014F2A1A] text-[#014F2A] px-1.5 py-0.5 whitespace-nowrap">
                  {badge}
                </span>
              )}
            </div>
            {distance != null && distance !== "" && (
              <div className="mt-1 min-w-0 max-w-full">
                <DistanceBadge
                  size="xs"
                  className="!max-w-full whitespace-normal break-words leading-snug"
                  label={
                    typeof distance === "number"
                      ? formatDistanceDisplay({ distanceKm: distance, distanceLabel: null }) ??
                        `${Math.round(distance)} km away`
                      : String(distance)
                  }
                />
              </div>
            )}
            <div className="flex items-center mt-1">
              <span className="text-[14px] text-gray-600 font-poppins">
                {tasks} Krafts
              </span>
            </div>
            <span className="text-[#FF6600] text-xs bg-[#FF66001A] px-2 py-1 rounded-full flex items-center gap-1 w-fit mt-1">
              Available Now
              <Image src="/light.svg" alt="light" width={9} height={12} />
            </span>
          </div>
        </div>
      </div>
      <div className="mt-auto pt-3 flex flex-col justify-end">
        <p className="mb-3 text-[13px] sm:text-[14px] text-gray-700 font-poppins line-clamp-2 min-h-[40px]">{description || " "}</p>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[20px] sm:text-[20px] font-mabry font-semibold">
            {price}
          </p>
          <Button
            variant="primary"
            className="text-[12px] sm:text-[14px] px-2 py-1"
            onClick={onViewProfile}
          >
            View profile
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProCard;
