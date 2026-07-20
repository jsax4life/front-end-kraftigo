"use client";

import Image from "next/image";
import { useKrafterCta } from "@/hooks/useKrafterCta";

interface KrafterCtaBannerProps {
  className?: string;
}

/**
 * Profile-page Krafter CTA card. Routing/labels come from `useKrafterCta` (same as home banner click).
 */
const KrafterCtaBanner = ({ className = "" }: KrafterCtaBannerProps) => {
  const { bannerTitle, buttonLabel, handleAction } = useKrafterCta();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleAction}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleAction();
        }
      }}
      className={`flex flex-col justify-center items-start p-[16px] gap-[10px] rounded-[12px] relative overflow-hidden cursor-pointer ${className}`}
      style={{
        background:
          "linear-gradient(84.38deg, #FF6600 0.35%, rgba(0, 0, 255, 0.2) 19.08%, rgba(255, 102, 0, 0.26) 64.6%, rgba(0, 0, 255, 0) 99.58%)",
      }}
    >
      <div className="absolute inset-0 z-0">
        <Image src="/images/prof.jpg" alt="" fill className="object-cover opacity-60 mix-blend-overlay" />
      </div>
      <div className="relative z-10 w-full flex flex-col justify-between h-full">
        <div className="flex flex-col items-start gap-[20px]">
          <div className="flex justify-center items-center px-[10px] py-[4px] bg-[#FF6600] rounded-[8px]">
            <span className="text-[10px] font-poppins text-white leading-[15px]">{buttonLabel}</span>
          </div>
          <h4 className="text-[20px] font-poppins font-bold uppercase text-[#FFFFE4] leading-[30px] w-[203px]">
            {bannerTitle}
          </h4>
        </div>
        <div className="absolute right-0 bottom-0 text-white flex items-end justify-end h-full">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAction();
            }}
            className="flex justify-center items-center px-[14.7px] py-[11px] bg-white rounded-[10px]"
          >
            <span className="text-[11.46px] font-poppins text-black truncate whitespace-nowrap">
              {buttonLabel}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default KrafterCtaBanner;
