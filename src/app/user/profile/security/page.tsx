"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import toast from "react-hot-toast";
import Header from "@/components/shared/Header";
import { useAuthStore } from "@/store/useAuthStore";
import { AUTH_CONFIG } from "@/constants/auth";

const SecurityPage = () => {
  const router = useRouter();
  const { changePassword, isLoading, isTasker } = useAuthStore();
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const handleUpdate = async () => {
    if (!passwords.current.trim()) {
      toast.error("Enter your current password.");
      return;
    }
    if (passwords.new.length < AUTH_CONFIG.MIN_PASSWORD_LENGTH) {
      toast.error(`New password must be at least ${AUTH_CONFIG.MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    if (passwords.new === passwords.current) {
      toast.error("New password must be different from your current password.");
      return;
    }

    try {
      const message = await changePassword(passwords.current, passwords.new);
      toast.success(message || "Your password has been updated. Please sign in again with your new password.");
      router.replace(isTasker() ? "/tasker/login" : "/user/login");
    } catch (error: unknown) {
      const ax = error as { response?: { data?: { message?: string } } };
      const msg = ax.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg || "Could not update password.");
    }
  };

  return (
    <main className="min-h-screen bg-[#F9FAFB] flex flex-col">
      <Header title="Security" showLogout={false} />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-10">
          <h2 className="text-[32px] font-gerat font-[850] text-[#1D2939] leading-tight">
            Security
          </h2>
          <p className="text-[14px] text-[#667085] font-poppins mt-2">
            Manage your account security and password
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#F2F4F7] shadow-sm mb-10">
          <h3 className="text-[12px] font-poppins font-bold text-[#98A2B3] uppercase tracking-widest mb-6">
            Change Password
          </h3>
          <div className="space-y-6">
            <Input
              label="Current password"
              type="password"
              value={passwords.current}
              onChange={(val) => setPasswords({ ...passwords, current: val })}
              placeholder="Enter current password"
            />
            <Input
              label="New password"
              type="password"
              value={passwords.new}
              onChange={(val) => setPasswords({ ...passwords, new: val })}
              placeholder="Enter new password"
            />
            <Input
              label="Confirm password"
              type="password"
              value={passwords.confirm}
              onChange={(val) => setPasswords({ ...passwords, confirm: val })}
              placeholder="Confirm new password"
            />
          </div>
          <div className="pt-8">
            <Button variant="primary" fullWidth onClick={() => void handleUpdate()} disabled={isLoading}>
              {isLoading ? "Updating…" : "Change Password"}
            </Button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#F2F4F7] shadow-sm">
          <h3 className="text-[12px] font-poppins font-bold text-[#98A2B3] uppercase tracking-widest mb-6">
            Device History
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
            <p className="text-[14px] font-poppins font-semibold text-[#98A2B3]">No device history available</p>
            <p className="text-[12px] font-poppins text-[#D0D5DD] mt-1">
              Devices that access your account will appear here
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default SecurityPage;
