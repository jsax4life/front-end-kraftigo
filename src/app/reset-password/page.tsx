"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Loader from "@/components/ui/loader";
import { ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { isNotEmpty } from "@/utils/validation";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import PasswordStrength from "@/components/ui/PasswordStrength";
import { AUTH_CONFIG } from "@/constants/auth";
import { logger } from "@/utils/logger";
import toast from "react-hot-toast";

const ResetPasswordContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const { isLoading, resetPassword } = useAuthStore();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const handleBack = () => {
    router.push("/user/login");
  };

  const isValid = () => {
    return (
      isNotEmpty(formData.password) &&
      isNotEmpty(formData.confirmPassword) &&
      formData.password === formData.confirmPassword &&
      formData.password.length >= AUTH_CONFIG.MIN_PASSWORD_LENGTH
    );
  };

  const handleReset = async () => {
    if (!token) {
      toast.error("Invalid or missing reset token.");
      return;
    }
    try {
      const message = await resetPassword({
        token,
        password: formData.password,
      });
      toast.success(message || "Password reset successfully!");
      router.push("/user/login");
    } catch (err: any) {
      logger.error("Reset password failed:", err);
      // store handles the toast error
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
            <div className="space-y-6">
              <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-4">
                Secure Your Account
              </h1>
              <p className="text-[14px] font-poppins text-gray-600 mb-8">
                Create a strong new password to protect your information and privacy
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
                onChange={(value) => handleInputChange("confirmPassword", value)}
              />
            </div>
          </div>

          <div className="mt-auto space-y-4">
            <Button
              variant="primary"
              onClick={handleReset}
              fullWidth
              disabled={!isValid()}
            >
              Reset Password
            </Button>
          </div>
        </div>
      )}
    </main>
  );
};

const Page = () => {
  return (
    <Suspense fallback={<Loader />}>
      <ResetPasswordContent />
    </Suspense>
  );
};

export default Page;
