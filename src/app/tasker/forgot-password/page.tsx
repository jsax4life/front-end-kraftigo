"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/ui/loader";
import { ArrowLeft, MailCheck } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { isValidEmail, isNotEmpty } from "@/utils/validation";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { logger } from "@/utils/logger";
import toast from "react-hot-toast";

const ForgotPasswordContent = () => {
  const router = useRouter();

  const { isLoading, forgotPassword } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
  });

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else {
      router.push("/tasker/login");
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return isNotEmpty(formData.email) && isValidEmail(formData.email);
      case 2:
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      try {
        const message = await forgotPassword(formData.email);
        toast.success(message || "Password reset instructions sent!");
        setCurrentStep(2);
      } catch (err: unknown) {
        logger.error("Forgot password failed:", err);
        const ax = err as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        const msg =
          ax.response?.data?.message ||
          ax.message ||
          "Could not send reset email. Please try again.";
        toast.error(msg);
      }
    } else if (currentStep === 2) {
      router.push("/tasker/login");
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
        <div className="w-full max-w-4xl mx-auto min-h-screen flex flex-col py-8">
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
                  Enter the email associated with your tasker account.
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
          </div>

          <div className="mt-auto space-y-4">
            {currentStep === 1 && (
              <div className="text-center text-[14px] font-poppins">
                <span className="text-brand-orange">
                  Remember your password?{" "}
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
                variant="primary"
                onClick={handleNext}
                fullWidth
                disabled={!isStepValid()}
              >
                {currentStep === 1
                  ? "Send Instructions"
                  : "Back to Login"}
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
      <ForgotPasswordContent />
    </Suspense>
  );
};

export default Page;
