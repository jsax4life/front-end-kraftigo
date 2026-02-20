"use client";

import { ArrowLeft, Plus, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PhotoUploader, { Photo } from "@/components/shared/PhotoUploader";
import ProgressStepper from "../components/ProgressStepper";
import DatePickerModal from "@/components/shared/DatePickerModal";

const Page = () => {
  const router = useRouter();

  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [category, setCategory] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const categories = [
    "Gardening & Outdoor Help",
    "Moving",
    "Laundry",
    "Errands",
    "Home repairs",
    "Other",
  ];

  const timeSlots = [
    "08:00 AM",
    "10:00 AM",
    "1:00 PM",
    "3:00 PM",
    "6:00 PM",
    "Custom",
  ];

  const handleNext = () => {
    // Save to localStorage as draft
    const formData = {
      description,
      photos,
      category,
      selectedDate,
      selectedTime,
    };
    localStorage.setItem("customKraftDraft", JSON.stringify(formData));

    // Navigate to details page with data
    const params = new URLSearchParams({
      description,
      category,
      date: selectedDate ? selectedDate.toLocaleDateString() : "",
      time: selectedTime,
    });
    router.push(`/user/home/custom-kraft/details?${params.toString()}`);
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
    <div className="min-h-screen bg-white pb-24">
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-6 p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-900" />
        </button>

        <h1 className="text-[24px] sm:text-[28px] font-gerat font-bold text-gray-900 mb-6">
          Request A Custom Kraft
        </h1>

        <ProgressStepper currentStep={1} />

        <div className="space-y-6">
          {/* What Do You Need Help With */}
          <div className="border-b border-[#0000001A] pb-5">
            <h2 className="text-[18px] sm:text-[20px] font-poppins font-semibold text-gray-900 mb-2">
              What Do You Need Help With?
            </h2>
            <p className="text-[13px] sm:text-[14px] font-poppins text-gray-600 mb-3">
              The More Details You Provide, The Better Krafters Can Understand
              The Job
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="I want my clothes washed in a triple cycle..."
              className="w-full h-32 p-4 bg-[#F6F6F6] rounded-xl text-[14px] sm:text-[15px] font-poppins text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange resize-none border border-[#0000001A]"
            />
          </div>

          {/* Add Photos */}
          <PhotoUploader
            photos={photos}
            onChange={(newPhotos) => setPhotos(newPhotos)}
            maxPhotos={10}
            title="Add Photos"
          />

          {/* Rough Category */}
          <div className="border-b border-[#0000001A] pb-7">
            <h3 className="text-[16px] sm:text-[18px] font-poppins font-semibold text-gray-900 mb-3">
              Rough Category
            </h3>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-4 bg-[#F6F6F6] rounded-xl text-[14px] sm:text-[15px] font-poppins border border-[#0000001A] text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-orange appearance-none cursor-pointer"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={20}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Choose Date */}
          <div className="border-b border-[#0000001A] pb-7">
            <h3 className="text-[16px] sm:text-[18px] font-poppins font-semibold text-gray-900 mb-3">
              Choose Date
            </h3>
            <button
              onClick={() => setShowDatePicker(true)}
              className="flex gap-2 items-center"
            >
              <span>
                {selectedDate ? formatDate(selectedDate) : "Select Dates"}
              </span>
              <Plus size={20} className="text-black" />
            </button>
          </div>

          {/* When */}
          <div className="border-b border-[#0000001A] pb-7 mb-20">
            <h3 className="text-[16px] sm:text-[18px] font-poppins font-semibold text-gray-900 mb-3">
              When?
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`p-3 rounded-xl text-[13px] sm:text-[14px] font-poppins font-medium transition-colors ${
                    selectedTime === time
                      ? "bg-brand-orange text-white"
                      : "bg-[#F6F6F6] text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {time}
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
        </div>
      </div>

      {/* Date Picker Modal */}
      <DatePickerModal
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onSelectDate={(date, time) => {
          setSelectedDate(date);
          setSelectedTime(time);
        }}
      />
    </div>
  );
};

export default Page;
