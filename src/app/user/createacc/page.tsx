"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/input";
import PhoneInput from "@/components/ui/PhoneInput";
import Button from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import Loader from "@/components/ui/loader";
import { useOTPInput } from "@/hooks/useOTPInput";
import {
  isValidEmail,
  isValidPassword,
  passwordsMatch,
  isNotEmpty,
  isValidPhoneLength,
} from "@/utils/validation";
import { logger } from "@/utils/logger";
import { Checkbox } from "@/components/ui/Checkbox";
import { LegalModal } from "@/components/ui/LegalModal";
import { TermsContent } from "@/components/ui/TermsContent";
import { PrivacyContent } from "@/components/ui/PrivacyContent";
import WhyModal from "@/components/ui/whyModal";
import PasswordStrength from "@/components/ui/PasswordStrength";
import { AUTH_CONFIG } from "@/constants/auth";
import toast from "react-hot-toast";

const Page = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = AUTH_CONFIG.REGISTRATION_STEPS;
  const {
    registerUser,
    verifyEmail,
    resendVerificationCode,
    isLoading,
    error,
    clearError,
  } = useAuthStore();
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showWhyModal, setShowWhyModal] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dialCode: "+49",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });

  // OTP hook for future use
  const {
    code: verificationCode,
    handleCodeChange,
    handleKeyDown,
    reset: resetCode,
  } = useOTPInput(AUTH_CONFIG.OTP_LENGTH);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleInputChange = (field: string, value: string | boolean) => {
    if (error) clearError();
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Check if current step is valid (for button disable state)
  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return (
          isNotEmpty(formData.firstName) &&
          isNotEmpty(formData.lastName) &&
          isNotEmpty(formData.email) &&
          isNotEmpty(formData.phone) &&
          isValidEmail(formData.email) &&
          isValidPhoneLength(formData.phone)
        );
      case 2:
        // For password step, only check if fields are not empty
        // Don't disable button for validation - let user click and see error toast
        return (
          isNotEmpty(formData.password) && isNotEmpty(formData.confirmPassword)
        );
      case 3:
        return formData.termsAccepted;
      case 4:
        return verificationCode.every((digit) => digit !== "");
      default:
        return false;
    }
  };

  // Navigate to next step
  const handleNext = () => {
    if (currentStep < 3) {
      // Validate Step 2 (password) before proceeding
      if (currentStep === 2) {
        if (
          !isValidPassword(formData.password, AUTH_CONFIG.MIN_PASSWORD_LENGTH)
        ) {
          toast.error("Password must be at least 8 characters");
          return;
        }
        if (!passwordsMatch(formData.password, formData.confirmPassword)) {
          toast.error("Passwords do not match");
          return;
        }
      }
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 3) {
      // Submit registration on step 3 (after terms acceptance)
      handleSubmit();
    } else if (currentStep === 4) {
      // Verify email on step 4
      handleVerifyEmail();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  // Submit form
  const handleSubmit = async () => {
    // Basic validation (should already be validated by step progression)
    if (
      !isNotEmpty(formData.firstName) ||
      !isNotEmpty(formData.lastName) ||
      !isNotEmpty(formData.email) ||
      !isNotEmpty(formData.phone) ||
      !isNotEmpty(formData.password)
    ) {
      toast.error("All fields are required");
      return;
    }

    // Prepare data for backend — use the dial code the user actually selected
    const formattedPhone = `${formData.dialCode}${formData.phone.replace(/^0+/, "")}`;

    const registrationData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      phone: formattedPhone,
      hasAcceptedTerms: formData.termsAccepted,
    };

    logger.log("Submitting registration data:", registrationData);

    try {
      const result = await registerUser(registrationData);
      logger.log("Registration successful!", result);

      toast.success(
        result.message || "Registration successful! Please check your email.",
      );

      // Mark registration as complete and move to OTP step
      setRegistrationComplete(true);
      setCurrentStep(4);
    } catch (err: any) {
      logger.error("Registration failed:", err);
      // Show error toast to user
      const errorMessage =
        err.response?.data?.message ||
        error ||
        "Registration failed. Please try again.";
      toast.error(errorMessage);
    }
  };

  // Verify email with OTP
  const handleVerifyEmail = async () => {
    const otpCode = verificationCode.join("");
    logger.log("Verifying email with code:", otpCode);

    try {
      await verifyEmail(formData.email, otpCode);
      logger.log("Email verified successfully!");

      toast.success("Email verified successfully! Redirecting to login...");

      router.push("/user/login?verified=true");
    } catch (err: any) {
      logger.error("Verification failed:", err);

      const errorMessage =
        err.response?.data?.message ||
        error ||
        "Verification failed. Please check your code and try again.";
      toast.error(errorMessage);
    }
  };

  // Resend verification code
  const handleResendCode = async () => {
    if (resendTimer > 0) return;

    logger.log("Resending verification code to:", formData.email);

    try {
      const message = await resendVerificationCode(formData.email);
      logger.log("Resend successful:", message);

      toast.success(message);
      setResendTimer(60);
      resetCode();
    } catch (err: any) {
      logger.error("Resend failed:", err);

      const errorMessage =
        err.response?.data?.message ||
        error ||
        "Failed to resend code. Please try again.";
      toast.error(errorMessage);
    }
  };

  return (
    <main className="relative w-full min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {isLoading ? (
        <>
          <Loader />
        </>
      ) : (
        <div className="w-full max-w-2xl mx-auto min-h-screen flex flex-col py-8">
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
                  label="Enter Your First Name"
                  placeholder="Enter First Name"
                  value={formData.firstName}
                  onChange={(value) => handleInputChange("firstName", value)}
                  required
                />
                <Input
                  label="Enter Your Last Name"
                  placeholder="Enter Last Name"
                  value={formData.lastName}
                  onChange={(value) => handleInputChange("lastName", value)}
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
                <PhoneInput
                  label="Phone Number"
                  placeholder="000 000 0000"
                  value={formData.phone}
                  onChange={(value) => handleInputChange("phone", value)}
                  onDialCodeChange={(code) => handleInputChange("dialCode", code)}
                  required
                />
              </div>
            )}

            {/* Step 2: Password */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-8">
                  Create Password
                </h1>

                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(value) => handleInputChange("password", value)}
                  required
                />
                <PasswordStrength password={formData.password} />
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
                <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-3">
                  Terms Of Use
                </h1>
                <p className="text-[14px] font-poppins text-gray-600">
                  By clicking, you agree to receive updates and newsletters
                  about Kraftigo services & products
                </p>

                {/* Terms of Use Modal */}
                <LegalModal
                  isOpen={showTermsModal}
                  onClose={() => setShowTermsModal(false)}
                  title="Terms of Use"
                >
                  <TermsContent />
                </LegalModal>

                {/* Privacy Policy Modal — wire up PrivacyContent when ready */}
                <LegalModal
                  isOpen={showPrivacyModal}
                  onClose={() => setShowPrivacyModal(false)}
                  title="Privacy Policy"
                >
                  <PrivacyContent />
                </LegalModal>
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

                {/* Resend Code */}
                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-[14px] font-poppins text-gray-600">
                      Resend code in{" "}
                      <span className="font-semibold text-gray-900">
                        00:{resendTimer.toString().padStart(2, "0")}
                      </span>
                    </p>
                  ) : (
                    <button
                      onClick={handleResendCode}
                      disabled={isLoading}
                      className="text-[14px] font-poppins text-brand-orange font-semibold hover:underline disabled:opacity-50"
                    >
                      Resend code
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* <button className="fixed bottom-40 right-4 sm:right-6 lg:right-8 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-xl font-bold border border-gray-200 hover:shadow-xl transition-shadow">
            ?
          </button> */}

          <div className="mt-auto space-y-4">
            {currentStep === 1 && (
              <div className="text-center text-[14px] font-poppins">
                <span className="text-brand-orange">
                  Already have an account?{" "}
                </span>
                <button
                  onClick={() => router.push("/user/login")}
                  className="text-brand-blue font-semibold hover:underline"
                >
                  Sign In
                </button>
              </div>
            )}

            {currentStep === 2 && (
              <div className="text-center text-[14px] font-poppins">
                <span
                  className="text-gray-600"
                  onClick={() => setShowWhyModal(true)}
                >
                  Why do we collect this information?
                </span>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <Checkbox
                  checked={formData.termsAccepted}
                  onChange={(checked: boolean) =>
                    handleInputChange("termsAccepted", checked)
                  }
                  labelNode={
                    <span className="text-[14px] font-poppins text-gray-700 leading-relaxed">
                      I agree to the{" "}
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
                      </button>
                    </span>
                  }
                />
              </div>
            )}

            <div>
              <Button
                variant="primary"
                onClick={handleNext}
                fullWidth
                disabled={!isStepValid()}
              >
                {currentStep === 4
                  ? "Verify Email"
                  : currentStep === totalSteps
                    ? "Submit"
                    : "Continue"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Why Modal */}
      <WhyModal isOpen={showWhyModal} onClose={() => setShowWhyModal(false)} />
    </main>
  );
};

export default Page;
