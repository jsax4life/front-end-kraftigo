"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Star } from "lucide-react";
import Image from "next/image";
import CompareSheet from "./CompareModal";
import { Application } from "@/types";

interface OffersModalProps {
  job: any;
  onClose: () => void;
}

const mockApplications: Application[] = [
  {
    id: "app-1",
    job_id: "1",
    artisan_id: "art-1",
    artisan_name: "Edith R.",
    image: "/images/pro.jpg",
    rating: 4,
    reviews_count: 23,
    tasks_count: 72,
    price: "$41.29/hr",
    status: "pending",
    proposal_message:
      "I have six years of experience cleaning houses. My priority is to bring a good service and leave everything very clean✨. I am a reliable person, I will ensure that y...",
    description:
      "I have six years of experience cleaning houses. My priority is to bring a good service and leave everything very clean✨. I am a reliable person, I will ensure that your apartment is left very clean and I am always open to suggestions 🙏",
    is_top_pro: true,
  },
  {
    id: "app-2",
    job_id: "1",
    artisan_id: "art-2",
    artisan_name: "Edith R.",
    image: "/images/pro.jpg",
    rating: 4,
    reviews_count: 23,
    tasks_count: 72,
    price: "$41.29/hr",
    status: "pending",
    proposal_message:
      "I have six years of experience cleaning houses. My priority is to bring a good service and leave everything very clean✨. I am a reliable person, I will ensure that y...",
    description:
      "I have six years of experience cleaning houses. My priority is to bring a good service and leave everything very clean✨. I am a reliable person, I will ensure that your apartment is left very clean and I am always open to suggestions 🙏",
    is_top_pro: true,
  },
  {
    id: "app-3",
    job_id: "1",
    artisan_id: "art-3",
    artisan_name: "Edith R.",
    image: "/images/pro.jpg",
    rating: 4,
    reviews_count: 23,
    tasks_count: 72,
    price: "$41.29/hr",
    status: "pending",
    proposal_message:
      "I have six years of experience cleaning houses. My priority is to bring a good service and leave everything very clean✨. I am a reliable person, I will ensure that y...",
    description:
      "I have six years of experience cleaning houses. My priority is to bring a good service and leave everything very clean✨. I am a reliable person, I will ensure that your apartment is left very clean and I am always open to suggestions 🙏",
    is_top_pro: true,
  },
];

const OffersModal = ({ job, onClose }: OffersModalProps) => {
  const router = useRouter();
  const [showCompare, setShowCompare] = useState(false);

  const applications = mockApplications.map((a) => ({
    ...a,
    job_id: job?.id || "1",
  }));

  return (
    <>
      {/* Full-screen offers page */}
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        {/* Header */}
        <div className="px-4 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-[20px] font-gerat font-bold text-black pr-4">
              {job?.title || "Garden Cleanup & Debris Cleanup"}
            </h1>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 shrink-0"
            >
              <X size={22} />
            </button>
          </div>
          <p className="text-[14px] font-poppins font-bold text-brand-orange">
            {applications.length} Offers Received
          </p>
        </div>

        {/* Artisan Cards — scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-28 mb-20">
          {applications.map((app) => (
            <div
            key={app.id}
            onClick={() => router.push("/user/book-service/active-job?status=pending")}
            className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm cursor-pointer hover:border-brand-orange transition-colors"
          >
              {/* Artisan Info */}
              <div className="flex items-center gap-3 mb-3">
                <Image
                  src={app.image}
                  alt={app.artisan_name}
                  width={52}
                  height={52}
                  className="rounded-full object-cover w-13 h-13 shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-poppins font-bold text-black">
                      {app.artisan_name}
                    </span>
                    {app.is_top_pro && (
                      <span className="text-[10px] font-poppins font-bold text-brand-orange border border-brand-orange rounded-full px-2 py-0.5">
                        TOP PRO
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={12}
                        className={
                          star <= app.rating
                            ? "text-brand-orange fill-brand-orange"
                            : "text-gray-300 fill-gray-300"
                        }
                      />
                    ))}
                    <span className="text-[12px] font-poppins text-gray-500 ml-1">
                      ({app.reviews_count} Reviews) &nbsp; {app.tasks_count} Krafts
                    </span>
                  </div>
                </div>
              </div>

              {/* Price */}
              <p className="text-[20px] font-gerat font-bold text-black mb-2">
                {app.price}
              </p>

              {/* Proposal */}
              <p className="text-[13px] font-poppins text-gray-600 mb-4 leading-relaxed">
                {app.proposal_message}
              </p>

              {/* Accept + Chat buttons */}
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => router.push(`/user/chat?artisanId=${app.artisan_id}&name=${encodeURIComponent(app.artisan_name)}`)}
                  className="bg-[#FF66001A] flex items-center justify-center gap-2 px-5 py-3 border border-gray-200 rounded-xl text-[13px] font-poppins font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Chat
                </button>
                <button
                  onClick={() => router.push("/user/book-service/active-job?status=accepted")}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand-orange text-white rounded-xl text-[13px] font-poppins font-semibold hover:bg-orange-600 transition-colors"
                >
                  Accept Offer
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Sticky Compare button at the bottom */}
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-white border-t border-gray-100 mb-20 mt-20">
          <button
            onClick={() => setShowCompare(true)}
            className="w-full py-4 bg-brand-orange text-white rounded-full text-[15px] font-poppins font-semibold flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors shadow-md"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16l-4 4-4-4M17 20V4M3 8l4-4 4 4M7 4v16" />
            </svg>
            Compare Krafters ({applications.length})
          </button>
        </div>
      </div>

      {/* Compare Sheet — overlays on top of the offers page */}
      {showCompare && (
        <CompareSheet
          allArtisans={applications}
          onClose={() => setShowCompare(false)}
          onSelect={(artisan) => {
            console.log("Selected:", artisan);
            setShowCompare(false);
            onClose();
          }}
        />
      )}
    </>
  );
};

export default OffersModal;
