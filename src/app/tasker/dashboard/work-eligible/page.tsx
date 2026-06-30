"use client";

import { useState, useEffect } from "react";
import Select from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import Image from "next/image";
import Input from "@/components/ui/input";
import { useProfileStore } from "@/store/useProfileStore";
import toast from "react-hot-toast";
import Loader from "@/components/ui/loader";

const Page = () => {
  const router = useRouter();
  
  const {
    workEligibilityStatus,
    fetchKrafterWorkEligibility,
    getUploadUrlForWorkEligibility,
    submitWorkEligibilityDocument,
  } = useProfileStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    documentType: "",
    otherDescription: "",
    idDocument: null as File | null,
  });

  // Fetch initial status on mount
  useEffect(() => {
    fetchKrafterWorkEligibility()
      .finally(() => setIsLoading(false));
  }, [fetchKrafterWorkEligibility]);

  const handleInputChange = (field: string, value: string | File | null) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBack = () => {
    router.back();
  };

  const handleSubmit = async () => {
    if (!formData.documentType) {
      toast.error("Please select a document type");
      return;
    }

    if (!formData.idDocument) {
      toast.error("Please upload a document file");
      return;
    }

    if (formData.documentType === "OTHER" && !formData.otherDescription) {
      toast.error("Please specify the document type");
      return;
    }

    setIsSubmitting(true);
    try {
      const file = formData.idDocument;

      // 1. Get pre-signed S3 URL from our backend
      const uploadCreds = await getUploadUrlForWorkEligibility({
        filename: file.name,
        mimetype: file.type || "application/octet-stream",
        fileSize: file.size,
      });

      // 2. Upload file directly to AWS S3
      await fetch(uploadCreds.uploadUrl, {
        method: "PUT",
        body: file,
        headers: uploadCreds.requiredUploadHeaders,
      });

      // 3. Mark the step as complete with the document string and type
      await submitWorkEligibilityDocument({
        documentType: formData.documentType,
        documentUrl: uploadCreds.publicUrl, // or uploadCreds.publicUrl depending on backend expectations
        otherDescription: formData.documentType === "OTHER" ? formData.otherDescription : undefined,
      });

      toast.success("Document uploaded for review!");
      router.push("/tasker/dashboard?modal=open");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit document. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader /></div>;
  }

  // Derive UI state based on the fetched status
  const canSubmit = workEligibilityStatus?.canSubmitNewDocument ?? true;
  const isAwaitingReview = workEligibilityStatus?.hasSubmittedAwaitingReview ?? false;
  
  // Create dropdown options from the API response fallback to default if not ready
  const dropdownOptions = workEligibilityStatus?.documentTypeOptions?.length 
    ? workEligibilityStatus.documentTypeOptions 
    : [
        { value: "PASSPORT_EU", label: "Passport (EU)" },
        { value: "NATIONAL_ID_CARD_EU", label: "National ID Card (EU)" },
        { value: "RESIDENCE_PERMIT", label: "Residence Permit" },
        { value: "OTHER", label: "Other" }
      ];

  return (
    <div className="relative w-full min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl mx-auto min-h-screen flex flex-col py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={handleBack}
              className="text-2xl hover:opacity-70 transition-opacity"
              disabled={isSubmitting}
            >
              <ArrowLeft />
            </button>

            <span className="text-[14px] text-gray-500 font-poppins">
              Step 2 of 6
            </span>
          </div>
          <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-4">
            Work Eligibility
          </h1>
          
          {!canSubmit && isAwaitingReview ? (
            <div className="bg-orange-50 border border-brand-orange p-5 rounded-xl">
              <p className="text-sm font-poppins text-gray-800">
                You have already submitted a work eligibility document and it is currently awaiting admin review. 
                We will notify you once your document has been approved or rejected.
              </p>
            </div>
          ) : (
            <>
              {workEligibilityStatus?.rejectedDocumentCount ? (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-4">
                  <p className="text-sm font-poppins text-red-800">
                    Your previous work eligibility submission was rejected. Please review the 
                    accepted document list and submit a valid, clear image to try again.
                  </p>
                </div>
              ) : null}

              <Select
                label="Select document type"
                placeholder="Select"
                value={formData.documentType}
                onChange={(value) => handleInputChange("documentType", value)}
                options={dropdownOptions}
                required
              />

              {formData.documentType === "OTHER" && (
                <div className="mt-4">
                  <Input
                    label="Please specify document type"
                    placeholder="e.g. Fiktionsbescheinigung"
                    value={formData.otherDescription}
                    onChange={(v) => handleInputChange("otherDescription", v)}
                    required
                  />
                </div>
              )}

              <div className="space-y-2 mt-6">
                <p className="text-[14px] font-mabry text-gray-700">
                  Upload a valid ID card or document
                </p>
                <label className="w-full rounded-2xl border border-dashed border-gray-300 bg-[#F6F6F6] p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-brand-orange transition-colors">
                  <Image src="/upload.svg" alt="icon" width={30} height={30} />
                  <span className="text-[13px] font-poppins text-gray-600 mt-2">
                    {formData.idDocument
                      ? formData.idDocument.name
                      : "Upload or take a photo of your document"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      handleInputChange("idDocument", file);
                    }}
                  />
                </label>
              </div>

              <div className="text-[13px] font-poppins text-gray-700 ml-3 mt-6">
                <p className="font-semibold mb-2">Accepted Documents include (depending on your nationality):</p>
                <ul className="list-disc pl-8 space-y-1">
                  <li>Passport (EU/EEA)</li>
                  <li>National Identity Card (EU/EEA)</li>
                  <li>Residence Permit (Aufenthaltstitel)</li>
                  <li>Fictions Certificate (Fiktionsbescheinigung)</li>
                  <li>Visa</li>
                </ul>
              </div>
            </>
          )}
        </div>
        
        {!(!canSubmit && isAwaitingReview) && (
          <div className="text-center text-[14px] font-poppins pt-8 pb-3 mt-auto">
            <Button
              variant="primary"
              onClick={handleSubmit}
              fullWidth
              disabled={isSubmitting || !formData.documentType || !formData.idDocument}
              className="py-4 text-[16px] font-gerat font-bold"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
