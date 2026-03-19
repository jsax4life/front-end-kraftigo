"use client";

import { Check, Calendar, Clock, MapPin } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useEffect, useState, Suspense } from "react";

const ConfirmationContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPublic = searchParams.get("isPublic") === "true";
  const categoryName = searchParams.get("category") || "Service";
  const address = searchParams.get("address")
  const rawDate = searchParams.get("date") || "";
  const rawTime = searchParams.get("time")

  const parsedDate = new Date(rawDate);
  const formattedDisplayDate = !isNaN(parsedDate.getTime()) 
    ? new Intl.DateTimeFormat('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }).format(parsedDate)
    : "Oct 24, 2023";

  const [particles, setParticles] = useState<
    Array<{
      id: number;
      left: string;
      animationDuration: string;
      animationDelay: string;
      size: number;
    }>
  >([]);

  useEffect(() => {
    // Generate random particles for confetti effect
    const particleCount = 10;
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      animationDuration: `${4 + Math.random() * 4}s`, // 4-8 seconds for slower fall
      animationDelay: `${Math.random() * 3}s`, // Stagger the start
      size: 80 + Math.random() * 400, // 80-150px for large visible confetti
    }));
    setParticles(newParticles);
  }, []);

  const handleMessageKrafter = () => {
    // Navigate to messaging page
    console.log("Message Krafter");
    router.push("/user/chat");
  };

  const handleViewDetails = () => {
    // Navigate to tasks page
    console.log("View Kraft Details");
    router.push("/user/krafts");
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden space-y-3">
      {/* Falling Confetti - Single Image */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute confetti-fall"
          style={{
            left: '0',
            top: '-100%',
            width: '100%',
            height: '100%',
          }}
        >
          <Image
            src="/partices.svg"
            alt=""
            width={1920}
            height={1080}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-25 h-25 bg-[#FFE5D9] rounded-full flex items-center justify-center">
              <div className="w-13 h-13 bg-brand-orange rounded-full flex items-center justify-center">
                <Check size={30} className="text-white" strokeWidth={3} />
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center mb-8">
          <h1 className="text-[28px] sm:text-[32px] font-gerat font-bold mb-3">
            {isPublic ? "Task Posted Successfully" : "Booking Confirmed"}
          </h1>
          <p className="text-[14px] sm:text-[15px] font-poppins text-gray-600">
            {isPublic 
              ? `You've successfully posted your ${categoryName} task to the marketplace.` 
              : `You've successfully booked Edith for your ${categoryName} service.`}
          </p>
        </div>

        {/* Artisan Card - Only show if not a public post */}
        {!isPublic && (
          <div className="bg-[#F9F9F9] border border-[#0000001A] rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="relative">
                <Image
                  src="/images/pro.jpg"
                  alt="Edith Ropalanum"
                  width={60}
                  height={60}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-[16px] sm:text-[17px] font-poppins font-bold text-gray-900">
                    Edith Ropalanum.
                  </h3>
                  <span className="bg-[#E8F5E9] text-[#2E7D32] text-[10px] font-poppins font-semibold px-2 py-0.5 rounded">
                    TOP PRO
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4].map((star) => (
                      <svg
                        key={star}
                        className="w-4 h-4 text-blue-600 fill-current"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                    <svg
                      className="w-4 h-4 text-gray-300 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  </div>
                  <span className="text-[13px] font-poppins text-gray-600">
                    (23 reviews)
                  </span>
                  <span className="text-[13px] font-poppins text-gray-600">
                    72 Krafts
                  </span>
                </div>
                <span className="inline-block bg-[#FFF9C4] text-[#F57F17] text-[10px] font-poppins font-semibold px-2 py-1 rounded">
                  NEW KRAFTER
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Booking Details */}
        <div className="space-y-4 mb-6 grid grid-cols-2">
          {/* Scheduled Date */}
          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-gray-700" />
            <div>
              <p className="text-[13px] font-poppins text-gray-600">
                {formattedDisplayDate}
              </p>
              <p className="text-[15px] sm:text-[16px] font-poppins font-semibold text-gray-900">
                Scheduled Date
              </p>
            </div>
          </div>

          {/* Time Window */}
          <div className="flex items-center gap-3">
            <Clock size={20} className="text-gray-700" />
            <div>
              <p className="text-[13px] font-poppins text-gray-600">
                {rawTime}
              </p>
              <p className="text-[15px] sm:text-[16px] font-poppins font-semibold text-gray-900">
                Estimated Window
              </p>
            </div>
          </div>

          {/* Service Address */}
          <div className="flex items-center gap-3">
            <MapPin size={20} className="text-gray-700" />
            <div>
              <p className="text-[13px] font-poppins text-gray-600">
                {address}
              </p>
              <p className="text-[15px] sm:text-[16px] font-poppins font-semibold text-gray-900">
                Service Address
              </p>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="relative mb-4">
          <Image
            src="/images/map.png"
            alt="map"
            width={600}
            height={600}
            className="rounded-xl w-full h-auto object-cover"
          />
          <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4">
            <p className="bg-brand-orange text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-full text-[12px] sm:text-[14px] font-poppins flex items-center gap-1 shadow-lg">
              Service Area
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mb-6 mt-7">
          {!isPublic && (
            <button
              onClick={handleMessageKrafter}
              className="text-[16px] sm:text-[17px] w-full py-3 bg-brand-orange text-white  font-poppins  rounded-xl hover: transition-colors  "
            >
              Message Krafter
            </button>
          )}
          <button
            onClick={handleViewDetails}
            className="w-full py-3 bg-[#0000FF] text-white text-[16px] sm:text-[17px] font-poppins rounded-xl hover:bg-blue-700 transition-colors"
          >
            View Kraft Details
          </button>
        </div>

        {/* Footer Info */}
        {!isPublic && (
          <div className="flex items-center justify-center gap-2 text-center">
            <Image src="/sheid.svg" alt="shield" width={18} height={18} />
            <p className="text-[13px] sm:text-[14px] font-poppins text-gray-600">
              Krafter will arrive at the scheduled time
            </p>
          </div>
        )}
      </div>

      {/* CSS for confetti animation */}
      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh);
            opacity: 0;
          }
        }

        .confetti-fall {
          animation: fall 10s ease-in forwards;
        }
      `}</style>
    </div>
  );
};

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
