"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Check, MapPin, Plus, Clock } from "lucide-react";
import Button from "@/components/ui/button";
import AddressModal from "@/components/shared/AddressModal";
import DatePickerModal from "@/components/shared/DatePickerModal";
import TimePickerModal, { formatTime12h } from "@/components/shared/TimePickerModal";
import PhotoUploader, { Photo } from "@/components/shared/PhotoUploader";
import { useAddressStore } from "@/store/useAddressStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthPromptStore } from "@/store/useAuthPromptStore";
import { useBookingsStore } from "@/store/useBookingsStore";
import toast from "react-hot-toast";
import { formatLocalDateYmd, isDateTimeTooSoon, isSameLocalDay, minScheduleTimeInputForToday } from "@/utils/date";

const BookServicePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoryId") || "";
  const categoryName = searchParams.get("category") || "Service";
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("home");

  const { isAuthenticated } = useAuthStore();
  const { openPrompt } = useAuthPromptStore();

  // Use address store
  const {
    addresses,
    selectedAddressId,
    currentAddress,
    currentLatitude,
    currentLongitude,
    selectAddress,
    addAddress,
    removeAddress,
    getCurrentLocation,
    loadAddresses,
  } = useAddressStore();

  const {
    createBookingForRecommendation,
    clearRecommendationDraftBooking,
    setPendingPublishMediaFiles,
    isSubmitting,
  } = useBookingsStore();

  interface BookServiceForm {
    selectedDate: Date | undefined;
    selectedTime: string;
    taskDetails: string;
    photos: Photo[];
    specialInstructions: string;
    consentAcknowledged: boolean;
  }

  const [formData, setFormData] = useState<BookServiceForm>({
    selectedDate: undefined,
    selectedTime: "",
    taskDetails: "",
    photos: [],
    specialInstructions: "",
    consentAcknowledged: false,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [customTime, setCustomTime] = useState("");

  const isSelectedDateToday = formData.selectedDate
    ? isSameLocalDay(formData.selectedDate, new Date())
    : false;
  const minTimeToday = minScheduleTimeInputForToday();

  const isTimeSlotDisabled = (slotValue: string) => {
    if (slotValue === "Custom" || !formData.selectedDate) return false;
    return isDateTimeTooSoon(formData.selectedDate, slotValue);
  };

  const timeSlots = [
    { display: "08:00 AM", value: "08:00" },
    { display: "10:00 AM", value: "10:00" },
    { display: "1:00 PM", value: "13:00" },
    { display: "3:00 PM", value: "15:00" },
    { display: "6:00 PM", value: "18:00" },
    { display: "Custom", value: "Custom" },
  ];

  const handleNext = async () => {
    if (!isAuthenticated) {
      openPrompt();
      return;
    }

    const resolvedTime =
      formData.selectedTime === "Custom" ? customTime.trim() : formData.selectedTime;
    if (!formData.selectedDate || !resolvedTime || !formData.taskDetails) {
      toast.error(
        !resolvedTime && formData.selectedTime === "Custom"
          ? "Please enter a custom time."
          : "Please fill in all required fields"
      );
      return;
    }
    if (formData.selectedDate && isDateTimeTooSoon(formData.selectedDate, resolvedTime)) {
      toast.error("Choose a time at least 30 minutes from now.");
      return;
    }
    if (!categoryId.trim()) {
      toast.error("Missing service category. Go back and pick a category.");
      return;
    }

    const preferredDate = formatLocalDateYmd(formData.selectedDate);
    // Prefer live GPS → selected saved address coords → block if still unavailable
    const selectedAddr = addresses.find((a) => a.id === selectedAddressId);
    let lat =
      currentLatitude != null && Number.isFinite(currentLatitude)
        ? currentLatitude
        : selectedAddr?.latitude != null && Number.isFinite(selectedAddr.latitude)
          ? selectedAddr.latitude
          : null;
    let lng =
      currentLongitude != null && Number.isFinite(currentLongitude)
        ? currentLongitude
        : selectedAddr?.longitude != null && Number.isFinite(selectedAddr.longitude)
          ? selectedAddr.longitude
          : null;

    if (lat === null || lng === null) {
      const addressToGeocode = currentAddress || selectedAddr?.address;
      if (addressToGeocode && addressToGeocode !== "Add your location") {
        try {
          toast.loading("Geocoding address...", { id: "geocode" });
          const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressToGeocode)}&format=json&limit=1`, {
            headers: { "User-Agent": "Krafitgo/1.0" },
          });
          const geoData = await geoResponse.json();
          if (geoData && geoData.length > 0) {
            lat = parseFloat(geoData[0].lat);
            lng = parseFloat(geoData[0].lon);
            toast.dismiss("geocode");
          } else {
            toast.error("Could not find coordinates for this address.", { id: "geocode" });
            return;
          }
        } catch (e) {
          toast.error("Geocoding failed. Please try another address.", { id: "geocode" });
          return;
        }
      } else {
        toast.error("Could not determine your location. Please select or add an address first.");
        return;
      }
    }

    const mediaFiles = formData.photos
      .map((p) => p.file)
      .filter((f): f is File => f instanceof File);

    const jobDescription = [
      formData.taskDetails,
      formData.specialInstructions?.trim()
        ? `Special instructions: ${formData.specialInstructions.trim()}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    try {
      const booking = await createBookingForRecommendation({
        serviceCategoryId: categoryId,
        jobTitle: categoryName,
        jobDescription,
        media: mediaFiles.length > 0 ? mediaFiles : undefined,
        address: currentAddress,
        latitude: lat,
        longitude: lng,
        preferredDate,
        preferredTime: resolvedTime,
      });

      setPendingPublishMediaFiles(mediaFiles);

      const params = new URLSearchParams({
        categoryId,
        category: categoryName,
        address: currentAddress,
        date: preferredDate,
        time: resolvedTime,
        taskDetails: formData.taskDetails,
        specialInstructions: formData.specialInstructions,
        bookingId: booking.id,
      });
      // Same coordinates as create-for-recommendation so /recommendations does not fall back to
      // a different source (e.g. address store geocoded later) and diverge from the booking.
      params.set("latitude", String(lat));
      params.set("longitude", String(lng));
      router.push(`/user/book-service/select-artisan?${params.toString()}`);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(
        ax.response?.data?.message ||
          "Could not start your booking. Please try again.",
      );
    }
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  // Load saved addresses from backend on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadAddresses();
    }
  }, [loadAddresses, isAuthenticated]);

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
            type="button"
            onClick={() => {
              clearRecommendationDraftBooking();
              router.push("/");
            }}
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
                {categoryName}
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
              Select location
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
            {timeSlots.map((time) => {
              const disabled = isTimeSlotDisabled(time.value);
              return (
              <button
                key={time.value}
                type="button"
                disabled={disabled}
                onClick={() => {
                  if (disabled) return;
                  setFormData({ ...formData, selectedTime: time.value });
                  if (time.value !== "Custom") setCustomTime("");
                }}
                className={`py-3 rounded-lg text-[13px] sm:text-[14px] font-poppins font-medium transition-colors ${
                  disabled
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : formData.selectedTime === time.value
                    ? "bg-brand-orange text-white"
                    : "bg-[#F6F6F6] text-gray-800 hover:bg-gray-100"
                }`}
              >
                {time.display}
              </button>
            );
            })}
          </div>
          {formData.selectedTime === "Custom" && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowTimePicker(true)}
                  className="w-full p-3 bg-[#F6F6F6] rounded-xl text-[14px] sm:text-[15px] font-poppins border border-[#0000001A] text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-orange text-left flex justify-between items-center"
                >
                  <span>{formatTime12h(customTime) || "Select a time"}</span>
                  <Clock size={16} className="text-gray-500" />
                </button>
              </div>
            )}
        </div>

        {/* Tell Us The Details */}
        <div className="p-4 sm:p-5 border-b border-[#0000001A]">
          <h2 className="text-[20px] sm:text-[22px] font-poppins font-medium mb-1">
            Tell Us The Details Of Your Task <span className="text-red-500">*</span>
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
          maxPhotos={3}
          title="Add Photos"
        />

        {/* Special Instructions */}
        <div className="p-4 sm:p-5">
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
            onClick={() => void handleNext()}
            disabled={
              !formData.taskDetails ||
              !formData.selectedDate ||
              !formData.selectedTime ||
              isSubmitting
            }
            className="py-4 text-[16px] sm:text-[17px] max-w-md mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving…" : "Next"}
          </Button>
        </div>
      </div>

      {/* Address Modal */}
      <AddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        savedAddresses={addresses}
        selectedAddressId={selectedAddressId || ""}
        onSelectAddress={(addressId) => {
          selectAddress(addressId);
          setShowAddressModal(false);
        }}
        onAddNewAddress={({ label, address }) => {
          addAddress({ label, address });
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
        onSelectDate={(date) => {
          setFormData((prev) => {
            const resolvedTime =
              prev.selectedTime === "Custom" ? customTime.trim() : prev.selectedTime;
            const timeInvalid = Boolean(resolvedTime && isDateTimeTooSoon(date, resolvedTime));
            return {
              ...prev,
              selectedDate: date,
              ...(timeInvalid ? { selectedTime: "" } : {}),
            };
          });
          if (customTime && isDateTimeTooSoon(date, customTime)) {
            setCustomTime("");
          }
        }}
      />

      {/* Time Picker Modal */}
      <TimePickerModal
        isOpen={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        selectedTime={customTime}
        onSelectTime={(time) => {
          if (
            formData.selectedDate &&
            isSelectedDateToday &&
            time &&
            isDateTimeTooSoon(formData.selectedDate, time)
          ) {
            toast.error("Pick a time at least 30 minutes from now.");
            setCustomTime(minTimeToday);
          } else {
            setCustomTime(time);
          }
        }}
      />
    </main>
  );
};

export default BookServicePage;
