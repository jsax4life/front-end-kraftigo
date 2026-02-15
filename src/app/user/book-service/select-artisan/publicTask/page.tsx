"use client"

import { Check } from 'lucide-react'
import { useRouter, useSearchParams  } from 'next/navigation'
import Image from 'next/image'


const Page = () => {
  const router = useRouter()
   const searchParams = useSearchParams();
  const serviceName = searchParams.get("service") || "House Cleaning";
  const address =
    searchParams.get("address") || "Hauptstraße 123 - 10115, Berlin";
  const date = searchParams.get("date") || "16th Jan, 2026";

  return (
    <div className="min-h-screen bg-white">
     <div className="bg-[#FFF0F0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-8 py-6 flex items-center justify-between">
            <div className="flex items-center gap-1 sm:gap-2">
                <span
                onClick={() => router.back()}
                className="w-9 h-9 bg-brand-orange rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-colors"
                >
                <Check size={20} className="text-white" />
                </span>
                <span
                onClick={() => router.back()}
                className="w-9 h-9 bg-brand-orange rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-colors"
                >
                <Check size={20} className="text-white" />
                </span>
                <span
                onClick={() => router.back()}
                className="w-fit px-3 py-2.5 text-xs sm:text-sm bg-brand-orange text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-colors"
                >
                Krafter
                </span>
                <span className="w-9 h-9 bg-white font-bold rounded-full text-[#00000066] flex items-center justify-center text-sm">
                4
                </span>
                <span className="w-9 h-9 bg-white font-bold rounded-full text-[#00000066] flex items-center justify-center text-sm">
                5
                </span>
            </div>
            <button
                className="text-brand-orange text-[14px] sm:text-[16px] font-poppins font-semibold"
                onClick={() => router.back()}
            >
                Back
            </button>
            </div>
        </div>

        {/* Service Info */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-2">
                {serviceName}
              </h1>
              <p className="text-[13px] sm:text-[14px] text-gray-700 font-poppins">
                {address}
              </p>
              <p className="text-[13px] sm:text-[14px] text-gray-700 font-poppins">
                {date}
              </p>
            </div>
            <Image
              src="/card.svg"
              alt="service"
              width={70}
              height={70}
              className="w-16 h-16 sm:w-20 sm:h-20"
            />
            </div>
        </div>

    </div>  
  )
  
}

export default Page
