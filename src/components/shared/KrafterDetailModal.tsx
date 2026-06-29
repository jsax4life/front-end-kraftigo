"use client";

import Image from "next/image";
import { X, Star, MapPin, Clock, Languages, Briefcase } from "lucide-react";

export interface KrafterDetail {
  id: string;
  name: string;
  profileImage: string;
  badge?: string | null;
  rating: number;
  reviewCount: number;
  taskCount: number;
  description: string;
  location: string;
  distance?: number | null;
  pricePerHour: number;
  isAvailable?: boolean;
  // Extra fields from recommendation API
  bio?: string;
  uniqueSellingPoint?: string;
  occupationDescription?: string;
  languagesSpoken?: string[];
  address?: string;
  skillTags?: string[];
  portfolioImages?: string[];
  responseRate?: number | null;
  averageResponseHours?: number | null;
  yearsWithUs?: number;
  reviews?:string[];
}

interface KrafterDetailModalProps {
  krafter: KrafterDetail;
  onClose: () => void;
  onSelect: (id: string) => void;
}

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={13}
        className={i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}
      />
    ))}
  </div>
);

const KrafterDetailModal = ({ krafter, onClose, onSelect }: KrafterDetailModalProps) => {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 mx-auto z-50 bg-white max-h-[100vh] w-full max-w-4xl flex flex-col shadow-2xl md:rounded-t-[32px]">
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Close button */}
        <div className="flex justify-end px-4 pt-1 shrink-0">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X size={16} className="text-gray-600" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-32 px-5">

        <div className="flex flex-col items-center gap-2">
            <h2 className="text-[24px] font-poppins font-bold text-gray-900">{krafter.name}</h2>
            <div className="flex justify-center items-center gap-4 relative">
              <Image
                  src={krafter.profileImage || "/images/pro.jpg"}
                  alt={krafter.name}
                  width={150}
                  height={150}
                  className="w-35 h-35 rounded-2xl object-cover"
              />
              {krafter.isAvailable && (
                <Image src="/active.svg" alt="active" width={43} height={51} className="absolute -bottom-5.5 -right-6" />
              )}
          </div>
        </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between relative mb-5 mt-6 py-3">
            <div className="flex-1 text-center">
              <p className="text-[20px] font-mabry font-bold text-gray-900">{krafter.reviewCount}</p>
              <p className="text-[14px] font-poppins  mt-0.5">Reviews</p>
            </div>
            <div className="w-[3px] h-10 bg-[#D9D9D9] rounded-full"></div>
            <div className="flex-1 text-center">
              <p className="text-[20px] font-mabry font-bold text-gray-900">
                {krafter.rating > 0 ? krafter.rating.toFixed(1) : "—"}
              </p>
              <p className="text-[14px] font-poppins  mt-0.5">Rating</p>
            </div>
            <div className="w-[3px] h-10 bg-[#D9D9D9] rounded-full"></div>
            <div className="flex-1 text-center">
              <p className="text-[20px] font-mabry font-bold text-gray-900">
                {krafter.yearsWithUs != null ? krafter.yearsWithUs : "—"}
              </p>
              <p className="text-[14px] font-poppins  mt-0.5">Krafting</p>
            </div>
          </div>

          {/* Bio */}
          {(krafter.bio || krafter.description) && (
            <div className="mb-5 bg-[#F6F6F6] rounded-[8px] py-2 px-3">
              <p className="text-[14px] font-poppins  leading-relaxed">
                {krafter.bio || krafter.description}
              </p>
            </div>
          )}

          <div>
            <p className="font-poppins font-bold text-center">Krafter details</p>
            <div>
              <div className="flex items-center gap-1 mt-2">
                <p className="font-poppins text-[16px]">No of Krafts done:</p>
                <p className="font-poppins text-[16px]">{krafter.taskCount}</p>
              </div>
              <div className="flex items-center gap-1">
                <p className="font-poppins text-[16px]">Response rate:</p>
                <p className="font-poppins text-[16px]">{krafter.responseRate !== null ? krafter.responseRate + "%" : "0%"}</p>
              </div>
              <div className="flex items-center gap-1">
                <p className="font-poppins text-[16px]">Responds within </p>
                <p className="font-poppins text-[16px]">{krafter.averageResponseHours !== null ? "<" + krafter.averageResponseHours + "hours" : "an hour"}</p>
              </div>
            </div>
            <div className="mt-8 space-y-3">
              <span className="flex items-center gap-2"><Image src='/work.svg' alt="icon" width={22} height={22} />My Work: {krafter.occupationDescription}</span>
              <span className="flex items-center gap-2"><Image src='/speaks.svg' alt="icon" width={22} height={22} />Speaks: {krafter.languagesSpoken?.join(' and ')}</span>
              <span className="flex items-center gap-2"><Image src='/lives.svg' alt="icon" width={22} height={22} />Lives in: {krafter.address || krafter.location}</span>
              <span className="flex items-center gap-2"><Image src='/unique.svg' alt="icon" width={22} height={22} />What makes me unique: {krafter.uniqueSellingPoint}</span>
            </div>
          </div> 

          {/* Portfolio */}
          {krafter.portfolioImages && krafter.portfolioImages.length > 0 && (
            <div className="mb-5">
              <h3 className="text-[16px] font-poppins font-semibold text-center mb-2 mt-10">Images</h3>
              <div className="grid grid-cols-3 gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {krafter.portfolioImages.map((img, i) => (
                  <div key={i} className="relative w-27 h-27 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                    <Image src={img} alt={`Portfolio ${i + 1}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-2">
                <button className="underline text-[#FF6600] font-poppins font-bold">see all</button>
              </div>
            </div>
          )}


        {/* Skills */}
          {krafter.skillTags && krafter.skillTags.length > 0 && (
            <div className="mb-10 mt-10">
              <h3 className="text-[16px] font-poppins font-bold text-center mb-2">Skills & Expertise</h3>
              <div className="flex flex-wrap gap-2">
                {krafter.skillTags.map((skill) => (
                  <span
                    key={skill}
                    className="text-[12px] font-poppins border border-[#FF6600] text-[#FF6600] bg-[#FF66001A]  rounded-full px-5 py-3"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )} 

          {/* Reviews */}
          {/* {krafter.reviews && krafter.reviews.length > 0 && (
            <div>
              <h3 className="text-[16px] font-poppins font-bold text-center mb-2 mt-10">Reviews</h3>
              <div className="flex flex-wrap gap-2">
                {krafter.reviews.map((review, i) => (
                  <div key={i} className="relative w-27 h-27 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                    <p className="text-[12px] font-poppins">{review}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-2">
                <button className="underline text-[#FF6600] font-poppins font-bold">see all</button>
              </div>
            </div>
            )} */}
          
        </div>

        {/* Fixed Bottom CTA */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#0000001A] px-5 py-4">
          <div className="flex my-5 justify-between items-center">
            <div className="flex items-center justify-between mt-2 ">
              <div>
                <p className="text-[22px] font-mabry font-bold text-gray-900">
                  €{krafter.pricePerHour.toFixed(2)}
                  <span className="text-[22px] font-mabry"> /hr</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => { onSelect(krafter.id); onClose(); }}
              className="w-[200px] h-12 bg-brand-orange text-white text-[15px] font-poppins font-semibold rounded-lg hover:bg-orange-600 transition-colors"
            >
              Book Krafter
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default KrafterDetailModal;
