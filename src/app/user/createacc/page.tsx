"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/componets/ui/input";
import Button from "@/componets/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import Loader from "@/componets/ui/loader";
import { useOTPInput } from "@/hooks/useOTPInput";
import { isValidEmail, isValidPassword, passwordsMatch, isNotEmpty } from "@/utils/validation";
import { logger } from "@/utils/logger";
import { ErrorAlert, WarningAlert } from "@/componets/ui/ErrorAlert";
import { Checkbox } from "@/componets/ui/Checkbox";
import { AUTH_CONFIG } from "@/constants/auth";

const Page = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = AUTH_CONFIG.REGISTRATION_STEPS;
  const { registerUser, isLoading, error, clearError } = useAuthStore();

  // Form data state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });

  // OTP hook for future use
  const { code: verificationCode, handleCodeChange, handleKeyDown } = useOTPInput(AUTH_CONFIG.OTP_LENGTH);

  const handleInputChange = (field: string, value: string | boolean) => {
    
    if (error) clearError();
    
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Check if current step is valid
  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return (
          isNotEmpty(formData.fullName) &&
          isNotEmpty(formData.email) &&
          isNotEmpty(formData.phone) &&
          isValidEmail(formData.email)
        );
      case 2:
        return (
          isValidPassword(formData.password, AUTH_CONFIG.MIN_PASSWORD_LENGTH) &&
          isValidPassword(formData.confirmPassword, AUTH_CONFIG.MIN_PASSWORD_LENGTH) &&
          passwordsMatch(formData.password, formData.confirmPassword)
        );
      case 3:
        return formData.termsAccepted;
      default:
        return false;
    }
  };

  // Navigate to next step
  const handleNext = () => {
    // Skip OTP step (step 4) since backend hasn't implemented it yet
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit form on step 3 (after terms acceptance)
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
  const handleSubmit = async () => {
    // Validation
    if (!isNotEmpty(formData.fullName) || !isNotEmpty(formData.email) || !isNotEmpty(formData.phone) || !isNotEmpty(formData.password)) {
      logger.error("All fields are required");
      return;
    }

    if (!passwordsMatch(formData.password, formData.confirmPassword)) {
      logger.error("Passwords do not match");
      return;
    }

    // Prepare data for backend
    const registrationData = {
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      fullName: formData.fullName,
    };

    logger.log("Submitting registration data:", registrationData);

    try {
      await registerUser(registrationData);
      logger.log("Registration successful!");
      router.push('/user/dashboard');
    } catch (err: any) {
      logger.error("Registration failed:", err);
      logger.error("Error details:", error);
    }
  };

  return (
    <main className="relative w-full min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {isLoading ? (
        <>
          <Loader />
        </>
      ) : (
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
                  placeholder="+1234567890"
                  value={formData.phone}
                  onChange={(value) => handleInputChange("phone", value)}
                  required
                  />
                  
                {error && <ErrorAlert message={error} />}
              </div>
            )}

            {/* Step 2: Password */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-8">
                  Create Password
                </h1>
                
              
                {formData.password && !isValidPassword(formData.password, AUTH_CONFIG.MIN_PASSWORD_LENGTH) && (
                  <WarningAlert message="Password must be at least 6 characters" />
                )}
                
                {formData.password && formData.confirmPassword && !passwordsMatch(formData.password, formData.confirmPassword) && (
                  <ErrorAlert message="Passwords do not match" />
                )}
                
                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(value) => handleInputChange("password", value)}
                  required
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Enter your confirm password"
                  value={formData.confirmPassword}
                  onChange={(value) =>
                    handleInputChange("confirmPassword", value)
                  }
                  required
                />
              </div>
            )}

            {/* Step 3: Terms of Use */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-8">
                  Terms Of Use
                </h1>

              
                <div className="min-h-75 mb-8">
                  
                </div>

              
                <Checkbox
                  checked={formData.termsAccepted}
                  onChange={(checked) => handleInputChange("termsAccepted", checked)}
                  label="Send me updates and newsletters about Kraftigo services & products"
                />
              </div>
            )}

            {/* Step 3: Email Verification */}
            {currentStep === 4 && (
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
                  {verificationCode.map((digit, index) => (
                    <input
                      key={index}
                      id={`code-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-12 sm:w-14 sm:h-14 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/20"
                    />
                  ))}
                </div>

                <p className="text-[14px] font-poppins text-gray-600 text-center">
                  Resend code in{" "}
                  <span className="font-semibold text-gray-900">00:57</span>
                </p>
              </div>
            )}
          </div>

          <button className="fixed bottom-32 right-4 sm:right-6 lg:right-8 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-xl font-bold border border-gray-200 hover:shadow-xl transition-shadow">
            ?
          </button>

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
      )}
    </main>
  );
};

export default Page;
