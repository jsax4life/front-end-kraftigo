"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Loader from "@/components/ui/loader";
import { ArrowLeft, MailCheck } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { isValidEmail, isNotEmpty } from "@/utils/validation";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import PasswordStrength from "@/components/ui/PasswordStrength";
import { AUTH_CONFIG } from "@/constants/auth";
import { logger } from "@/utils/logger";
import toast from "react-hot-toast";

const ForgetPasswordContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const { isLoading, forgotPassword, resetPassword } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    // If we land on the page with a token in the URL, go straight to Step 3
    if (token) {
      setCurrentStep(3);
    }
  }, [token]);

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else {
      router.push("/user/login");
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return isNotEmpty(formData.email) && isValidEmail(formData.email);
      case 2:
        return true;
      case 3:
        return (
          isNotEmpty(formData.password) &&
          isNotEmpty(formData.confirmPassword) &&
          formData.password === formData.confirmPassword &&
          formData.password.length >= AUTH_CONFIG.MIN_PASSWORD_LENGTH
        );
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      // Send reset email
      try {
        const message = await forgotPassword(formData.email);
        toast.success(message || "Password reset instructions sent!");
        setCurrentStep(2);
      } catch (err: any) {
        logger.error("Forgot password failed:", err);
        // Error toast is already handled by the store
      }
    } else if (currentStep === 2) {
      // Just a check email screen, button sends back to login
      router.push("/user/login");
    } else if (currentStep === 3) {
      if (!token) {
        toast.error("Invalid or missing reset token.");
        return;
      }
      // Reset password
      try {
        const message = await resetPassword({
          token,
          password: formData.password,
        });
        toast.success(message || "Password reset successfully!");
        router.push("/user/login");
      } catch (err: any) {
        logger.error("Reset password failed:", err);
        // Error toast handled by store
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <main className="relative w-full min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {isLoading ? (
        <Loader />
      ) : (
        <div className="w-full max-w-2xl mx-auto min-h-screen flex flex-col py-8">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={handleBack}
              className="text-2xl hover:opacity-70 transition-opacity"
            >
              <ArrowLeft />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto mt-3">
            {currentStep === 1 && (
              <div className="space-y-6">
                <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-2">
                  Forgot password?
                </h1>
                <p className="text-[13px] font-poppins">
                  Don&apos;t worry! It happens. Please enter the email{" "}
                  <br className="hidden sm:block" /> associated with your
                  account.
                </p>
                <Input
                  label="Email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(value) => handleInputChange("email", value)}
                />
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 flex flex-col items-center justify-center text-center mt-10">
                <div className="w-20 h-20 bg-brand-orange/10 rounded-full flex items-center justify-center text-brand-orange mb-4">
                  <MailCheck size={40} />
                </div>
                <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-2">
                  Check Your Email
                </h1>
                <p className="text-[14px] font-poppins text-gray-600 mb-8 max-w-md mx-auto">
                  We&apos;ve sent a password reset link to{" "}
                  <span className="font-semibold text-gray-900">
                    {formData.email}
                  </span>
                  . Please check your inbox and click the link to continue.
                </p>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-4">
                  Secure Your Account
                </h1>
                <p className="text-[14px] font-poppins text-gray-600 mb-8">
                  Create a strong new password to protect your information and
                  privacy
                </p>

                {/* Password Input */}
                <Input
                  label="New Password"
                  type="password"
                  placeholder="Enter your new password"
                  value={formData.password}
                  onChange={(value) => handleInputChange("password", value)}
                />
                <PasswordStrength password={formData.password} />

                {/* Confirm Password Input */}
                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="Confirm your new password"
                  value={formData.confirmPassword}
                  onChange={(value) =>
                    handleInputChange("confirmPassword", value)
                  }
                />
              </div>
            )}
          </div>

          {/* Fixed bottom actions */}
          <div className="mt-auto space-y-4">
            {currentStep === 1 && (
              <div className="text-center text-[14px] font-poppins">
                <span className="text-brand-orange">
                  Remember your password?{" "}
                </span>
                <button
                  onClick={() => router.push("/user/login")}
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
                {currentStep === 1
                  ? "Send Instructions"
                  : currentStep === 2
                  ? "Back to Login"
                  : "Reset Password"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

const Page = () => {
  return (
    <Suspense fallback={<Loader />}>
      <ForgetPasswordContent />
    </Suspense>
  );
};

export default Page;
