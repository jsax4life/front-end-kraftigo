"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Button from "@/components/ui/button";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

const Page = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Form data state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    term1Accepted: false,
    term2Accepted: false,
    verificationCode: ["", "", "", "", "", ""],
    country: "",
    city: "",
    postal: "",
    trade: "",
    workingAs: "",
    businessRegistrationNumber: "",
    vatId: "",
    selfieImage: null as string | null,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...formData.verificationCode];
      newCode[index] = value;
      setFormData((prev) => ({
        ...prev,
        verificationCode: newCode,
      }));

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`code-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  // Check if current step is valid
  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return (
          formData.fullName.trim() !== "" &&
          formData.email.trim() !== "" &&
          formData.term1Accepted !== false &&
          formData.term2Accepted !== false
        );
      case 2:
        return formData.verificationCode.every((digit) => digit !== "");
      case 3:
        return (
          formData.country.trim() !== "" &&
          formData.city.trim() !== "" &&
          formData.postal.trim() !== ""
        );
      case 4:
        const isBasicValid = formData.trade !== "" && formData.workingAs !== "";
        const isRegisteredBusiness =
          formData.workingAs === "registered-business";
        const isBusinessFieldsValid =
          !isRegisteredBusiness ||
          (formData.businessRegistrationNumber !== "" &&
            formData.vatId.trim() !== "");
        return isBasicValid && isBusinessFieldsValid;
      case 5:
        return formData.selfieImage !== null;
      default:
        return false;
    }
  };

  // Navigate to next step
  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit form on last step
      handleSubmit();
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
  const handleSubmit = () => {
    console.log("Form submitted:", formData);
  
  };

  return (
    <main className="relative w-full min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl mx-auto min-h-screen flex flex-col py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="text-2xl hover:opacity-70 transition-opacity"
          >
            <ArrowLeft />
          </button>
          <span className="text-[14px] text-gray-500 font-poppins">
            Step {currentStep} of {totalSteps}
          </span>
        </div>

        {/* Step Content */}
        <div className="flex-1">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-8">
                Tell Us About You
              </h1>
              <Input
                label="Enter Your Full Name (Exactly as on ID)"
                placeholder="Enter Full Name"
                value={formData.fullName}
                onChange={(value) => handleInputChange("fullName", value)}
                required
              />
              <Input
                label="Email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(value) => handleInputChange("email", value)}
                required
              />
              <div>
                <label className="flex items-start gap-3 cursor-pointer ">
                  <input
                    type="checkbox"
                    checked={formData.term1Accepted}
                    onChange={(e) =>
                      handleInputChange("term1Accepted", e.target.checked)
                    }
                    className="w-5 h-5 mt-1 cursor-pointer shrink-0 appearance-none border border-brand-orange rounded checked:bg-brand-orange checked:border-brand-orange relative
                  after:content-[''] after:absolute after:left-1.25 after:top-px after:w-1.5 after:h-2.5 after:border-white after:border-r-2 after:border-b-2 after:rotate-45 after:opacity-0 checked:after:opacity-100"
                  />
                  <span className="text-[13px] font-qurova text-gray-700 mt-2 lg:mt-2">
                    By continuing you accept the terms and conditions
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={formData.term2Accepted}
                    onChange={(e) =>
                      handleInputChange("term2Accepted", e.target.checked)
                    }
                    className="w-5 h-5 mt-1 cursor-pointer shrink-0 appearance-none border border-brand-orange rounded checked:bg-brand-orange checked:border-brand-orange relative
                  after:content-[''] after:absolute after:left-1.25 after:top-px after:w-1.5 after:h-2.5 after:border-white after:border-r-2 after:border-b-2 after:rotate-45 after:opacity-0 checked:after:opacity-100"
                  />
                  <span className="text-[14px] font-qurova text-gray-700 mt-2 lg:mt-2">
                    By continuing you accept the privacy policy
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Step 2: Email verification */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-4">
                Confirm Your Email
              </h1>
              <p className="text-[14px] font-poppins text-gray-600 mb-8">
                We&apos;ve sent a verification code to your email{" "}
                <span className="font-semibold text-gray-900">
                  {formData.email}
                </span>
              </p>

              {/* Verification Code Inputs */}
              <div className="flex gap-2 sm:gap-3 justify-center mb-6">
                {formData.verificationCode.map((digit, index) => (
                  <input
                    key={index}
                    id={`code-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !digit && index > 0) {
                        const prevInput = document.getElementById(
                          `code-${index - 1}`,
                        );
                        prevInput?.focus();
                      }
                    }}
                    className="w-12 h-12 sm:w-14 sm:h-14 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/20"
                  />
                ))}
              </div>

              {/* Resend Code */}
              <p className="text-[14px] font-poppins text-gray-600 text-center">
                Resend code in{" "}
                <span className="font-semibold text-gray-900">00:57</span>
              </p>
            </div>
          )}

          {/* Step 3: legal identity*/}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-8">
                Legal Identity
              </h1>
              <Input
                label="Country of residence"
                placeholder="Germany"
                value={formData.country}
                onChange={(value) => handleInputChange("country", value)}
                required
              />
              <Input
                label="City"
                placeholder="Berlin"
                value={formData.city}
                onChange={(value) => handleInputChange("city", value)}
                required
              />
              <Input
                label="Postal Code"
                placeholder="88019"
                value={formData.postal}
                onChange={(value) => handleInputChange("postal", value)}
                required
              />
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-8">
                Trade & Work Eligibility
              </h1>
              <Select
                label="Primary Trade"
                placeholder="Select"
                value={formData.trade}
                onChange={(value) => handleInputChange("trade", value)}
                options={[
                  { value: "select", label: "select" },
                  { value: "plumbing", label: "Plumbing" },
                  { value: "electrical", label: "Electrical" },
                  { value: "carpentry", label: "Carpentry" },
                  { value: "painting", label: "Painting" },
                  { value: "hvac", label: "HVAC" },
                  { value: "masonry", label: "Masonry" },
                  { value: "roofing", label: "Roofing" },
                  { value: "landscaping", label: "Landscaping" },
                  { value: "other", label: "Other" },
                ]}
                required
              />
              <Select
                label="Are you working as:"
                placeholder="Self employed / freelancer"
                value={formData.workingAs}
                onChange={(value) => handleInputChange("workingAs", value)}
                options={[
                  {
                    value: "self-employed",
                    label: "Self employed / freelancer",
                  },
                  { value: "company-employee", label: "Company employee" },
                  { value: "contractor", label: "Contractor" },
                  { value: "business-owner", label: "Business owner" },
                  {
                    value: "registered-business",
                    label: "Registered business",
                  },
                ]}
                required
              />

              {/* Conditional fields for Registered Business */}
              {formData.workingAs === "registered-business" && (
                <>
                  <Input
                    label="Business registration number"
                    placeholder="Enter registration number"
                    value={formData.businessRegistrationNumber}
                    onChange={(value) =>
                      handleInputChange("businessRegistrationNumber", value)
                    }
                    required
                  />
                  <Input
                    label="VAT ID"
                    placeholder="Enter VAT ID"
                    value={formData.vatId}
                    onChange={(value) => handleInputChange("vatId", value)}
                    required
                  />
                </>
              )}
            </div>
          )}

          {/* Step 5: Take a Selfie */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-2">
                Take A Selfie
              </h1>
              <p className="text-[14px] font-qurova text-gray-600 mb-8">
                We use your selfie to compare with your passport photo
              </p>

              {/* Selfie Illustration */}
              <div className="flex justify-center mb-8">
                <Image
                  src="/avatar.svg"
                  alt="avatar"
                  width={200}
                  height={200}
                  className="w-20 h-20 lg:w-50 lg:h-50"
                />
              </div>

              {/* Instructions Box */}
              <div className=" p-2 space-y-3">
                <p className="text-[13px] font-poppins font-semibold text-gray-800">
                  Make sure you have:
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-brand-orange bg-brand-yellow px-3 py-1 rounded-full  font-bold text-[14px] mt-0.5">
                      1
                    </span>
                    <div>
                      <p className="text-[13px] font-poppins font-semibold text-gray-800">
                        Good lighting
                      </p>
                      <p className="text-[12px] font-poppins text-gray-600">
                        Make sure you in a well lit area and both ears are
                        uncovered
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-brand-orange bg-brand-yellow px-3 py-1 rounded-full font-bold text-[14px] mt-0.5">
                      2
                    </span>
                    <div>
                      <p className="text-[13px] font-poppins font-semibold text-gray-800">
                        Look straight
                      </p>
                      <p className="text-[12px] font-poppins text-gray-600">
                        Hold your phone at eye level and look straight into the
                        camera
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <button className="fixed bottom-40 right-4 sm:right-6 lg:right-8 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-xl font-bold border border-gray-200 hover:shadow-xl transition-shadow">
          ?
        </button>

        <div className="mt-auto space-y-4">
          {currentStep === 1 && (
            <div className="text-center text-[14px] font-poppins">
              <span className="text-brand-orange">
                Already have an account?{" "}
              </span>
              <button
                onClick={() => router.push("/tasker/login")}
                className="text-brand-blue font-semibold hover:underline"
              >
                Sign In
              </button>
            </div>
          )}

          <div>
            <Button
              variant={currentStep === 5 ? "secondary" : "primary"}
              onClick={handleNext}
              fullWidth
              disabled={!isStepValid()}
            >
              {currentStep === 5
                ? "Open camera"
                : currentStep === totalSteps
                  ? "Submit"
                  : "Continue"}
            </Button>

            {currentStep >= 3 && (
              <button
                onClick={() => {
                  console.log("Saving draft:", formData);
                  // Handle save draft logic here
                }}
                className="w-full text-center text-[14px] font-qurova text-gray-700 hover:text-gray-900 mt-4 py-2"
              >
                Save draft
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Page;
