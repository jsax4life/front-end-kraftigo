"use client";

import { Check } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceName = searchParams.get("service") || "House Cleaning";
  const address =
    searchParams.get("address") || "Hauptstraße 123 - 10115, Berlin";
  const date = searchParams.get("date") || "15th Jan, 2025";

  const [formData, setFormData] = useState({
    amount: "",
    openToNegotiation: true,
    selectedExpiry: "24h",
    selectedRequirement: "any",
    verifiedOnly: false,
  });

  const timeSlots = [
    { id: "24h", label: "24h" },
    { id: "3days", label: "3 days" },
    { id: "1week", label: "1 Week" },
  ];

  const requirements = [
    { id: "any", label: "Any" },
    { id: "3.0+", label: "3.0+" },
    { id: "4.0+", label: "4.0+" },
    { id: "4.5+", label: "4.5+" },
  ];

  const handleNext = () => {
    // Navigate to next page with form data
    const params = new URLSearchParams(searchParams.toString());
    params.set("isPublic", "true");
    if (formData.amount) params.set("budget", formData.amount);
    router.push(`/user/book-service/verifyDetails?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-white pb-8">
      {/* Header */}
      <div className="bg-[#FFF0F0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="w-9 h-9 bg-brand-orange rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-colors">
              <Check size={20} className="text-white" />
            </span>
            <span className="w-9 h-9 bg-brand-orange rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-colors">
              <Check size={20} className="text-white" />
            </span>
            <span className="w-fit px-3 py-2.5 text-xs sm:text-sm bg-brand-orange text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-colors">
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

        {/* Service Info */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
          <div className="flex items-start justify-between gap-4">
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
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#FFF4E6] rounded-lg flex items-center justify-center">
              <Image
                src="/card.svg"
                alt="service"
                width={40}
                height={40}
                className="w-10 h-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Budget Section */}
      <div className="max-w-4xl mx-auto ">
        <div className="p-4 sm:p-5 border-b border-[#0000001A]">
          <h2 className="text-[20px] sm:text-[22px] font-poppins font-semibold mb-3">
            Budget
          </h2>
          <span className="text-[14px] sm:text-[15px] font-poppins text-gray-800 block mb-2">
            Offer Amount
          </span>
          <Input
            placeholder="$ 0.00"
            value={formData.amount}
            onChange={(value) =>
              setFormData({ ...formData, amount: value })
            }
            className="mb-4"
          />

          {/* Open to Negotiation Toggle */}
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-1 px-1">
              <Image src="/neg.svg" alt="icon" width={18} height={18} />
              <span className="text-[14px] sm:text-[15px] font-poppins font-semibold text-gray-800">
                Open to negotiation
              </span>
            </div>
            <button
              onClick={() =>
                setFormData({
                  ...formData,
                  openToNegotiation: !formData.openToNegotiation,
                })
              }
              className={`relative w-12 h-6 rounded-full transition-colors ${
                formData.openToNegotiation ? "bg-brand-orange" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  formData.openToNegotiation ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Kraft Expiry */}
        <div className="p-4 sm:p-5 border-b border-[#0000001A]">
          <h2 className="text-[20px] sm:text-[22px] font-poppins font-semibold mb-3 pt-2">
            Kraft Expiry
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 pb-3">
            {timeSlots.map((time) => (
              <button
                key={time.id}
                onClick={() =>
                  setFormData({ ...formData, selectedExpiry: time.id })
                }
                className={`py-3 rounded-xl text-[13px] sm:text-[14px] font-poppins font-medium transition-colors border ${
                  formData.selectedExpiry === time.id
                    ? "text-brand-orange border-brand-orange bg-[#FF66001A]"
                    : "bg-[#F6F6F6] text-gray-800 border-transparent hover:bg-gray-100"
                }`}
              >
                {time.label}
              </button>
            ))}
          </div>
        </div>

        {/* Krafter Requirement */}
        <div className="p-4 sm:p-5 border-b border-[#0000001A]">
          <h2 className="text-[20px] sm:text-[22px] font-poppins font-semibold mb-3 pt-3">
            Krafter Requirement
          </h2>
          <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4">
            {requirements.map((req) => (
              <button
                key={req.id}
                onClick={() =>
                  setFormData({ ...formData, selectedRequirement: req.id })
                }
                className={`py-3 rounded-xl text-[13px] sm:text-[14px] font-poppins font-medium transition-colors border ${
                  formData.selectedRequirement === req.id
                    ? "text-brand-orange border-brand-orange bg-[#FF66001A]"
                    : "bg-[#F6F6F6] text-gray-800 border-transparent hover:bg-gray-100"
                }`}
              >
                {req.label}
              </button>
            ))}
          </div>

          {/* Verified Only Toggle */}
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center gap-1 ">
              <Image src="/verified.svg" alt="icon" width={22} height={22} />
              <span className="text-[14px] sm:text-[15px] font-poppins font-semibold text-gray-800">
                Verified Only
              </span>
            </div>
            <button
              onClick={() =>
                setFormData({
                  ...formData,
                  verifiedOnly: !formData.verifiedOnly,
                })
              }
              className={`relative w-12 h-6 rounded-full transition-colors ${
                formData.verifiedOnly ? "bg-brand-orange" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  formData.verifiedOnly ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="p-4 sm:p-5">
        <div className="max-w-4xl mx-auto pt-15">
          <Button
            variant="primary"
            fullWidth
            onClick={handleNext}
            className="text-[16px] sm:text-[17px]"
          >
            Review and post publicly
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Page;
