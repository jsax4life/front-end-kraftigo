"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import toast from "react-hot-toast";
import Header from "@/components/shared/Header";
import { useAuthStore } from "@/store/useAuthStore"
import { AUTH_CONFIG } from "@/constants/auth";
import { isGoogleOnlyAccount } from "@/lib/googleAuth";
import { useTranslations } from "next-intl";


const SecurityPage = () => {
  const router = useRouter();
  const { changePassword, isLoading, isTasker, user } = useAuthStore();
  const googleOnly = isGoogleOnlyAccount(user?.authProvider);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const t = useTranslations("profile.security");

  const handleUpdate = async () => {
    if (!passwords.current.trim()) {
      toast.error(t("currentPasswordReq"));
      return;
    }
    if (passwords.new.length < AUTH_CONFIG.MIN_PASSWORD_LENGTH) {
      toast.error(t("newPasswordMin", { min: AUTH_CONFIG.MIN_PASSWORD_LENGTH }));
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast.error(t("passwordMismatch"));
      return;
    }
    if (passwords.new === passwords.current) {
      toast.error(t("newPasswordSame"));
      return;
    }

    try {
      const message = await changePassword(passwords.current, passwords.new);
      toast.success(message || t("passwordUpdated"));
      router.replace(isTasker() ? "/tasker/login" : "/user/login");
    } catch (error: unknown) {
      const ax = error as { response?: { data?: { message?: string } } };
      const msg = ax.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg || t("passwordUpdateError"));
    }
  };

  return (
    <main className="min-h-screen bg-[#F9FAFB] flex flex-col">
      <Header title={t("title")} showLogout={false} />

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-10">
          <h2 className="text-[32px] font-gerat font-[850] text-[#1D2939] leading-tight">
            {t("title")}
          </h2>
          <p className="text-[14px] text-[#667085] font-poppins mt-2">
            {t("desc")}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#F2F4F7] shadow-sm mb-10">
          <h3 className="text-[12px] font-poppins font-bold text-[#98A2B3] uppercase tracking-widest mb-6">
            {t("changePassword")}
          </h3>
          {googleOnly ? (
            <div className="space-y-4">
              <p className="text-[14px] font-poppins text-[#667085] leading-relaxed">
                {t("googleSignInMsg")}{" "}
                <button
                  type="button"
                  onClick={() => router.push("/user/forgot-password")}
                  className="text-brand-blue font-semibold underline"
                >
                  {t("forgotPassword")}
                </button>{" "}
                {t("googleSignInMsgEnd")}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                <Input
                  label={t("currentPassword")}
                  type="password"
                  value={passwords.current}
                  onChange={(val) => setPasswords({ ...passwords, current: val })}
                  placeholder={t("enterCurrentPassword")}
                />
                <Input
                  label={t("newPassword")}
                  type="password"
                  value={passwords.new}
                  onChange={(val) => setPasswords({ ...passwords, new: val })}
                  placeholder={t("enterNewPassword")}
                />
                <Input
                  label={t("confirmPassword")}
                  type="password"
                  value={passwords.confirm}
                  onChange={(val) => setPasswords({ ...passwords, confirm: val })}
                  placeholder={t("enterConfirmPassword")}
                />
              </div>
              <div className="pt-8">
                <Button variant="primary" fullWidth onClick={() => void handleUpdate()} disabled={isLoading}>
                  {isLoading ? t("updating") : t("changePassword")}
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#F2F4F7] shadow-sm">
          <h3 className="text-[12px] font-poppins font-bold text-[#98A2B3] uppercase tracking-widest mb-6">
            {t("deviceHistory")}
          </h3>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 bg-gray-50 text-gray-300 rounded-xl flex items-center justify-center mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-[14px] font-poppins font-semibold text-[#98A2B3]">{t("noDeviceHistory")}</p>
            <p className="text-[12px] font-poppins text-[#D0D5DD] mt-1">
              {t("deviceHistoryDesc")}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default SecurityPage;
