"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Input from "@/componets/ui/input";
import Button from "@/componets/ui/button";
import { ArrowLeft } from "lucide-react";

const Page = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  // Form data state
  const [formData, setFormData] = useState({
    email: "",
    verificationCode: ["", "", "", "", "", ""],
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
        return formData.email.trim() !== "";
      case 2:
        return formData.verificationCode.every((digit) => digit !== "");
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
    // Handle form submission here
  };

  return (
    <main className="relative w-full min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* Centered Form Container */}
      <div className="w-full max-w-2xl mx-auto h-screen flex flex-col py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="text-2xl hover:opacity-70 transition-opacity"
          >
            <ArrowLeft />
          </button>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-8">
                Welcome Back
              </h1>
              <Input
                label="Email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(value) => handleInputChange("email", value)}
              />
              <div className="mt-10">
                <div className="text-center text-[16px] my-4 font-qurova">
                  Or sign in with
                </div>
                <div className="flex gap-4 justify-center pb-4">
                  <button className="w-14 h-14 bg-white border border-[#0000001A] rounded-xl flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm">
                    <Image
                      src="/google.svg"
                      alt="Google"
                      width={24}
                      height={24}
                    />
                  </button>
                  <button className="w-14 h-14 bg-black rounded-xl flex items-center justify-center hover:bg-gray-900 transition-all">
                    <Image
                      src="/apple.svg"
                      alt="Apple"
                      width={24}
                      height={24}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Email Verification */}
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
        </div>

        {/* Help Button */}
        <button className="fixed bottom-32 right-4 sm:right-6 lg:right-8 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-xl font-bold border border-gray-200 hover:shadow-xl transition-shadow">
          ?
        </button>

        {/* Footer */}
        <div className="mt-auto space-y-4">
          {currentStep === 1 && (
            <div className="text-center text-[14px] font-qurova">
              <span className="text-brand-orange">
                Don&apos;t have an account?{" "}
              </span>
              <button
                onClick={() => router.push("/artisan/login")}
                className="text-brand-blue font-semibold hover:underline"
              >
                Sign Up
              </button>
            </div>
          )}

          <div>
            <Button
              variant="primary"
              onClick={handleNext}
              fullWidth
              disabled={!isStepValid()}
            >
              {currentStep === totalSteps ? "Submit" : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Page;
