import Image from "next/image";

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
    distance: number;
    pricePerHour: number;
    isNewTasker?: boolean;
    isAvailable?: boolean;
  };
  index: number;
  onSelect: (id: string) => void;
  onChat?: (id: string) => void;
}

const ArtisanCard = ({ artisan, index, onSelect, onChat }: ArtisanCardProps) => {
  // Alternate background colors
  const bgColor = index % 2 === 0 ? "bg-white" : "bg-[#F6F6F6]";

  return (
    <div className={`${bgColor} p-3 sm:p-4`}>
      <div className="flex gap-3 sm:gap-4">
        {/* Profile Image */}
        <div className="relative shrink-0">
          <Image
            src={artisan.profileImage || "/images/pro.jpg"}
            alt={artisan.name}
            width={80}
            height={80}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover"
          />
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="space-y-1 flex-1">
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
                  <span className="inline-block text-[12px] font-poppins">
                    {typeof artisan.distance === "number" ? artisan.distance.toFixed(1) : artisan.distance}km away
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {/* <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={
                        i < artisan.rating
                          ? "fill-blue-500 text-blue-500"
                          : "text-gray-300"
                      }
                    />
                  ))}
                </div> */}
                <span className="text-[12px] text-gray-600 font-poppins">
                  {artisan.taskCount} Krafts
                </span>
              </div>
              <span className="inline-block text-[#FF6600] text-xs bg-[#FF66001A] px-2 py-1 rounded-full">
                {artisan.isAvailable ? "Available Now" : "Not Available"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-[15px] sm:text-[13px] text-gray-700 font-poppins mb-3 line-clamp-2">
          {artisan.description}
        </p>

        <div className="flex items-end justify-between gap-3">
          <p className="text-[24px] sm:text-[20px] font-mabry font-semibold">
            €{artisan.pricePerHour.toFixed(2)} <span className="text-[24px] font-normal text-gray-500">/hr</span>
          </p>
          <div className="flex gap-2 flex-1 justify-end max-w-[200px]">
            <button
              onClick={() => onSelect(artisan.id)}
              className="py-4 bg-brand-orange text-white text-[14px] font-poppins font-semibold rounded-xl hover:bg-orange-600 transition-colors"
              style={{ flex: 2 }}
            >
              Select
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtisanCard;
