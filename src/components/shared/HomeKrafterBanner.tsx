"use client";

import Image from "next/image";
import { useKrafterCta } from "@/hooks/useKrafterCta";

/** Home carousel Krafter promo — always the original `annc.svg` artwork; routing follows profile CTA logic. */
export default function HomeKrafterBanner() {
  const { buttonLabel, handleAction } = useKrafterCta({ enabled: true });

  return (
    <Image
      src="/annc.svg"
      alt={buttonLabel}
      width={400}
      height={186}
      className="shrink-0 cursor-pointer transition-transform hover:scale-[1.02]"
      onClick={handleAction}
    />
  );
}
