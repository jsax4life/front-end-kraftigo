"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import Image from "next/image";

const Page = () => {
  const router = useRouter();

  const conImg = ["/images/abt.jpg", "/images/abt.jpg", "/images/abt.jpg"];

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
            Kraft Created
          </h1>
          <p className="text-[14px] sm:text-[15px] font-poppins text-gray-600">
            Your kraft is now created and is under review, We&apos;ll notify you
            when it goes live.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 py-4">
          {conImg.map((img, index) => (
            <div key={index}>
              <Image
                src={img}
                alt=""
                width={150}
                height={100}
                className="w-full h-30 rounded-lg object-cover"
              />
            </div>
          ))}
        </div>

        <div>
          <p className="font-poppins font-bold text-lg">Offer Summary </p>
          <p className="font-poppins text-sm">
            I need someone with six years of experience cleaning houses. whose
            priority is to bring a good service and leave everything very
            clean✨. I am a reliable person, I will ensure that your apartment
            is left very clean and I am always open to suggestions 🙏
          </p>
        </div>

        <div>
          <div>
            <div>
              <Image src="/profile.svg" alt="icon" width={20} height={20} />
            </div>
            <div>
              <p>Task Valid for</p>
              <p>3 days</p>
            </div>
          </div>
          <div></div>
        </div>

        <Button
          variant="primary"
          className="w-full"
          onClick={() => router.push("/user/home")}
        >
          Go back home
        </Button>
      </div>
    </div>
  );
};

export default Page;
