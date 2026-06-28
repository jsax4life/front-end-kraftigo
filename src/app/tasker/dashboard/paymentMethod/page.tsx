"use client";

import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { useProfileStore } from "@/store/useProfileStore";
import toast from "react-hot-toast";
import Loader from "@/components/ui/loader";

const Page = () => {
  const router = useRouter();

  const {
    payoutStatus,
    fetchKrafterPayoutStatus,
    submitPayoutDetails,
  } = useProfileStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    ibanAcctNumber: "",
    bicSwiftCode: "",
  });

  const [fieldErrors, setFieldErrors] = useState<{ ibanAcctNumber?: string; bicSwiftCode?: string }>({});

  useEffect(() => {
    fetchKrafterPayoutStatus().finally(() => setIsLoading(false));
  }, [fetchKrafterPayoutStatus]);

  // ── Validation helpers ────────────────────────────────────────────────────

  const validateIban = (raw: string): string | null => {
    // raw = value without spaces
    if (!raw) return null; // empty is handled by presence check
    if (!/^[A-Z]{2}/.test(raw)) return "IBAN must start with a 2-letter country code (e.g. DE).";
    if (raw.length !== 22) return `IBAN must be exactly 22 characters (currently ${raw.length}).`;
    return null;
  };

  const validateBic = (raw: string): string | null => {
    if (!raw) return null;
    if (raw.length !== 8 && raw.length !== 11) return `BIC must be 8 or 11 characters (currently ${raw.length}).`;
    return null;
  };

  // ── Input handler ─────────────────────────────────────────────────────────

  const handleInputChange = (field: string, value: string | File | null) => {
    let finalValue = value;
    if (typeof value === "string") {
      if (field === "ibanAcctNumber") {
        // Strip non-alphanumeric, capitalize, hard-cap at 22 raw chars, then space every 4
        const clean = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 22);
        finalValue = clean.replace(/(.{4})/g, "$1 ").trim();
        // Clear any existing error as the user edits (errors are only set on submit)
        if (fieldErrors.ibanAcctNumber) setFieldErrors((prev) => ({ ...prev, ibanAcctNumber: undefined }));
      } else if (field === "bicSwiftCode") {
        // Strip non-alphanumeric, capitalize, hard-cap at 11 raw chars
        const clean = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 11);
        finalValue = clean;
        if (fieldErrors.bicSwiftCode) setFieldErrors((prev) => ({ ...prev, bicSwiftCode: undefined }));
      }
    }

    setFormData((prev) => ({
      ...prev,
      [field]: finalValue,
    }));
  };

  const handleBack = () => {
    router.back();
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (isDraft = false) => {
    const rawIban = formData.ibanAcctNumber.replace(/\s+/g, "");
    const rawBic  = formData.bicSwiftCode.replace(/\s+/g, "");

    // Presence check
    if (!isDraft && (!rawIban || !rawBic)) {
      toast.error("Please fill in both IBAN and BIC to submit.");
      return;
    }
    if (isDraft && !rawIban && !rawBic) {
      toast.error("Please enter at least one field to save as a draft.");
      return;
    }

    // Structural validation — run on whichever fields are filled
    const ibanErr = rawIban ? validateIban(rawIban) : null;
    const bicErr  = rawBic  ? validateBic(rawBic)   : null;

    if (ibanErr || bicErr) {
      setFieldErrors({ ibanAcctNumber: ibanErr ?? undefined, bicSwiftCode: bicErr ?? undefined });
      toast.error("Please fix the errors before continuing.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitPayoutDetails({
        iban: rawIban,
        bic: rawBic,
        submitAsDraft: isDraft,
      });

      toast.success(isDraft ? "Draft saved successfully!" : "Payout details submitted successfully!");
      router.push("/tasker/dashboard?modal=open");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save payout details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl mx-auto min-h-screen flex flex-col py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={handleBack}
              className="text-2xl hover:opacity-70 transition-opacity"
            >
              <ArrowLeft />
            </button>

            <span className="text-[14px] text-gray-500 font-poppins">
              Step 6 of 6
            </span>
          </div>
          <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-2">
            Payout Setup
          </h1>
          <p className="text-[16px] font-poppins text-[#2B2F32] mb-8">
            Add your payment information
          </p>
          <div>
            <Input
              label="IBAN"
              placeholder={payoutStatus?.payout?.ibanMasked || "DE02 1223 1223 1223 1223 1223 1223"}
              value={formData.ibanAcctNumber}
              onChange={(value) => handleInputChange("ibanAcctNumber", value)}
              required
            />
            {fieldErrors.ibanAcctNumber && (
              <p className="mt-1.5 text-[12px] font-poppins text-red-500">{fieldErrors.ibanAcctNumber}</p>
            )}
          </div>
          <div>
            <Input
              label="BIC"
              placeholder={payoutStatus?.payout?.bicMasked || "DEUTDEDB"}
              value={formData.bicSwiftCode}
              onChange={(value) => handleInputChange("bicSwiftCode", value)}
              required
            />
            {fieldErrors.bicSwiftCode && (
              <p className="mt-1.5 text-[12px] font-poppins text-red-500">{fieldErrors.bicSwiftCode}</p>
            )}
          </div>
        </div>
        <div className="text-center text-[14px] font-poppins mt-auto pb-3">
          <Button
            variant="primary"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            fullWidth
            className="py-4 text-[16px] font-gerat font-bold"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
            className="font-bold mt-3 disabled:opacity-50"
          >
            Save as Draft
          </button>
        </div>
      </div>
    </div>
  );
};

export default Page;
