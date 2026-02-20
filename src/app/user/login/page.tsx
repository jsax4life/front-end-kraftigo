"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import Loader from "@/components/ui/loader";
import { useOTPInput } from "@/hooks/useOTPInput";
import { isValidEmail, isNotEmpty } from "@/utils/validation";
import { logger } from "@/utils/logger";
import { AUTH_CONFIG } from "@/constants/auth";
import toast from "react-hot-toast";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";

const Page = () => {
  const router = useRouter();
  const { loginUser, isLoading, error, clearError } =
    useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = AUTH_CONFIG.LOGIN_STEPS;
  const showGoogleLogin = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Form data state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // OTP hook for future use
  const {
    code: verificationCode,
    handleCodeChange,
    handleKeyDown,
  } = useOTPInput(AUTH_CONFIG.OTP_LENGTH);

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
          isNotEmpty(formData.email) &&
          isNotEmpty(formData.password) &&
          isValidEmail(formData.email)
        );
      case 2:
        return verificationCode.every((digit) => digit !== "");
      default:
        return false;
    }
  };

  // Navigate to next step or submit
  const handleNext = () => {
    if (currentStep < totalSteps) {
      // For now, skip to submission instead of going to OTP step
      // setCurrentStep(currentStep + 1);
      // When OTP is ready, change this to: setCurrentStep(currentStep + 1);
      handleSubmit();
    } else {
      handleSubmit();
    }
  };

  // Navigate back
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  // Submit login form
  const handleSubmit = async () => {
    if (!isStepValid()) {
      logger.error("Please fill in all fields correctly");
      toast.error("Please fill in all fields correctly");
      return;
    }

    logger.log("Submitting login data:", {
      email: formData.email,
      password: "***",
    });

    try {
      await loginUser(formData.email, formData.password);
      logger.log("Login successful!");
      toast.success("Login successful! Welcome back.");

      router.push("/user/home");
    } catch (err: any) {
      logger.error("Login failed:", err);

      const errorMessage =
        err.response?.data?.message ||
        error ||
        "Login failed. Please check your credentials.";
      toast.error(errorMessage);
    }
  };

  return (
    <main className="relative w-full min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {isLoading ? (
        <Loader />
      ) : (
        <div className="w-full max-w-2xl mx-auto min-h-screen flex flex-col py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={handleBack}
              className="text-2xl hover:opacity-70 transition-opacity"
            >
              <ArrowLeft />
            </button>
            {/* Step indicator - hidden for now since we skip OTP */}
            {/* <span className="text-[14px] text-gray-500 font-poppins">
              Step {currentStep} of {totalSteps}
            </span> */}
          </div>

          {/* Step Content */}
          <div className="flex-1">
            {/* Step 1: Login Form */}
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
                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(value) => handleInputChange("password", value)}
                />
                <div className="mt-10">
                  <div className="text-center text-[16px] my-4 font-qurova">
                    Or sign in with
                  </div>
                  <div className="flex gap-4 justify-center pb-4">
                    {showGoogleLogin && <GoogleLoginButton />}
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

            {/* Step 2: OTP Verification (for future use) */}
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
              <div className="text-center text-[14px] font-qurova">
                <span className="text-brand-orange">
                  Don&apos;t have an account?{" "}
                </span>
                <button
                  onClick={() => router.push("/user/createacc")}
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
                {currentStep === totalSteps ? "Verify" : "Sign In"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Page;
