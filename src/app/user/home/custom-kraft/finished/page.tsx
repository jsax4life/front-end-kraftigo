"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Button from "@/components/ui/button";
import Image from "next/image";
import { useCustomKraftsStore } from "@/store/useCustomKraftsStore";

// ─── Expiry enum → human label ─────────────────────────────────────────────
const EXPIRY_LABEL: Record<string, string> = {
  "24H": "1 day",
  "3DAYS": "3 days",
  "1WEEK": "1 week",
  "CUSTOM": "Custom",
};

const Page = () => {
  const router = useRouter();
  const { selectedKraft, clearSelectedKraft } = useCustomKraftsStore();

  // Guard: if somehow landed here without a kraft, go home
  useEffect(() => {
    if (!selectedKraft) {
      router.replace("/user/home");
    }
  }, [selectedKraft, router]);

  const expiryLabel = selectedKraft?.expiryOption
    ? EXPIRY_LABEL[selectedKraft.expiryOption] ?? selectedKraft.expiryOption
    : "—";

  const bidAmount = selectedKraft?.offerAmount != null
    ? `€${Number(selectedKraft.offerAmount).toFixed(2)}`
    : "—";

  return (
    <div className="min-h-screen bg-white relative overflow-hidden space-y-3">
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-25 h-25 bg-[#0000FF14] rounded-full flex items-center justify-center">
              <div className="w-13 h-13 bg-brand-blue rounded-full flex items-center justify-center">
                <Check size={30} className="text-white" strokeWidth={3} />
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center mb-8">
          <h1 className="text-[28px] sm:text-[32px] font-gerat font-bold mb-3">
            Kraft Created
          </h1>
          <p className="text-[14px] sm:text-[15px] font-poppins text-gray-600">
            Your kraft is now live and visible to artisans. We&apos;ll notify
            you when you receive your first response.
          </p>
        </div>

        {/* Photos */}
        {selectedKraft?.photos && selectedKraft.photos.length > 0 && (
          <div className="grid grid-cols-3 gap-4 py-4">
            {selectedKraft.photos.slice(0, 3).map((src, index) => (
              <div key={index}>
                <Image
                  src={src}
                  alt={`Photo ${index + 1}`}
                  width={150}
                  height={100}
                  className="w-full h-30 rounded-lg object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Offer Summary */}
        {selectedKraft?.description && (
          <div>
            <p className="font-poppins font-bold text-lg">Offer Summary</p>
            <p className="font-poppins text-sm text-gray-700 mt-1 leading-relaxed">
              {selectedKraft.description}
            </p>
          </div>
        )}

        {/* Key Details */}
        <div className="space-y-5 py-4">
          <div className="flex items-center gap-2">
            <div className="bg-[#FF66001A] p-3 rounded-full">
              <Image
                src="/pro.svg"
                alt="icon"
                width={25}
                height={25}
                className="text-brand-orange"
              />
            </div>
            <div>
              <p className="font-semibold">Task Valid for</p>
              <p>{expiryLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-[#FF66001A] p-3 rounded-full">
              <Image
                src="/money.svg"
                alt="icon"
                width={25}
                height={25}
                className="text-brand-orange"
              />
            </div>
            <div>
              <p className="font-semibold">Your bid</p>
              <p>{bidAmount}</p>
            </div>
          </div>

          {selectedKraft?.scheduledDate && (
            <div className="flex items-center gap-2">
              <div className="bg-[#FF66001A] p-3 rounded-full">
                <Image
                  src="/pro.svg"
                  alt="icon"
                  width={25}
                  height={25}
                />
              </div>
              <div>
                <p className="font-semibold">Scheduled</p>
                <p>
                  {selectedKraft.scheduledDate}
                  {selectedKraft.scheduledTime
                    ? ` · ${selectedKraft.scheduledTime}`
                    : ""}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Notice */}
        <div className="bg-[#FF66001A] border border-[#FF6600] text-[#FF6600] text-sm flex items-start gap-2 p-2 rounded-lg">
          <Image
            src="/warn.svg"
            alt="icon"
            width={25}
            height={25}
            className="text-brand-orange"
          />
          <p>We will notify you the status of your task within 1 hour</p>
        </div>

        <div className="mt-15">
          <Button
            variant="primary"
            className="w-full"
            onClick={() => {
              clearSelectedKraft();
              router.push("/user/home");
            }}
          >
            Go back home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Page;
