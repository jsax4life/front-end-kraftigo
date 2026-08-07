"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import Loader from "@/components/ui/loader";
import { useOTPInput } from "@/hooks/useOTPInput";
import { isValidEmail, isNotEmpty } from "@/utils/validation";
import { AUTH_CONFIG } from "@/constants/auth";
import toast from "react-hot-toast";
import { formatLoginApiError, isEmailNotVerifiedError } from "@/lib/authApiErrors";
import { setPendingEmailVerification } from "@/lib/pendingEmailVerification";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import { routeAfterAuthLogin } from "@/lib/postLoginRouting";
import { useTranslations } from "next-intl";

const LoginPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginUser, isAuthenticated, isLoading, error, clearError } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = AUTH_CONFIG.LOGIN_STEPS;
  const showGoogleLogin = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const t = useTranslations("auth.login");
  const tc = useTranslations("auth.common");

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
    const emailFromQuery = searchParams.get("email")?.trim() ?? "";
    if (emailFromQuery) {
      setFormData((prev) => ({ ...prev, email: emailFromQuery }));
    }
    if (searchParams.get("verified") === "1") {
      toast.success("Email verified. Sign in to continue.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      void routeAfterAuthLogin(router);
    }
  }, [isAuthenticated, router]);

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
      await routeAfterAuthLogin(router);
    } catch (err: unknown) {
      const storeError = useAuthStore.getState().error;
      if (isEmailNotVerifiedError(err, storeError)) {
        setPendingEmailVerification(formData.email);
        toast.error("Your email is not verified yet. Enter the code we sent you.");
        router.push(
          `${AUTH_CONFIG.VERIFY_EMAIL_ROUTE}?email=${encodeURIComponent(formData.email)}`,
        );
        return;
      }
      const msg = formatLoginApiError(err, storeError);
      toast.error(msg);
    }
  };

  return (
    <main className="relative w-full min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {isLoading ? (
        <Loader />
      ) : (
        <div className="w-full max-w-3xl mx-auto min-h-screen flex flex-col py-8">
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
                  {t("title")}
                </h1>

                <Input
                  label={tc("emailLabel")}
                  type="email"
                  placeholder={tc("emailPlaceholder")}
                  value={formData.email}
                  onChange={(value) => handleInputChange("email", value)}
                />
                <div className="flex flex-col gap-1">
                  <div className="flex justify-end">
                    <p
                      onClick={() => router.push("/user/forgot-password")}
                      className="text-brand-blue text-[14px] font-mabry cursor-pointer underline "
                    >
                      {t("forgotPasswordLink")}
                    </p>
                  </div>
                  <Input
                    label={tc("passwordLabel")}
                    type="password"
                    placeholder={tc("passwordPlaceholder")}
                    value={formData.password}
                    onChange={(value) => handleInputChange("password", value)}
                  />
                </div>
                <div className="mt-10">
                  <div className="text-center text-[16px] my-4 font-mabry">
                    {t("orSignInWith")}
                  </div>
                  <div className="flex gap-4 justify-center pb-2 items-center">
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
                  <p className="text-center text-[12px] font-poppins text-gray-500 px-4 pb-4">
                    {t("googleTerms")}{" "}
                    <button
                      type="button"
                      onClick={() => router.push("/user/createacc")}
                      className="text-brand-blue underline"
                    >
                      {tc("termsOfUse")}
                    </button>
                    .
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-auto space-y-4">
            {currentStep === 1 && (
              <div className="text-center text-[14px] font-mabry">
                <span className="text-brand-orange">
                  {t("noAccount")}{" "}
                </span>
                <button
                  onClick={() => router.push("/user/createacc")}
                  className="text-brand-blue font-semibold hover:underline"
                >
                  {tc("signUp")}
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
                {currentStep === totalSteps ? t("verify") : tc("signIn")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default function Page() {
  return (
    <Suspense fallback={<Loader />}>
      <LoginPageContent />
    </Suspense>
  );
}
