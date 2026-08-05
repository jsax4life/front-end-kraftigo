"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

/** Summer offer carousel card — artwork from `annc2.svg` with a CTA that matches the promo. */
export default function HomeSummerPromoBanner() {
  const router = useRouter();

  const handleClaimOffer = () => {
    const params = new URLSearchParams({ category: "Cleaning" });
    router.push(`/user/book-service?${params.toString()}`);
  };

  return (
    <div className="relative shrink-0 w-[min(441px,85vw)] h-[197px] rounded-[14px] overflow-hidden">
      <Image
        src="/annc2.svg"
        alt="Get 20% off your first technical clean up"
        width={441}
        height={197}
        className="h-full w-full object-cover"
        priority={false}
      />
      <button
        type="button"
        onClick={handleClaimOffer}
        className="absolute left-[10px] bottom-[10px] z-10 flex h-[37px] min-w-[147px] items-center justify-center rounded-[10px] bg-white px-4 text-[13px] font-poppins font-semibold text-[#FF6600] shadow-sm transition-colors hover:bg-[#FFF5EE] cursor-pointer"
      >
        Claim offer
      </button>
    </div>
  );
}
