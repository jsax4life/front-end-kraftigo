"use client";

import Image from "next/image";
import { useKrafterCta } from "@/hooks/useKrafterCta";
import KrafterCtaBanner from "@/components/shared/KrafterCtaBanner";

/** Home carousel Krafter CTA — static `annc.svg` for new users; dynamic card when already a Krafter. */
export default function HomeKrafterBanner() {
  const { isKrafterEligible, handleAction } = useKrafterCta({ enabled: true });

  if (isKrafterEligible) {
    return (
      <KrafterCtaBanner className="shrink-0 w-[400px] h-[186px] transition-transform hover:scale-[1.02]" />
    );
  }

  return (
    <Image
      src="/annc.svg"
      alt="Become a Krafter"
      width={400}
      height={186}
      className="shrink-0 cursor-pointer transition-transform hover:scale-[1.02]"
      onClick={handleAction}
    />
  );
}
