"use client";

import { useEffect, useState } from "react";
import { useOTPInput } from "@/hooks/useOTPInput";
import { AUTH_CONFIG } from "@/constants/auth";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { isValidEmail } from "@/utils/validation";
import { useTranslations } from "next-intl";

type EmailVerificationFormProps = {
  email: string;
  onEmailChange?: (email: string) => void;
  allowEmailEdit?: boolean;
  isLoading?: boolean;
  initialCode?: string;
  otpLength?: number;
  onVerify: (otpCode: string) => void | Promise<void>;
  onResend: () => void | Promise<void>;
  submitLabel?: string;
};

export default function EmailVerificationForm({
  email,
  onEmailChange,
  allowEmailEdit = false,
  isLoading = false,
  initialCode = "",
  otpLength = AUTH_CONFIG.OTP_LENGTH,
  onVerify,
  onResend,
  submitLabel,
}: EmailVerificationFormProps) {
  const [resendTimer, setResendTimer] = useState(0);
  const t = useTranslations("auth.verifyEmail");
  const tc = useTranslations("auth.common");
  const {
    code: verificationCode,
    handleCodeChange,
    handleKeyDown,
    reset: resetCode,
    isComplete,
    setFromString,
  } = useOTPInput(otpLength, initialCode);

  useEffect(() => {
    if (initialCode) {
      setFromString(initialCode);
    }
  }, [initialCode, setFromString]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleResendClick = async () => {
    if (resendTimer > 0 || isLoading) return;
    await onResend();
    setResendTimer(60);
    resetCode();
  };

  const handleSubmit = () => {
    if (!isComplete() || isLoading) return;
    if (allowEmailEdit && !isValidEmail(email)) return;
    void onVerify(verificationCode.join(""));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-4">
          {t("title")}
        </h1>
        {allowEmailEdit ? (
          <div className="mb-6">
            <Input
              label={tc("emailLabel")}
              type="email"
              placeholder={tc("emailPlaceholder")}
              value={email}
              onChange={(value) => onEmailChange?.(value)}
            />
          </div>
        ) : (
          <p className="text-[14px] font-poppins text-gray-600 mb-2">
            {t("sentCodeTo")}{" "}
            <span className="font-semibold text-gray-900 break-all">{email}</span>
          </p>
        )}
        {!allowEmailEdit && (
          <p className="text-[13px] font-poppins text-gray-500 mb-6 leading-relaxed">
            {t("spamNote")}
          </p>
        )}
      </div>

      <div className="flex gap-2 sm:gap-3 justify-center md:mt-12 mb-6">
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

      <div className="text-center">
        {resendTimer > 0 ? (
          <p className="text-[14px] font-poppins text-gray-600">
            {t("resendIn")}{" "}
            <span className="font-semibold text-gray-900">
              00:{resendTimer.toString().padStart(2, "0")}
            </span>
          </p>
        ) : (
          <button
            type="button"
            onClick={() => void handleResendClick()}
            disabled={isLoading || (allowEmailEdit && !isValidEmail(email))}
            className="text-[14px] font-poppins text-brand-orange font-semibold hover:underline disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {t("resendCode")}
          </button>
        )}
      </div>

      <Button
        variant="primary"
        onClick={handleSubmit}
        fullWidth
        disabled={!isComplete() || isLoading || (allowEmailEdit && !isValidEmail(email))}
      >
        {submitLabel ?? t("verifyButton")}
      </Button>
    </div>
  );
}
