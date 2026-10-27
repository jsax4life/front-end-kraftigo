"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Button from "@/components/ui/button";
import Image from "next/image";
import {
  ArrowLeft,
  Briefcase,
  CreditCard,
  Shield,
  CheckCircle2,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import toast from "react-hot-toast";
import Loader from "@/components/ui/loader";
import { getServiceSkillGroups } from "@/lib/api/services";
import {
  getVerificationDraft,
  getVerificationMyStatus,
  saveVerificationDraft,
  patchVerificationDraft,
  shouldRedirectToDiditKyc,
  shouldRouteToKrafterProfileOnboarding,
} from "@/lib/api/verification";
import { isNotEmpty } from "@/utils/validation";
import { Checkbox } from "@/components/ui/Checkbox";
import { LegalModal } from "@/components/ui/LegalModal";
import { TermsContent } from "@/components/ui/TermsContent";
import { PrivacyContent } from "@/components/ui/PrivacyContent";
import { GENDER_SELECT_OPTIONS, isValidGenderSelection } from "@/lib/genderOptions";
import NationalityFieldHint from "@/components/shared/NationalityFieldHint";

const Page = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const { user, isLoading } = useAuthStore();
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    nationality: "",
    termsAccepted: false,
    streetNo: "",
    postCode: "",
    city: "",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // const [citySearch, setCitySearch] = useState("");

  const handleInputChange = (
    field: string,
    value: string | boolean | File | null,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Check if current step is valid
  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return true; // Intro step is always valid
      case 2:
        return (
          isNotEmpty(formData.firstName) &&
          isNotEmpty(formData.lastName) &&
          isNotEmpty(formData.gender) &&
          isValidGenderSelection(formData.gender) &&
          isNotEmpty(formData.dateOfBirth) &&
          isNotEmpty(formData.nationality) &&
          formData.termsAccepted !== false
        );
      case 3:
        return (
          isNotEmpty(formData.streetNo) &&
          isNotEmpty(formData.postCode) &&
          isNotEmpty(formData.city)
        );
      default:
        return false;
    }
  };

  // Navigate to next step
  const handleNext = async () => {
    if (currentStep < totalSteps) {
      if (currentStep === 3) {
        await handleSubmit();
      } else {
        setCurrentStep(currentStep + 1);
      }
    } else {
      // Verification onboarding is done; continue into profile completion flow
      router.push("/tasker/dashboard");
    }
  };

  // Navigate to previous step
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  // Submit form
  const handleSubmit = async () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "kraftigo_tasker_fullName",
        formData.firstName + " " + formData.lastName,
      );
    }
  };

  return (
    <main className="relative w-full min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {isLoading ? (
        <Loader />
      ) : (
        <div className="w-full max-w-4xl mx-auto min-h-screen flex flex-col py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={handleBack}
              className="text-2xl hover:opacity-70 transition-opacity"
            >
              <ArrowLeft />
            </button>
            {currentStep > 1 && (
              <span className="text-[14px] text-gray-500 font-poppins">
                Step {currentStep - 1} of {totalSteps - 1}
              </span>
            )}
          </div>

          {/* Step Content */}
          <div className="flex-1">
            {/* Step 1: Intro */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex flex-col items-center mb-2">
                  <Image
                    src="/taskerLogo.svg"
                    alt="kraftigo logo"
                    width={150}
                    height={50}
                    className="mb-8"
                  />
                  <div className="w-full relative h-40 rounded-2xl overflow-hidden mb-4">
                    <Image
                      src="/get-started.png"
                      alt="Become a Krafter"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

                <h1 className="text-[32px] font-gerat font-bold leading-tight mb-4">
                  Become a kraftigo Krafter
                </h1>

                <p className="text-[15px] font-poppins text-gray-600 mb-8 leading-relaxed">
                  Join our community of professionals. To maintain a safe and
                  professional marketplace, all Krafters must meet the following
                  requirements:
                </p>

                <div className="space-y-6">
                  {[
                    {
                      icon: (
                        <div className="p-3 bg-[#0000FF1A] text-blue-600 rounded-xl">
                          <Briefcase size={22} />
                        </div>
                      ),
                      title: "Must be legally allowed to work",
                      desc: "You must be eligible to work in your current location",
                    },
                    {
                      icon: (
                        <div className="p-3 bg-[#0000FF1A] text-blue-600 rounded-xl">
                          <CreditCard size={22} />
                        </div>
                      ),
                      title: "Identity verification is required",
                      desc: "A valid government issued ID is required for screening",
                    },
                    {
                      icon: (
                        <div className="p-3 bg-[#0000FF1A] text-blue-600 rounded-xl">
                          <Shield size={22} />
                        </div>
                      ),
                      title: "Approval needed before jobs",
                      desc: "Our team will review your profile before you can start",
                    },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex items-center gap-4 pb-3">
                        {item.icon}
                        <div className="flex-1">
                          <h4 className="text-[16px] font-gerat font-bold text-[#1D2939] mt-1.5">
                            {item.title}
                          </h4>
                          <p className="text-[13px] font-poppins text-gray-500">
                            {item.desc}
                          </p>
                        </div>
                        <div className="text-blue-600 -mt-8">
                          <CheckCircle2
                            size={24}
                            className="fill-blue-600 text-white"
                          />
                        </div>
                      </div>
                      <hr className="w-full text-[#0000001A]" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Basic Info */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-semibold mb-2">
                  Tell Us About You
                </h1>
                <p className="text-[16px] font-poppins text-[#2B2F32] mb-8">
                  Enter your details exactly as on your ID
                </p>
                <Input
                  label="First Name"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={(value) => handleInputChange("firstName", value)}
                  required
                />
                <Input
                  label="Last Name"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={(value) => handleInputChange("lastName", value)}
                  required
                />
                <Select
                  label="Gender"
                  placeholder="Select gender"
                  value={formData.gender}
                  onChange={(value) => handleInputChange("gender", value)}
                  options={GENDER_SELECT_OPTIONS}
                  required
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  placeholder="Date of Birth"
                  value={formData.dateOfBirth}
                  onChange={(value) => handleInputChange("dateOfBirth", value)}
                  required
                />
                <Select
                  label="Nationality"
                  placeholder="German"
                  value={formData.nationality}
                  onChange={(value) => handleInputChange("nationality", value)}
                  options={[
                    {
                      value: "German",
                      label: "German",
                    },
                    {
                      value: "Ghanaian",
                      label: "Ghanaian",
                    },
                  ]}
                  required
                />
                <NationalityFieldHint />

                <div>
                  <Checkbox
                    checked={formData.termsAccepted}
                    onChange={(checked: boolean) =>
                      handleInputChange("termsAccepted", checked)
                    }
                    labelNode={
                      <span className="text-[12px] font-poppins text-gray-700 leading-relaxed -mt-2">
                        I confirm that I have read, understood, and agree to be
                        bound by the{" "}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowTermsModal(true);
                          }}
                          className="text-brand-blue underline underline-offset-2 font-semibold hover:opacity-75 transition-opacity"
                        >
                          Terms of Use
                        </button>{" "}
                        and{" "}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowPrivacyModal(true);
                          }}
                          className="text-brand-blue underline underline-offset-2 font-semibold hover:opacity-75 transition-opacity"
                        >
                          Privacy Policy
                        </button>{" "}
                        of Kraftigö
                      </span>
                    }
                  />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-semibold mb-2">
                  Tell us about you
                </h1>
                <p className="text-[14px] font-poppins text-[#2B2F32] mb-8 font-bold">
                  Enter your current home address and we will help you find jobs
                  near you
                </p>
                <Input
                  label="Street and house number"
                  placeholder="Street and house number"
                  value={formData.streetNo}
                  onChange={(value) => handleInputChange("streetNo", value)}
                  required
                />
                <Input
                  label="Post code"
                  placeholder="Post code"
                  value={formData.postCode}
                  onChange={(value) => handleInputChange("postCode", value)}
                  required
                />
                <Input
                  label="City"
                  placeholder="City"
                  value={formData.city}
                  onChange={(value) => handleInputChange("city", value)}
                  required
                />
              </div>
            )}
          </div>

          {/* <button className="fixed bottom-40 right-4 sm:right-6 lg:right-8 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-xl font-bold border border-gray-200 hover:shadow-xl transition-shadow">
            ?
          </button> */}

          <div className="mt-auto space-y-4">
            {currentStep === 1 && (
              <div className="text-center text-[14px] font-poppins pt-8 pb-3">
                <Button
                  variant="primary"
                  onClick={handleNext}
                  fullWidth
                  disabled={!isStepValid()}
                  className="py-4 text-[16px] font-gerat font-bold"
                >
                  Continue
                </Button>
              </div>
            )}
            {currentStep === 2 && (
              <div className="text-center text-[14px] font-poppins pt-5">
                <Button
                  variant="primary"
                  onClick={handleNext}
                  fullWidth
                  disabled={!isStepValid()}
                  className="py-4 text-[16px] font-gerat font-bold"
                >
                  Continue
                </Button>
              </div>
            )}

            {currentStep === 3 && (
              <div className="text-center text-[14px] font-poppins pt-5">
                <Button
                  variant="primary"
                  onClick={handleNext}
                  fullWidth
                  disabled={!isStepValid()}
                  className="py-4 text-[16px] font-gerat font-bold"
                >
                  Continue
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Terms of Use Modal */}
      <LegalModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="Terms of Use"
      >
        <TermsContent initialTab="krafter" />
      </LegalModal>

      {/* Privacy Policy Modal */}
      <LegalModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title="Privacy Policy"
      >
        <PrivacyContent />
      </LegalModal>
    </main>
  );
};

export default Page;
