"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Check, MapPin, Plus, Camera, X } from "lucide-react";
import Button from "@/components/ui/button";
import AddressModal from "@/components/shared/AddressModal";
import DatePickerModal from "@/components/shared/DatePickerModal";
import PhotoUploader, { Photo } from "@/components/shared/PhotoUploader";
import { useAddressStore } from "@/store/useAddressStore";

const BookServicePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceName = searchParams.get("service") || "House Cleaning";
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("home");

  // Use address store
  const { addresses, currentAddress, selectAddress, addAddress, removeAddress, getCurrentLocation } = useAddressStore();

  interface BookServiceForm {
    selectedDate: Date | undefined;
    selectedTime: string;
    taskDetails: string;
    photos: Photo[];
    specialInstructions: string;
  }

  const [formData, setFormData] = useState<BookServiceForm>({
    selectedDate: undefined,
    selectedTime: "",
    taskDetails: "",
    photos: [],
    specialInstructions: "",
  });
  const [showDatePicker, setShowDatePicker] = useState(false);



  const timeSlots = [
    "08:00 AM",
    "10:00 AM",
    "1:00 PM",
    "3:00 PM",
    "6:00 PM",
    "Custom",
  ];

  const handleNext = () => {
    // Navigate to artisan selection with booking details
    const params = new URLSearchParams({
      service: serviceName,
      address: currentAddress,
      date: formData.selectedDate
        ? formData.selectedDate.toLocaleDateString()
        : "16th Jan, 2026",
      time: formData.selectedTime,
    });
    router.push(`/user/book-service/select-artisan?${params.toString()}`);
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#FFF0F0] rounded-bl-xl rounded-br-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-7 flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2">
            <span
              onClick={() => router.back()}
              className="w-9 h-9 bg-brand-orange rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-colors"
            >
              <Check size={20} className="text-white" />
            </span>
            <span
              onClick={() => router.back()}
              className="w-fit px-3 py-2.5 text-xs sm:text-sm bg-brand-orange text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-colors"
            >
              Kraft Details
            </span>
            <span className="w-9 h-9 bg-white font-bold rounded-full text-[#00000066] flex items-center justify-center text-sm">
              3
            </span>
            <span className="w-9 h-9 bg-white font-bold rounded-full text-[#00000066] flex items-center justify-center text-sm">
              4
            </span>
            <span className="w-9 h-9 bg-white font-bold rounded-full text-[#00000066] flex items-center justify-center text-sm">
              5
            </span>
          </div>
          <button
            onClick={() => router.push("/user/home")}
            className="text-brand-orange text-[12px] sm:text-[14px] font-poppins font-semibold rounded-full hover:underline"
          >
            Cancel
          </button>
        </div>

        {/* Service Header */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-3 mb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-1">
                {serviceName}
              </h1>
              <p className="text-[14px] sm:text-[15px] text-gray-600 font-poppins">
                Select a location
              </p>
              <p className="text-[14px] sm:text-[15px] text-gray-600 font-poppins">
                Select a date
              </p>
            </div>
            <Image
              src="/card.svg"
              alt="cardimg"
              width={70}
              height={70}
              className="w-16 h-16 sm:w-20 sm:h-20"
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        {/* Enter Your Address */}
        <div className="p-4 sm:p-5 border-b border-[#0000001A]">
          <h2 className="text-[20px] sm:text-[22px] font-poppins font-medium mb-3">
            Enter Your Address
          </h2>
          <p className="text-[12px] sm:text-[13px] text-gray-600 font-bold font-poppins mb-2">
            Saved Address
          </p>
          <div className="flex items-center gap-2 p-3 mb-3">
            <MapPin size={16} className="text-gray-600 shrink-0" />
            <span className="text-[14px] sm:text-[15px] font-poppins text-gray-800">
              {currentAddress}
            </span>
          </div>
          <button
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#F6F6F6] rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => setShowAddressModal(true)}
          >
            <Plus size={16} className="text-gray-600" />
            <span className="text-[14px] sm:text-[15px] font-poppins text-gray-600">
              Add new location
            </span>
          </button>
        </div>

        {/* Choose Date */}
        <div className="p-4 sm:p-5 border-b border-[#0000001A]">
          <h2 className="text-[20px] sm:text-[22px] font-poppins font-medium mb-3">
            Choose Date
          </h2>
          <button
            onClick={() => setShowDatePicker(true)}
            className="w-full flex items-center justify-left gap-2 py-2 transition-colors hover:text-brand-orange"
          >
            <span className="text-[14px] sm:text-[15px] font-poppins text-gray-800">
              {formData.selectedDate
                ? formatDate(formData.selectedDate)
                : "Select Dates"}
            </span>
            <Plus size={16} className="text-gray-600" />
          </button>
        </div>

        {/* When? */}
        <div className="p-4 sm:p-5 border-b border-[#0000001A]">
          <h2 className="text-[20px] sm:text-[22px] font-poppins font-medium mb-3">
            When?
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 pb-4">
            {timeSlots.map((time) => (
              <button
                key={time}
                onClick={() => setFormData({ ...formData, selectedTime: time })}
                className={`py-3 rounded-lg text-[13px] sm:text-[14px] font-poppins font-medium transition-colors ${
                  formData.selectedTime === time
                    ? "bg-brand-orange text-white"
                    : "bg-[#F6F6F6] text-gray-800 hover:bg-gray-100"
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        {/* Tell Us The Details */}
        <div className="p-4 sm:p-5 border-b border-[#0000001A]">
          <h2 className="text-[20px] sm:text-[22px] font-poppins font-medium mb-1">
            Tell Us The Details Of Your Task
          </h2>
          <p className="text-[12px] sm:text-[13px] font-poppins mb-2">
            Start The Conversation And Tell Your Tasker What You Need Done.
            Don&apos;t Worry, You Can Edit This Later.
          </p>
          <textarea
            value={formData.taskDetails}
            onChange={(e) =>
              setFormData({ ...formData, taskDetails: e.target.value })
            }
            placeholder="I want my clothes washed in triple cycle..."
            className="w-full h-32 sm:h-40 p-3 bg-[#F6F6F6] border border-[#0000001A] rounded-lg text-[14px] sm:text-[15px] font-poppins resize-none focus:outline-none focus:border-brand-orange"
          />
        </div>

        {/* Add Photos */}
        <PhotoUploader
          photos={formData.photos}
          onChange={(photos: Photo[]) => setFormData((prev) => ({ ...prev, photos }))}
          maxPhotos={10}
          title="Add Photos"
        />

        {/* Special Instructions */}
        <div className="p-4 sm:p-5 border-b border-[#0000001A]">
          <h2 className="text-[20px] sm:text-[22px] font-poppins font-medium mb-3">
            Special Instructions
          </h2>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <input
              type="text"
              value={formData.specialInstructions}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  specialInstructions: e.target.value,
                })
              }
              placeholder="eg. Beware of dog, Side gate is unlocked"
              className="flex-1 bg-transparent text-[14px] sm:text-[15px] font-poppins focus:outline-none pb-2"
            />
          </div>
        </div>

        <div className="pt-8 sm:pt-12 lg:pt-16 pb-10">
          <Button
            variant="primary"
            fullWidth
            onClick={handleNext}
            className="py-4 text-[16px] sm:text-[17px] max-w-md mx-auto"
          >
            Next
          </Button>
        </div>
      </div>

      {/* Address Modal */}
      <AddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        savedAddresses={addresses}
        onSelectAddress={(addressId) => {
          selectAddress(addressId);
          setShowAddressModal(false);
        }}
        onAddNewAddress={(label, address) => {
          addAddress(label, address);
          setShowAddressModal(false);
        }}
        onUseCurrentLocation={async () => {
          await getCurrentLocation();
          setShowAddressModal(false);
        }}
        onRemoveAddress={removeAddress}
      />

      {/* Date Picker Modal */}
      <DatePickerModal
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        selectedDate={formData.selectedDate}
        selectedTime={formData.selectedTime}
        onSelectDate={(date, time) => {
          setFormData({ ...formData, selectedDate: date, selectedTime: time });
        }}
      />
    </main>
  );
};

export default BookServicePage;
