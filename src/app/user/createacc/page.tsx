"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/componets/ui/input";
import Button from "@/componets/ui/button";
import { ArrowLeft } from "lucide-react";

const Page = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Form data state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    termsAccepted: false,
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
        return formData.fullName.trim() !== "" && formData.email.trim() !== "";
      case 2:
        return formData.termsAccepted;
      case 3:
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
      <div className="w-full max-w-2xl mx-auto h-screen flex flex-col py-8">
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
        <div className="flex-1 overflow-y-auto">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-8">
                Tell Us About You
              </h1>
              <Input
                label="Enter Your Full Name"
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
              <Input
                label="Phone Number"
                placeholder="+1234567896"
                value={formData.phone}
                onChange={(value) => handleInputChange("phone", value)}
                required
              />
            </div>
          )}

          {/* Step 2: Terms of Use */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-8">
                Terms Of Use
              </h1>

              {/* Terms content area - you can add scrollable terms here */}
              <div className="min-h-75 mb-8">
                {/* Add your terms and conditions content here */}
              </div>

              {/* Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer mt-15 lg:mt-25">
                <input
                  type="checkbox"
                  checked={formData.termsAccepted}
                  onChange={(e) =>
                    handleInputChange("termsAccepted", e.target.checked)
                  }
                  className="w-5 h-5 mt-1 cursor-pointer shrink-0 appearance-none border-2 border-brand-orange rounded checked:bg-brand-orange checked:border-brand-orange relative
                  after:content-[''] after:absolute after:left-1.25 after:top-px after:w-1.5 after:h-2.5 after:border-white after:border-r-2 after:border-b-2 after:rotate-45 after:opacity-0 checked:after:opacity-100"
                />
                <span className="text-[14px] font-qurova text-gray-700 mt-1 lg:mt-2">
                  Send me updates and newsletters about Kraftigo services &
                  products
                </span>
              </label>
            </div>
          )}

          {/* Step 3: Email Verification */}
          {currentStep === 3 && (
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
            <div className="text-center text-[14px] font-poppins">
              <span className="text-brand-orange">
                Already have an account?{" "}
              </span>
              <button
                onClick={() => router.push("/artisan/login")}
                className="text-brand-blue font-semibold hover:underline"
              >
                Sign In
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
