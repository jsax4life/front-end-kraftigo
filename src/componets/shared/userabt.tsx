"use client";

import { Headset, MapPin, ChevronDown, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import Button from "@/componets/ui/button";
import Select from "../ui/select";

const Userabt = () => {
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("home");
  const [flag, setFlag] = useState("/flag.svg");

  const savedAddresses = [
    {
      id: "home",
      label: "Home",
      address: "2383 Timber Oak Drive Circuit",
    },
    {
      id: "granny",
      label: "Granny's House",
      address: "2383 Timber Oak Drive Circuit",
    },
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    // setFlag((prev) => ({
    //   ...prev,
    //   [field]: value,
    // }));
  };

  return (
    <>
      <div className="w-full px-2 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div
              className="flex items-center gap-2 text-[13px] sm:text-[14px] font-poppins cursor-pointer"
              onClick={() => setShowAddressModal(true)}
            >
              <MapPin size={16} className="text-gray-600" />
              <span className="text-gray-800">84th Str, Berlin, Germany</span>
              <ChevronDown size={16} className="text-gray-600" />
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Image
                src="/flag.svg"
                alt="flag"
                width={100}
                height={100}
                className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10"
                onClick={() => setShowLanguageModal(true)}
              />

              <div className="relative bg-[#F2F2F2] p-2 rounded-full">
                <Headset size={25} className="sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
                <div className="absolute top-1.5 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/50 z-60 flex items-end">
          <div className="bg-white rounded-t-xl w-full lg:mx-70 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 ">
              <h2 className="text-[18px] sm:text-[20px] font-poppins font-bold">
                Addresses
              </h2>
              <button
                onClick={() => setShowAddressModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={22} className="text-gray-500 " />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-6">
              <div>
                <h3 className="text-[14px] font-poppins font-semibold mb-3">
                  Saved Addresses
                </h3>
                <div className="space-y-3">
                  {savedAddresses.map((addr) => (
                    <label
                      key={addr.id}
                      className="flex items-start gap-3 cursor-pointer bg-[#F6F6F6] p-4 border border-[#0000001A] rounded-lg"
                    >
                      <input
                        type="radio"
                        name="address"
                        value={addr.id}
                        checked={selectedAddress === addr.id}
                        onChange={(e) => setSelectedAddress(e.target.value)}
                        className="mt-1 w-4 h-4 accent-black"
                      />
                      <div className="flex-1">
                        <p className="text-[14px] font-poppins font-semibold">
                          {addr.label}
                        </p>
                        <p className="text-[13px] text-gray-600 font-poppins">
                          {addr.address}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <Button variant="secondary" fullWidth>
                Add new
              </Button>

              {/* Current Location */}
              <div>
                <h3 className="text-[14px] font-poppins font-semibold mb-3">
                  Current Location
                </h3>
                <button className="w-full rounded-xl py-8 flex items-center justify-center gap-2 hover:bg-gray-200  bg-[#F6F6F6] transition-colors">
                  <div className="bg-[#FF66001A] flex items-center gap-3 px-3 py-2 rounded-full">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                    </div>
                    <span className="text-[14px] font-poppins font-semibold ">
                      Use current location
                    </span>
                  </div>
                </button>
              </div>

              {/* Done Button */}
              <Button
                variant="primary"
                fullWidth
                onClick={() => setShowAddressModal(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Language Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black/50 z-60 flex items-end">
          <div className="bg-white rounded-t-xl w-full lg:mx-70 max-h-[50vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 ">
              <h2 className="text-[18px] sm:text-[20px] font-poppins font-bold">
                Langauge
              </h2>
              <button
                onClick={() => setShowLanguageModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={22} className="text-gray-500 " />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-6">
              {/* Saved Addresses */}
              <div>
                <h3 className="text-[14px] font-qurova font-semibold mb-3">
                  Select a language
                </h3>
                <Select
                  placeholder="Select"
                  value={flag}
                  onChange={(value) => handleInputChange("flag", value)}
                  options={[{ value: "Europe", label: "EUR" }]}
                  required
                />
              </div>

              <Button
                variant="primary"
                fullWidth
                onClick={() => setShowLanguageModal(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Userabt;
