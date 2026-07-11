import Image from "next/image";
import { Star } from "lucide-react";
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
    bio?: string;
    skillTags?: string[];
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

const ArtisanCard = ({ artisan, index, onSelect, onViewProfile }: ArtisanCardProps) => {
  const openProfile = () => onViewProfile?.(artisan.id);

  // Fallback skills if not provided by backend
  const skills = artisan.skillTags && artisan.skillTags.length > 0 
    ? artisan.skillTags 
    : ["Gardening", "Gardening", "Gardening", "Gardening"];

  const isEven = index % 2 === 0;
  const bgColorClass = isEven ? "bg-white sm:bg-[#F9FAFB]" : "bg-[#F9FAFB] border border-[#0000001A] md:border-none rounded-none sm:rounded-md";

  return (
    <div
      className={`${bgColorClass} rounded-md p-4 sm:p-5 transition-all hover:shadow-sm flex flex-col gap-3 sm:gap-6 w-full relative group`}
    >
      {/* Top Section (Image + Main Info) */}
      <div className="flex flex-row gap-3 sm:gap-4 w-full">
        {/* Image Section */}
        <div className="shrink-0">
          <Image
            src={artisan.profileImage || "/images/pro.jpg"}
            alt={artisan.name}
            width={181}
            height={181}
            className="w-[80px] h-[80px] sm:w-[181px] sm:h-[181px] rounded-[12px] sm:rounded-[16px] object-cover border border-[#0000001A]"
          />
        </div>

        {/* Content Section (Right of Image) */}
        <div className="flex flex-col flex-1 min-w-0 justify-start">
          {/* Top Row: Name, Badge, Distance */}
          <div className="flex items-start justify-between gap-2 w-full">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[14px] sm:text-[16px]  font-poppins font-bold text-[#2F2C2C]">
                {artisan.name}
              </h3>
              {artisan.badge && (
                <span className="bg-[#E2EBE5] text-[#014F2A] px-2 py-0.5 rounded text-[9px] sm:text-[11px] font-poppins font-semibold uppercase">
                  {artisan.badge.replace(/_/g, " ")}
                </span>
              )}
            </div>
            <div className="text-[13px] font-poppins text-[#2F2C2C] shrink-0 mt-0.5">
              {artisan.distanceLabel || (artisan.distance ? `${artisan.distance} miles away` : "")}
            </div>
          </div>

          {/* Second Row: Stars, Reviews, Krafts */}
          <div className="flex items-center gap-2 mt-1 sm:mt-1.5 flex-wrap">
            {/* <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4].map((s) => (
                <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-blue-600">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              ))}
            </div> */}
            {/* <span className="text-[14px] font-poppins text-[#2F2C2C]">
              ({artisan.reviewCount || 23})
            </span> */}
            <span className="text-[14px] font-poppins text-[#2F2C2C]">
              {artisan.taskCount || 72} Krafts
            </span>
          </div>

          {/* Third Row: Available Badge */}
          <div className="mt-1.5 sm:mt-1">
            <span className="inline-flex w-fit items-center gap-1.5 text-[#FB5D00] text-[11px] font-poppins font-medium bg-[#FFF0E5] px-2.5 py-1 rounded-md">
              {artisan.isAvailable ? "Available Now" : "Available"}
              <Image src="/light.svg" alt="light" width={8} height={11} className="mt-0.5" />
            </span>
          </div>

          {/* Desktop Bio */}
          <p className="hidden sm:block mt-4 text-[14px] font-poppins text-[#2F2C2C] leading-relaxed line-clamp-3">
            {artisan.bio || artisan.description || "I have six years of experience cleaning houses. My priority is to bring a good service and leave everything very clean✨. I am a reliable person, I will ensure that y..."}
          </p>

          {/* Desktop Skills */}
          <div className="hidden sm:block mt-6">
            <p className="text-[14px] font-poppins font-bold text-[#2F2C2C] mb-2.5">Skills</p>
            <div className="flex flex-wrap gap-2.5">
              {skills.slice(0, 4).map((skill, idx) => (
                <span 
                  key={idx} 
                  className="border border-[#FF6600] text-[#FF6600] bg-[#FF66001A] text-[14px] font-poppins px-3.5 py-1.5 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bio */}
      <p className="sm:hidden mt-1 text-[14px] font-poppins text-[#2F2C2C] leading-relaxed line-clamp-3">
        {artisan.bio || artisan.description || "I have six years of experience cleaning houses. My priority is to bring a good service and leave everything very clean✨. I am a reliable person, I will ensure that y..."}
      </p>

      {/* Mobile Skills */}
      <div className="sm:hidden mt-2">
        <p className="text-[15px] font-poppins font-bold text-[#2F2C2C] mb-2.5">Skills</p>
        <div className="flex flex-wrap gap-2">
          {skills.slice(0, 4).map((skill, idx) => (
            <span 
              key={idx} 
              className="border border-[#FF6600] text-[#FF6600] bg-[#FF66001A] text-[13px] font-poppins px-3.5 py-1 rounded-full"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom Row (Full Width) */}
      <div className="mt-3 sm:mt-auto pt-2 sm:pt-4 flex items-center justify-between w-full gap-4">
        <div className="text-[24px] sm:text-[20px] font-mabry font-bold text-[#2F2C2C] shrink-0">
          ${artisan.pricePerHour.toFixed(2)}<span className="text-[16px] font-mabry">/hr</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            openProfile();
          }}
          className="flex-1 max-w-[220px] bg-[#FB5D00] text-white py-3.5 sm:py-3 rounded-[12px] font-poppins font-semibold text-[15px] hover:bg-[#e55500] transition-colors text-center shrink-0"
        >
          Veiw Profile
        </button>
      </div>
    </div>
  );
};

export default ArtisanCard;
