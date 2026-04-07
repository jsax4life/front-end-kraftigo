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

  useEffect(() => {
    fetchKrafterPayoutStatus().finally(() => setIsLoading(false));
  }, [fetchKrafterPayoutStatus]);

  const handleInputChange = (field: string, value: string | File | null) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBack = () => {
    router.back();
  };

  const handleSubmit = async (isDraft = false) => {
    // If finishing submission, ensure both are provided.
    // If drafting, at least one needs to be provided.
    if (!formData.ibanAcctNumber || !formData.bicSwiftCode) {
      if (!isDraft) {
        toast.error("Please fill in both IBAN and BIC to submit.");
        return;
      }
      if (!formData.ibanAcctNumber && !formData.bicSwiftCode) {
        toast.error("Please enter at least one field to save as a draft.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await submitPayoutDetails({
        iban: formData.ibanAcctNumber.replace(/\s+/g, ""),
        bic: formData.bicSwiftCode.replace(/\s+/g, ""),
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
          <Input
            label="IBAN"
            placeholder={payoutStatus?.payout?.ibanMasked || "DE02 1223 1223 1223 1223 1223 1223"}
            value={formData.ibanAcctNumber}
            onChange={(value) => {
              // Country is fixed to Germany in this flow.
              handleInputChange("ibanAcctNumber", value);
            }}
            required
          />
          <Input
            label="BIC"
            placeholder={payoutStatus?.payout?.bicMasked || "0000 0000"}
            value={formData.bicSwiftCode}
            onChange={(value) => {
              handleInputChange("bicSwiftCode", value);
            }}
            required
          />
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
