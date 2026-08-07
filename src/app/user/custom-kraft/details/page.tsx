"use client";

import { ArrowLeft, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import ProgressStepper from "../components/ProgressStepper";
import AddressModal from "@/components/shared/AddressModal";
import { useAddressStore } from "@/store/useAddressStore";
import { useCustomKraftsStore } from "@/store/useCustomKraftsStore";
import type { CustomKraftFrequency } from "@/lib/api/custom-krafts";
import { useTranslations } from "next-intl";

// ─── Frequency label → API enum map ──────────────────────────────────────────
const FREQUENCY_MAP: Record<string, CustomKraftFrequency> = {
  "Just Once": "ONCE",
  "Weekly": "WEEKLY",
  "Every 2 weeks": "BIWEEKLY",
  "Monthly": "MONTHLY",
};

const Page = () => {
  const router = useRouter();

  // ─── Stores ─────────────────────────────────────────────────────────────────
  const {
    pendingDraftData,
    setPendingDraftData,
    selectedKraft,
    updateStep2,
    error,
    clearError,
    isSubmitting,
  } = useCustomKraftsStore();
  const {
    addresses,
    selectedAddressId,
    currentAddress,
    selectAddress,
    addAddress,
    removeAddress,
    getCurrentLocation,
    loadAddresses,
  } = useAddressStore();
  const t = useTranslations("customKraft");
  const td = useTranslations("customKraft.detailsStep");
  const tn = useTranslations("customKraft.nav");

  // ─── Local state ─────────────────────────────────────────────────────────────
  const [bookingHours, setBookingHours] = useState(1);
  const [frequency, setFrequency] = useState(td("freqOptions.justOnce"));
  const [showAddressModal, setShowAddressModal] = useState(false);

  const frequencyOptions = [
    td("freqOptions.justOnce"),
    td("freqOptions.weekly"),
    td("freqOptions.every2Weeks"),
    td("freqOptions.monthly"),
  ];

  // Map localized frequency back to English enum for API
  const getFrequencyEnum = (localizedFreq: string) => {
    if (localizedFreq === td("freqOptions.weekly")) return FREQUENCY_MAP["Weekly"];
    if (localizedFreq === td("freqOptions.every2Weeks")) return FREQUENCY_MAP["Every 2 weeks"];
    if (localizedFreq === td("freqOptions.monthly")) return FREQUENCY_MAP["Monthly"];
    return FREQUENCY_MAP["Just Once"];
  };

  // ─── Show store errors as toasts ─────────────────────────────────────────────
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  // Load saved addresses from backend on mount
  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  // ─── Guard: redirect back if neither pending nor saved draft exists ───────────
  useEffect(() => {
    if (!pendingDraftData && !selectedKraft) {
      router.replace("/user/custom-kraft/description");
    }
  }, [pendingDraftData, selectedKraft, router]);

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleNext = async () => {
    if (!selectedAddressId) {
      toast.error(td("selectAddressError"));
      return;
    }

    const step2Fields = {
      addressId: selectedAddressId,
      bookingHours,
      frequency: getFrequencyEnum(frequency),
    };

    if (pendingDraftData) {
      // ── First pass: merge Step 2 into pending data — Budget page creates the draft
      setPendingDraftData({ ...pendingDraftData, ...step2Fields });
      router.push("/user/custom-kraft/budget");
    } else if (selectedKraft) {
      // ── Returning to update an existing draft
      try {
        await updateStep2(selectedKraft.id, step2Fields);
        router.push("/user/custom-kraft/budget");
      } catch {
        // error handled by useEffect above
      }
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedKraft || !selectedAddressId) return;
    try {
      await updateStep2(selectedKraft.id, {
        addressId: selectedAddressId,
        bookingHours,
        frequency: getFrequencyEnum(frequency),
      });
      toast.success(tn("draftSaved"));
    } catch {
      // error handled by useEffect
    }
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
          {t("requestACustomKraft")}
        </h1>

        <ProgressStepper currentStep={2} />

        <div className="space-y-6">
          {/* Enter Your Address */}
          <div className="border-b border-[#0000001A] pb-8">
            <h2 className="text-[18px] sm:text-[20px] font-poppins font-semibold text-gray-900 mb-3">
              {td("enterYourAddress")}
            </h2>
            <p className="text-[13px] font-poppins font-semibold text-gray-700 mb-2">
              {td("savedAddress")}
            </p>
            <div className="p-4 bg-[#F6F6F6] rounded-xl flex items-center gap-3 mb-3">
              <div className="w-5 h-5 flex items-center justify-center">
                  <div className="w-3 h-3 bg-gray-900 rounded-full" />
              </div>
              <span className="text-[14px] font-poppins text-gray-900">
                {currentAddress}
              </span>
            </div>
            <button
              onClick={() => setShowAddressModal(true)}
              className="w-full p-4 bg-[#F6F6F6] rounded-xl text-[14px] font-poppins text-gray-600 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              {td("addNewLocation")}
            </button>
          </div>

          {/* Booking Hours */}
          <div className="border-b border-[#0000001A] pb-8">
            <h3 className="text-[16px] sm:text-[18px] font-poppins font-semibold text-gray-900 mb-2">
              {td("bookingHours")}
            </h3>
            <p className="text-[13px] font-poppins text-gray-600 mb-3">
              {td("howManyHours")}
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
              {td("frequency")}
            </h3>
            <p className="text-[13px] font-poppins text-gray-600 mb-3">
              {td("howOften")}
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
            disabled={isSubmitting}
            className="w-full py-4 bg-brand-orange text-white text-[16px] font-poppins font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60"
          >
            {isSubmitting ? tn("saving") : tn("next")}
          </button>

          {/* Save as draft — only for returning users with an existing draft */}
          {selectedKraft && (
            <button
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              className="w-full text-[14px] font-poppins text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
            >
              {tn("saveAsDraft")}
            </button>
          )}
        </div>
      </div>

      {/* Address Modal */}
      <AddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        savedAddresses={addresses}
        selectedAddressId={selectedAddressId || ""}
        onSelectAddress={(addressId) => {
          void selectAddress(addressId).then(() => {
            setShowAddressModal(false);
          });
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
    </div>
  );
};

export default Page;
