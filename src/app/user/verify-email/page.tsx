"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import EmailVerificationForm from "@/components/auth/EmailVerificationForm";
import Loader from "@/components/ui/loader";
import { AUTH_CONFIG } from "@/constants/auth";
import { useAuthStore } from "@/store/useAuthStore";
import {
  clearPendingEmailVerification,
  getPendingEmailVerification,
  setPendingEmailVerification,
} from "@/lib/pendingEmailVerification";
import { isValidEmail } from "@/utils/validation";

function readVerificationCodeFromSearch(
  searchParams: URLSearchParams,
): string {
  for (const key of ["code", "otp", "verificationCode"]) {
    const raw = searchParams.get(key)?.trim() ?? "";
    const digits = raw.replace(/\D/g, "");
    if (digits.length >= AUTH_CONFIG.OTP_LENGTH) {
      return digits.slice(0, AUTH_CONFIG.OTP_LENGTH);
    }
  }
  return "";
}

function VerifyEmailPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyEmail, resendVerificationCode, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [initialCode, setInitialCode] = useState("");
  const [autoVerifying, setAutoVerifying] = useState(false);
  const autoVerifyAttempted = useRef(false);

  useEffect(() => {
    const fromQuery = searchParams.get("email")?.trim().toLowerCase() ?? "";
    const fromStorage = getPendingEmailVerification()?.email ?? "";
    const fromAuth = useAuthStore.getState().user?.email?.trim().toLowerCase() ?? "";
    const resolved = fromQuery || fromStorage || fromAuth;
    if (resolved) {
      setEmail(resolved);
      setPendingEmailVerification(resolved);
    }

    const codeFromUrl = readVerificationCodeFromSearch(searchParams);
    if (codeFromUrl) {
      setInitialCode(codeFromUrl);
    }
  }, [searchParams]);

  const completeVerification = async (targetEmail: string, otpCode: string) => {
    await verifyEmail(targetEmail, otpCode);
    clearPendingEmailVerification();
    toast.success("Email verified! Sign in to continue.");
    router.replace(`/user/login?email=${encodeURIComponent(targetEmail)}&verified=1`);
  };

  useEffect(() => {
    if (autoVerifyAttempted.current || isLoading) {
      return;
    }

    const codeFromUrl = readVerificationCodeFromSearch(searchParams);
    if (!codeFromUrl || !isValidEmail(email)) {
      return;
    }

    autoVerifyAttempted.current = true;
    setAutoVerifying(true);

    void completeVerification(email, codeFromUrl).catch((err: unknown) => {
      setAutoVerifying(false);
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(
        e.response?.data?.message || "Verification failed. Check your code and try again.",
      );
    });
  }, [email, isLoading, searchParams]);

  const handleVerify = async (otpCode: string) => {
    if (!isValidEmail(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    try {
      await completeVerification(email, otpCode);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(
        e.response?.data?.message || "Verification failed. Check your code and try again.",
      );
    }
  };

  const handleResend = async () => {
    if (!isValidEmail(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    try {
      const message = await resendVerificationCode(email);
      setPendingEmailVerification(email);
      toast.success(message || "Verification code sent");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || "Could not resend code. Try again later.");
    }
  };

  if (autoVerifying || (isLoading && initialCode)) {
    return (
      <main className="relative w-full min-h-screen bg-white flex items-center justify-center px-4">
        <Loader />
      </main>
    );
  }

  return (
    <main className="relative w-full min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {isLoading ? (
        <Loader />
      ) : (
        <div className="w-full max-w-3xl mx-auto min-h-screen flex flex-col py-8">
          <div className="flex items-center justify-between mb-8">
            <button
              type="button"
              onClick={() => router.push("/user/login")}
              className="text-2xl hover:opacity-70 transition-opacity"
              aria-label="Back to login"
            >
              <ArrowLeft />
            </button>
          </div>

          <div className="flex-1">
            <EmailVerificationForm
              email={email}
              onEmailChange={setEmail}
              allowEmailEdit={!searchParams.get("email") && !getPendingEmailVerification()?.email}
              isLoading={isLoading}
              initialCode={initialCode}
              onVerify={handleVerify}
              onResend={handleResend}
            />
          </div>

          <p className="text-center text-[14px] font-poppins text-gray-600 mt-8">
            Already verified?{" "}
            <button
              type="button"
              onClick={() => router.push("/user/login")}
              className="text-brand-blue font-semibold hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      )}
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<Loader />}>
      <VerifyEmailPageContent />
    </Suspense>
  );
}
