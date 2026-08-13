"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  BETA_HOUSE_CLEANING_CATEGORY_ID,
  buildCategoryBookingUrl,
} from "@/constants/betaLaunch";

/** Summer offer carousel card — artwork from `annc2.svg` with a CTA that matches the promo. */
export default function HomeSummerPromoBanner() {
  const router = useRouter();

  const handleClaimOffer = () => {
    router.push(
      buildCategoryBookingUrl(BETA_HOUSE_CLEANING_CATEGORY_ID, "House Cleaning"),
    );
  };

  return (
    <div className="relative shrink-0 w-[min(441px,calc(100vw-2rem))]">
      <Image
        src="/annc2.svg"
        alt="Get 20% off your first technical clean up"
        width={441}
        height={207}
        className="h-auto w-full"
        priority={false}
      />
      <button
        type="button"
        onClick={handleClaimOffer}
        className="absolute left-[2.5%] bottom-[26%] md:bottom-[9%] z-10 flex h-[37px] min-w-[147px] max-w-[45%] items-center justify-center rounded-[10px] bg-white px-4 text-[13px] font-poppins font-semibold text-[#FF6600] shadow-sm transition-colors hover:bg-[#FFF5EE] cursor-pointer"
      >
        Claim offer
      </button>
    </div>
  );
}
