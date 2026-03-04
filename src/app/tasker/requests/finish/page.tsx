"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import Image from "next/image";

const Page = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white relative overflow-hidden space-y-3">
      {/* Content */}
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
            Offer Sent Succesfully!
          </h1>
          <p className="text-[14px] sm:text-[15px] font-poppins text-gray-600">
            Your proposal is now with the client, We’ll notify you if they
            accept or want to negotiate
          </p>
        </div>

        <Image
          src="/images/abt.jpg"
          alt="Success illustration"
          width={300}
          height={100}
          className="mx-auto w-full h-50 mb-6 rounded-lg object-cover"
        />

        <div>
          <p className="font-poppins text-sm">Offer Summary </p>
          <p className="font-poppins text-lg font-bold">
            Deep Cleaning Service
          </p>
        </div>

        <div className="space-y-5 py-4">
          <div className="flex items-center gap-2 ">
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
              <p className="font-semibold">Client</p>
              <p>Sarah Jenkins</p>
            </div>
          </div>
          <div className="flex items-center gap-2 ">
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
              <p>$85</p>
            </div>
          </div>
        </div>

        <div className="bg-[#FF66001A] border border-[#FF6600] text-[#FF6600] text-sm flex items-start gap-2 p-2 rounded-lg">
          <Image
            src="/warn.svg"
            alt="icon"
            width={25}
            height={25}
            className="text-brand-orange"
          />
          <p>
            Most clients respond within 24 hours. you can manage this offer in
            your dashboard at any time
          </p>
        </div>

        <div className="mt-15 space-y-4">
          <Button
            variant="primary"
            className="w-full"
            onClick={() => router.push("/tasker/requests")}
          >
            Back to job requests
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => router.push("/tasker/dashboard")}
          >
            Go to home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Page;
