"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import { getVerificationWire } from "@/lib/api/verification";
import Loader from "@/components/ui/loader";
import { useOTPInput } from "@/hooks/useOTPInput";
import { isValidEmail, isNotEmpty } from "@/utils/validation";
import { AUTH_CONFIG } from "@/constants/auth";
import toast from "react-hot-toast";
import { formatLoginApiError } from "@/lib/authApiErrors";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";

const Page = () => {
  const router = useRouter();
  const { loginUser, isAuthenticated, isLoading, error, clearError } = useAuthStore();
  const { fetchVerificationStatus } = useProfileStore();
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

  useEffect(() => {
    if (isAuthenticated) {
      (async () => {
        await fetchVerificationStatus();
        const { verificationState, kycStatus } = getVerificationWire(
          useProfileStore.getState().verificationStatus,
        );
        if (
          kycStatus === "APPROVED" &&
          (verificationState === "PENDING" || verificationState === "APPROVED")
        ) {
          router.replace("/tasker/dashboard");
          return;
        }
        router.replace("/");
      })();
    }
  }, [isAuthenticated, router, fetchVerificationStatus]);

  const handleInputChange = (field: string, value: string | boolean) => {
    if (error) clearError();
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

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

  const handleNext = () => {
    handleSubmit();
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.push('/')
    }
  };

  const handleSubmit = async () => {
    if (!isStepValid()) {
      toast.error("Please fill in all fields correctly");
      return;
    }

    try {
      await loginUser(formData.email, formData.password);
      toast.success("Login successful! Welcome back.");
      await fetchVerificationStatus();
      const { verificationState, kycStatus } = getVerificationWire(
        useProfileStore.getState().verificationStatus,
      );
      if (
        kycStatus === "APPROVED" &&
        (verificationState === "PENDING" || verificationState === "APPROVED")
      ) {
        router.replace("/tasker/dashboard");
        return;
      }
      router.replace("/");
    } catch (err: unknown) {
      const msg = formatLoginApiError(err, useAuthStore.getState().error);
      toast.error(msg);
    }
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

          <div className="flex-1 overflow-y-auto">
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
                <div className="flex flex-col gap-1">
                  <div className="flex justify-end">
                    <p
                      onClick={() => router.push("/user/forgot-password")}
                      className="text-brand-blue text-[14px] font-mabry cursor-pointer underline "
                    >
                      Forgot password?
                    </p>
                  </div>
                  <Input
                    label="Password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(value) => handleInputChange("password", value)}
                  />
                </div>
                <div className="mt-10">
                  <div className="text-center text-[16px] my-4 font-mabry">
                    Or sign in with
                  </div>
                  <div className="flex gap-4 justify-center pb-4">
                    {showGoogleLogin ? (
                      <GoogleLoginButton variant="icon" />
                    ) : (
                      <button
                        disabled
                        className="w-14 h-14 bg-gray-100 border border-[#0000001A] rounded-xl flex items-center justify-center opacity-50 cursor-not-allowed"
                      >
                        <Image src="/google.svg" alt="Google" width={24} height={24} className="grayscale" />
                      </button>
                    )}
                    <button className="w-14 h-14 bg-black rounded-xl flex items-center justify-center hover:bg-gray-900 transition-all">
                      <Image src="/apple.svg" alt="Apple" width={24} height={24} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-auto space-y-4">
            {currentStep === 1 && (
              <div className="text-center text-[14px] font-mabry">
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
