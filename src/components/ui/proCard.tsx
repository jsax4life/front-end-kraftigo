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
  image,
  badge,
}: ProCardProps) => {
  return (
    <div className="bg-[#F6F6F6] rounded-xl p-4 sm:p-5 border border-[#0000001A] w-[85%] sm:w-[70%] lg:w-[48%] shrink-0">
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
              <div className="flex items-center gap-4">
                <h3 className="text-[16px] sm:text-[18px] font-gerat font-bold">
                  {name}
                </h3>
                {badge && (
                  <span className="text-xs font-poppins bg-[#014F2A1A] text-[#014F2A] px-2 py-0.5">
                    {badge}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center">
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
                </div>
                <span className="text-[12px] text-gray-600 font-poppins">
                  ({reviews}) · {tasks} tasks
                </span>
              </div>
              <span className="text-[#FF6600] text-xs bg-[#FF66001A] px-2 py-1 rounded-full">
                Available Now{" "}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-2">
        <p className="text-[12px] sm:text-[13px] text-gray-700 font-poppins mb-3 line-clamp-2">
          {description}
        </p>

        <div className="flex items-center justify-between gap-3">
          <p className="text-[18px] sm:text-[20px] font-gerat font-bold">
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
