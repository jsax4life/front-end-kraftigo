"use client";

import { ArrowLeft, Plus, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import PhotoUploader, { Photo } from "@/components/shared/PhotoUploader";
import ProgressStepper from "../components/ProgressStepper";
import DatePickerModal from "@/components/shared/DatePickerModal";
import { useCustomKraftsStore } from "@/store/useCustomKraftsStore";
import { useServicesStore } from "@/store/useServicesStore";

// ─── Time slot display → HH:mm value map ──────────────────────────────────────
const TIME_MAP: Record<string, string> = {
  "08:00 AM": "08:00",
  "10:00 AM": "10:00",
  "1:00 PM": "13:00",
  "3:00 PM": "15:00",
  "6:00 PM": "18:00",
};

// Simple UUID v4 validator – backend expects roughCategoryId as UUID
const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

const Page = () => {
  const router = useRouter();

  // ─── Store ──────────────────────────────────────────────────────────────────
  const { setPendingDraftData } = useCustomKraftsStore();
  const { categories, fetchCategories } = useServicesStore();

  // ─── Local state ────────────────────────────────────────────────────────────
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [roughCategoryId, setRoughCategoryId] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [customTime, setCustomTime] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  // ─── Load categories on mount ───────────────────────────────────────────────
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ─── Show store errors as toasts ────────────────────────────────────────────
  // (No API calls on this page — errors come from the Details page onward)

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  // Format a HH:mm string for the API (scheduledDate belongs in Step 2, but
  // the UI exposes it here; we carry it forward in the store's selectedKraft JSON
  // and pass it to Step 2 automatically).
  const scheduledDate = selectedDate
    ? selectedDate.toISOString().split("T")[0] // "YYYY-MM-DD"
    : undefined;
  const scheduledTime =
    selectedTime && selectedTime !== "Custom"
      ? TIME_MAP[selectedTime]
      : selectedTime === "Custom" && customTime
      ? customTime
      : undefined;

  // ─── Navigation ─────────────────────────────────────────────────────────────
  const handleNext = () => {
    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    // Collect File objects (photos are only available here as File objects)
    const filePhotos = photos.flatMap((p) => (p.file ? [p.file] : []));

    // Only send roughCategoryId to backend if it's a valid UUID (from real categories)
    // - If user chooses "other" or a fallback option, we omit it so validation passes.
    const finalCategoryId =
      roughCategoryId &&
      roughCategoryId !== "other" &&
      isUuid(roughCategoryId)
        ? roughCategoryId
        : undefined;

    // Save Step 1 data to the store — the Details page will create the real
    // API draft once it also has addressId, bookingHours, frequency, and expiryOption.
    setPendingDraftData({
      description,
      roughCategoryId: finalCategoryId,
      scheduledDate,
      scheduledTime,
      photos: filePhotos,
    });

    router.push("/user/custom-kraft/details");
  };

  const timeSlots = [
    "08:00 AM",
    "10:00 AM",
    "1:00 PM",
    "3:00 PM",
    "6:00 PM",
    "Custom",
  ];

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

          {/* Rough Category — populated from API */}
          <div className="border-b border-[#0000001A] pb-7">
            <h3 className="text-[16px] sm:text-[18px] font-poppins font-semibold text-gray-900 mb-3">
              Rough Category
            </h3>
            <div className="relative">
              <select
                value={roughCategoryId}
                onChange={(e) => setRoughCategoryId(e.target.value)}
                className="w-full p-4 bg-[#F6F6F6] rounded-xl text-[14px] sm:text-[15px] font-poppins border border-[#0000001A] text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-orange appearance-none cursor-pointer"
              >
                <option value="">Select a category</option>
                {categories.length > 0 ? (
                  <>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                    <option value="other">Other</option>
                  </>
                ) : (
                  // Fallback options while categories load
                  <>
                    <option value="gardening">Gardening &amp; Outdoor Help</option>
                    <option value="moving">Moving</option>
                    <option value="laundry">Laundry</option>
                    <option value="errands">Errands</option>
                    <option value="home-repairs">Home repairs</option>
                    <option value="other">Other</option>
                  </>
                )}
              </select>
              <ChevronDown
                size={20}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
            
            {/* Custom Category Input (shown when 'other' is selected) */}
            {roughCategoryId === "other" && (
              <div className="mt-3">
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Please specify the type of service you need..."
                  className="w-full p-4 bg-[#F6F6F6] rounded-xl text-[14px] sm:text-[15px] font-poppins border border-[#0000001A] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange"
                />
              </div>
            )}
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
            
            {/* Custom Time Input (shown when 'Custom' is selected) */}
            {selectedTime === "Custom" && (
              <div className="mt-3">
                <input
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="w-full p-3 bg-[#F6F6F6] rounded-xl text-[14px] sm:text-[15px] font-poppins border border-[#0000001A] text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-orange"
                />
              </div>
            )}
          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={!description.trim()}
            className="w-full py-4 bg-brand-orange text-white text-[16px] font-poppins font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60"
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
        onSelectDate={(date) => setSelectedDate(date)}
      />
    </div>
  );
};

export default Page;
