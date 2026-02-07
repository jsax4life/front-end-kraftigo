"use client";

import Image from "next/image";
import TaskerNav from "@/componets/shared/taskerNav";
import About from "@/componets/shared/about";
import Card from "@/componets/ui/card";
import { MapPin, Dot } from "lucide-react";
import Button from "@/componets/ui/button";
import Notify from "@/componets/ui/notify";

const Page = () => {
  return (
    <main className="relative w-full min-h-screen bg-white pb-24">
      {/* Page Content */}
      <div>
        <div className="bg-[#F6F6F6] pb-6">
          <div className="flex justify-center mb-4 relative z-20 pt-6">
            <Image
              src="/taskerLogo.svg"
              alt="kraftigö logo"
              width={173}
              height={58}
              className="w-32 sm:w-40 h-auto object-contain"
            />
          </div>
          <div className="mb-6">
            <About />
          </div>
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-4">
              <p className="font-[850] text-[18px] sm:text-[20px] lg:text-[24px] font-gerat">
                Overview
              </p>
              <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                <Card img="/meun.svg" title="Tasks" val="3" />
                <Card img="/star.svg" title="Rating" val="4.9" />
                <Card img="/check.svg" title="Rate" val="98%" />
              </div>
            </div>
          </div>
        </div>
        <div className="w-full px-4 sm:px-6 lg:px-8 pt-10 pb-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <p className="font-[850] text-[18px] sm:text-[20px] lg:text-[24px] font-gerat">
                Todays Schedule
              </p>
              <p className="text-brand-orange font-poppins text-[14px] sm:text-[16px] cursor-pointer hover:underline">
                View all
              </p>
            </div>
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
                  Next Task <Dot size={20} /> 10:30 AM
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-[16px] sm:text-[18px] lg:text-[20px] font-gerat">
                Sarah Johnson
              </p>
              <p className="flex items-center text-[14px] sm:text-[16px] font-poppins text-gray-700">
                Plumbing Repair <Dot size={20} className="text-gray-400" /> 1.2
                miles away
              </p>
              <span className="flex items-center gap-2 text-[14px] sm:text-[16px] font-poppins text-gray-600">
                <MapPin size={18} className="shrink-0" />
                <p>123 Maple Ave, Berlin</p>
              </span>
              <Button
                variant="primary"
                fullWidth
                className="font-qurova flex justify-center items-center gap-2"
              >
                <Image
                  src="/up.svg"
                  alt="upIcon"
                  width={100}
                  height={100}
                  className="w-4.5 h-4.5"
                />
                <p className="mt-1.5">Start Navigation</p>
              </Button>
            </div>
          </div>
        </div>
        <div className="w-full px-4 sm:px-6 lg:px-8 pt-7 pb-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <p className="font-[850] text-[18px] sm:text-[20px] lg:text-[24px] font-gerat">
                Notification
              </p>
              <p className="text-brand-orange font-poppins text-[14px] sm:text-[16px] cursor-pointer hover:underline">
                View all
              </p>
            </div>
            <div className="space-y-3">
              <Notify />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <TaskerNav />
    </main>
  );
};

export default Page;
