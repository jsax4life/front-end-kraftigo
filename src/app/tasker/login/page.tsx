"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import Loader from "@/components/ui/loader";
import { isValidEmail, isNotEmpty } from "@/utils/validation";
import { logger } from "@/utils/logger";
import toast from "react-hot-toast";

const Page = () => {
  const router = useRouter();
  const { loginTasker, isAuthenticated, isLoading, error, clearError } = useAuthStore();

  // Form data state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/tasker/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleInputChange = (field: string, value: string | boolean) => {
    if (error) clearError();
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const isFormValid = () => {
    return (
      isNotEmpty(formData.email) &&
      isNotEmpty(formData.password) &&
      isValidEmail(formData.email)
    );
  };

  const handleBack = () => {
    router.back();
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      toast.error("Please fill in all fields correctly");
      return;
    }

    try {
      await loginTasker(formData.email, formData.password);
      toast.success("Login successful! Welcome back, Tasker.");
      router.push("/tasker/dashboard");
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || error || "Login failed.";
      toast.error(errorMessage);
    }
  };

  return (
    <main className="relative w-full min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {isLoading ? (
        <Loader />
      ) : (
        <div className="w-full max-w-2xl mx-auto h-screen flex flex-col py-8">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={handleBack}
              className="text-2xl hover:opacity-70 transition-opacity"
            >
              <ArrowLeft />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-8">
                Tasker Welcome Back
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
                   <button className="w-14 h-14 bg-white border border-[#0000001A] rounded-xl flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm">
                    <Image src="/google.svg" alt="Google" width={24} height={24} />
                  </button>
                  <button className="w-14 h-14 bg-black rounded-xl flex items-center justify-center hover:bg-gray-900 transition-all">
                    <Image src="/apple.svg" alt="Apple" width={24} height={24} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-4">
            <div className="text-center text-[14px] font-qurova">
              <span className="text-brand-orange">
                Don&apos;t have a tasker account?{" "}
              </span>
              <button
                onClick={() => router.push("/tasker/createacc")}
                className="text-brand-blue font-semibold hover:underline"
              >
                Sign Up
              </button>
            </div>

            <div>
              <Button
                variant="primary"
                onClick={handleSubmit}
                fullWidth
                disabled={!isFormValid()}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Page;
