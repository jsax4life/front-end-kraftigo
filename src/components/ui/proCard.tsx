import { Star } from "lucide-react";
import Image from "next/image";
import Button from "@/components/ui/button";

interface ProCardProps {
  name: string;
  rating: number;
  reviews: number;
  tasks: number;
  description: string;
  price: string;
  distance?: number | string;
  image: string;
  badge?: string;
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
}: ProCardProps) => {
  return (
    <div className="bg-[#F6F6F6] rounded-xl p-4 sm:p-5 border border-[#0000001A] w-[95%] sm:w-[80%] lg:w-[48%] shrink-0">
      <div className="flex gap-4">
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
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div className="space-y-1">
              <div className="flex flex-row items-center gap-1.5 min-w-0 overflow-hidden">
                <h3 className="text-[15px] sm:text-[16px] font-poppins font-bold whitespace-nowrap shrink-0">
                  {name}
                </h3>
                {badge && (
                  <span className="text-[10px] shrink-0 font-poppins bg-[#014F2A1A] text-[#014F2A] px-1.5 py-0.5  whitespace-nowrap">
                    {badge}
                  </span>
                )}
                {distance == undefined || distance == null ? (
                  <p className="text-[11px] text-gray-500 font-poppins truncate min-w-0">
                    {typeof distance === 'number' ? `${distance} km away` : distance}
                  </p>
                ) : (
                  null
                )}
              </div>
              <div className="flex items-center mt-1">
                {/* <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={
                        i < rating
                          ? "fill-blue-500 text-blue-500"
                          : "text-gray-300"
                      }
                    />
                  ))}
                </div> */}
                <span className="text-[14px] text-gray-600 font-poppins">
                  {/* ({reviews}) ·  */}{tasks} Krafts
                </span>
              </div>
              <span className="text-[#FF6600] text-xs bg-[#FF66001A] px-2 py-1 rounded-full flex items-center gap-1 w-fit">
                Available Now
                <Image src="/light.svg" alt="light" width={9} height={12} />
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <p className="mb-3">{description}</p>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[20px] sm:text-[20px] font-mabry font-semibold">
            {price}
          </p>
          <Button
            variant="primary"
            className="text-[12px] sm:text-[14px] px-4 py-2"
          >
            View profile
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProCard;
