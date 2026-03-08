"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import ProgressStepper from "../components/ProgressStepper";
import { useCustomKraftsStore } from "@/store/useCustomKraftsStore";
import type { CustomKraftExpiryOption } from "@/lib/api/custom-krafts";

// ─── Expiry label → API enum map ──────────────────────────────────────────────
const EXPIRY_MAP: Record<string, CustomKraftExpiryOption> = {
  "24h": "24H",
  "3 days": "3DAYS",
  "1 Week": "1WEEK",
};

const Page = () => {
  const router = useRouter();

  // ─── Store ──────────────────────────────────────────────────────────────────
  const {
    selectedKraft,
    updateStep3,
    createDraft,
    uploadDraft,
    pendingDraftData,
    clearPendingDraftData,
    isSubmitting,
    error,
    clearError,
  } = useCustomKraftsStore();

  // ─── Local state ─────────────────────────────────────────────────────────────
  const [offerAmount, setOfferAmount] = useState("");
  const [openToNegotiation, setOpenToNegotiation] = useState(false);
  const [kraftExpiry, setKraftExpiry] = useState("3 days");
  const [urgentBoost, setUrgentBoost] = useState(false);

  const expiryOptions = ["24h", "3 days", "1 Week"];

  // ─── Show store errors as toasts ─────────────────────────────────────────────
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  // ─── Guard: redirect back if no draft or pending data ────────────────────────
  useEffect(() => {
    if (!pendingDraftData && !selectedKraft) {
      router.replace("/user/home/custom-kraft/description");
    }
  }, [pendingDraftData, selectedKraft, router]);

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const buildStep3Fields = () => ({
    offerAmount: offerAmount ? parseFloat(offerAmount) : undefined,
    openToNegotiation,
    expiryOption: EXPIRY_MAP[kraftExpiry],
    urgentBoost,
  });

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleNext = async () => {
    try {
      if (pendingDraftData) {
        // ── First time through: create the full draft with ALL accumulated fields
        const { photos, ...rest } = pendingDraftData;
        const step3Fields = buildStep3Fields();

        if (photos.length > 0) {
          await uploadDraft({
            ...rest,
            ...step3Fields,
          });
        } else {
          await createDraft({
            ...rest,
            ...step3Fields,
          });
        }
        clearPendingDraftData();
      } else if (selectedKraft) {
        // ── Returning to update an existing draft
        await updateStep3(selectedKraft.id, buildStep3Fields());
      }
      router.push("/user/home/custom-kraft/review");
    } catch {
      // error handled by useEffect above
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedKraft) return;
    try {
      await updateStep3(selectedKraft.id, buildStep3Fields());
      toast.success("Draft saved!");
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
          Request A Custom Kraft
        </h1>

        <ProgressStepper currentStep={3} />

        <div className="space-y-6">
          <div className="border-b border-[#0000001A] pb-8 space-y-4">
            {/* Offer Amount */}
            <div>
              <h2 className="text-[18px] sm:text-[20px] font-poppins font-semibold text-gray-900 mb-3">
                Budget
              </h2>
              <p className="text-[13px] font-poppins text-gray-700 mb-2">
                Offer Amount
              </p>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[24px] font-poppins text-gray-400">
                  €
                </span>
                <input
                  type="number"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full pl-14 pr-6 py-5 bg-[#F6F6F6] rounded-xl text-[24px] font-poppins text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange"
                />
              </div>
            </div>

            {/* Open to negotiation */}
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-1 px-1">
                <Image src="/neg.svg" alt="icon" width={18} height={18} />
                <span className="text-[14px] sm:text-[15px] font-poppins font-semibold text-gray-800">
                  Open to negotiation
                </span>
              </div>
              <button
                onClick={() => setOpenToNegotiation(!openToNegotiation)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  openToNegotiation ? "bg-brand-orange" : "bg-gray-300"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    openToNegotiation ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Kraft Expiry */}
          <div className="border-b border-[#0000001A] pb-8 space-y-4">
            <div>
              <h3 className="text-[16px] sm:text-[18px] font-poppins font-semibold text-gray-900 mb-3">
                Kraft Expiry
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {expiryOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => setKraftExpiry(option)}
                    className={`p-4 rounded-xl text-[14px] font-poppins font-medium transition-colors ${
                      kraftExpiry === option
                        ? "bg-[#FF66001A] border-2 border-brand-orange text-brand-orange"
                        : "bg-[#F6F6F6] border-2 border-transparent text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-20">
            {/* Urgent Boost */}
            <div
              className={`p-4 rounded-xl border-2 transition-colors ${
                urgentBoost
                  ? "border-brand-orange bg-[#FF66000D]"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-brand-orange rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div>
                    <h4 className="text-[15px] font-poppins font-bold text-gray-900 mb-1">
                      Urgent Boost
                    </h4>
                    <p className="text-[13px] font-poppins text-gray-600">
                      Get seen by 3x more Krafters for just €4.99
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setUrgentBoost(!urgentBoost)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    urgentBoost
                      ? "bg-brand-orange border-brand-orange"
                      : "bg-white border-gray-300"
                  }`}
                >
                  {urgentBoost && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className="w-full py-4 bg-brand-orange text-white text-[16px] font-poppins font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60"
          >
            {isSubmitting ? "Creating draft…" : "Next"}
          </button>

          {/* Save as draft — only for returning users with an existing draft */}
          {selectedKraft && (
            <button
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              className="w-full text-[14px] font-poppins text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
            >
              Save as draft
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
