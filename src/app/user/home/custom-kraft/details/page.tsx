"use client";

import { ArrowLeft, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import ProgressStepper from "../components/ProgressStepper";
import AddressModal from "@/componets/shared/AddressModal";

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [savedAddress, setSavedAddress] = useState("Hauptstraße 123 - 10115, Berlin");
  const [bookingHours, setBookingHours] = useState(1);
  const [frequency, setFrequency] = useState("Just Once");
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState("home");

  // Load previous data from URL params
  const [previousData, setPreviousData] = useState({
    description: "",
    category: "",
    date: "",
    time: "",
  });

  useEffect(() => {
    setPreviousData({
      description: searchParams.get("description") || "",
      category: searchParams.get("category") || "",
      date: searchParams.get("date") || "",
      time: searchParams.get("time") || "",
    });
  }, [searchParams]);

  const frequencyOptions = ["Just Once", "Weekly", "Every 2 weeks", "Monthly"];

  const handleBack = () => {
    // Navigate back to description with current data
    const params = new URLSearchParams({
      description: previousData.description,
      category: previousData.category,
      date: previousData.date,
      time: previousData.time,
    });
    router.push(`/user/home/custom-kraft/description?${params.toString()}`);
  };

  const handleNext = () => {
    // Save to localStorage as draft
    const formData = {
      ...previousData,
      savedAddress,
      bookingHours,
      frequency,
    };
    localStorage.setItem("customKraftDraft", JSON.stringify(formData));

    // Navigate to budget page with all data
    const params = new URLSearchParams({
      description: previousData.description,
      category: previousData.category,
      date: previousData.date,
      time: previousData.time,
      address: savedAddress,
      hours: bookingHours.toString(),
      frequency,
    });
    router.push(`/user/home/custom-kraft/budget?${params.toString()}`);
  };

  const handleSaveDraft = () => {
    const formData = {
      ...previousData,
      savedAddress,
      bookingHours,
      frequency,
    };
    localStorage.setItem("customKraftDraft", JSON.stringify(formData));
    console.log("Draft saved");
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto">
        <button
          onClick={handleBack}
          className="mb-6 p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-900" />
        </button>

        <h1 className="text-[24px] sm:text-[28px] font-gerat font-bold text-gray-900 mb-6">
          Request A Custom Kraft
        </h1>

        <ProgressStepper currentStep={2} />

        <div className="space-y-6">
          {/* Enter Your Address */}
          <div className="border-b border-[#0000001A] pb-8">
            <h2 className="text-[18px] sm:text-[20px] font-poppins font-semibold text-gray-900 mb-3">
              Enter Your Address
            </h2>
            <p className="text-[13px] font-poppins font-semibold text-gray-700 mb-2">
              Saved Address
            </p>
            <div className="p-4 bg-[#F6F6F6] rounded-xl flex items-center gap-3 mb-3">
              <div className="w-5 h-5 flex items-center justify-center">
                <div className="w-3 h-3 bg-gray-900 rounded-full" />
              </div>
              <span className="text-[14px] font-poppins text-gray-900">
                {savedAddress}
              </span>
            </div>
            <button 
              onClick={() => setShowAddressModal(true)}
              className="w-full p-4 bg-[#F6F6F6] rounded-xl text-[14px] font-poppins text-gray-600 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Add new location
            </button>
          </div>

          {/* Booking Hours */}
          <div className="border-b border-[#0000001A] pb-8">
            <h3 className="text-[16px] sm:text-[18px] font-poppins font-semibold text-gray-900 mb-2">
              Booking Hours
            </h3>
            <p className="text-[13px] font-poppins text-gray-600 mb-3">
              How many hours do you want to book
            </p>
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => setBookingHours(Math.max(1, bookingHours - 1))}
                className="w-12 h-12 bg-[#FFE5D9] rounded-full flex items-center justify-center text-brand-orange text-2xl font-bold hover:bg-orange-200 transition-colors"
              >
                −
              </button>
              <span className="text-[32px] font-poppins font-bold text-gray-900 min-w-15 text-center">
                {bookingHours}
              </span>
              <button
                onClick={() => setBookingHours(bookingHours + 1)}
                className="w-12 h-12 bg-[#FFE5D9] rounded-full flex items-center justify-center text-brand-orange text-2xl font-bold hover:bg-orange-200 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Frequency */}
          <div className="border-b border-[#0000001A] pb-8 mb-20">
            <h3 className="text-[16px] sm:text-[18px] font-poppins font-semibold text-gray-900 mb-2">
              Frequency
            </h3>
            <p className="text-[13px] font-poppins text-gray-600 mb-3">
              How often do you want this service
            </p>
            <div className="space-y-3">
              {frequencyOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setFrequency(option)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      frequency === option ? "border-black" : "border-gray-300"
                    }`}
                  >
                    {frequency === option && (
                      <div className="w-3 h-3 bg-black rounded-full" />
                    )}
                  </div>
                  <span className="text-[14px] font-poppins text-gray-900">
                    {option}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            className="w-full py-4 bg-brand-orange text-white text-[16px] font-poppins font-semibold rounded-xl hover:bg-orange-600 transition-colors"
          >
            Next
          </button>

          {/* Save as draft */}
          <button
            onClick={handleSaveDraft}
            className="w-full text-[14px] font-poppins text-gray-600 hover:text-gray-900 transition-colors"
          >
            Save as draft
          </button>
        </div>
      </div>

      {/* Address Modal */}
      <AddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        selectedAddressId={selectedAddressId}
        onSelectAddress={(addressId, address) => {
          setSelectedAddressId(addressId);
          setSavedAddress(address);
        }}
        onAddNewAddress={(label, address) => {
          console.log("New address added:", label, address);
          setSavedAddress(address);
        }}
        onUseCurrentLocation={() => {
          console.log("Using current location");
          setSavedAddress("Current Location");
          setShowAddressModal(false);
        }}
      />
    </div>
  );
};

export default Page;
