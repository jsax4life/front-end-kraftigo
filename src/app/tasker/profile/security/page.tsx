"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import toast from "react-hot-toast";
import TaskerNav from "@/components/shared/taskerNav";
import DeleteAccountModal from "@/components/shared/DeleteAccountModal";
import { deleteAccount } from "@/lib/api/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { AUTH_CONFIG } from "@/constants/auth";

const SecurityPage = () => {
  const router = useRouter();
  const { changePassword, isLoading, logout } = useAuthStore();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });

  const handleChangePassword = async () => {
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
    try {
      const message = await changePassword(passwords.current, passwords.new);
      toast.success(message || "Your password has been updated. Please sign in again.");
      router.replace("/tasker/login");
    } catch (error: unknown) {
      const ax = error as { response?: { data?: { message?: string } } };
      const msg = ax.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg || "Could not update password.");
    }
  };

  const handleDeleteAccount = async (payload: {
    password?: string;
    confirmation?: "DELETE_MY_KRAFTIGO_ACCOUNT";
  }) => {
    try {
      await deleteAccount(payload);
      await logout();
      toast.success("Account closed successfully.");
      router.replace("/tasker/login");
    } catch (error: unknown) {
      const ax = error as { response?: { data?: { message?: string } } };
      const message =
        ax.response?.data?.message ||
        "Could not close account. Check active bookings/applications and try again.";
      toast.error(Array.isArray(message) ? message.join(", ") : message);
      throw error;
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="w-full flex items-center justify-between py-6 px-4 bg-white border-b border-[#F2F4F7]">
        <button type="button" onClick={() => router.back()} className="p-1 hover:opacity-70 transition-opacity">
          <ChevronLeft className="w-8 h-8 text-[#1D2939]" strokeWidth={1.5} />
        </button>
        <div className="text-center pr-10 flex-1">
          <h1 className="text-[20px] font-gerat font-bold text-[#1D2939]">Security</h1>
        </div>
      </div>

      <div className="px-5 py-8 space-y-10 max-w-2xl mx-auto pb-32">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-gerat font-bold text-[#1D2939]">Password</h2>
            <button
              type="button"
              onClick={() => setShowPasswordForm((v) => !v)}
              className="text-brand-orange text-[14px] font-poppins font-bold hover:underline"
            >
              {showPasswordForm ? "Cancel" : "Change"}
            </button>
          </div>
          {showPasswordForm ? (
            <div className="space-y-4">
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
              <Button variant="primary" fullWidth onClick={() => void handleChangePassword()} disabled={isLoading}>
                {isLoading ? "Updating…" : "Update password"}
              </Button>
            </div>
          ) : (
            <Input type="password" value="********" onChange={() => {}} disabled className="bg-[#F9FAFB] border-[#F2F4F7]" />
          )}
        </section>

        <section className="space-y-4 pt-8">
          <div className="space-y-1">
            <h2 className="text-[16px] font-gerat font-bold text-[#1D2939]">Close your account</h2>
            <p className="text-[14px] font-poppins text-[#667085]">
              Request to close your account and data, based on applicable law and our policies
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className="w-full bg-[#FEF3F2] py-4 rounded-2xl text-[#F04438] font-poppins font-bold text-[15px] hover:bg-red-100 transition-colors"
          >
            Close Account
          </button>
        </section>
      </div>
      <TaskerNav />
      <DeleteAccountModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
      />
    </main>
  );
};

export default SecurityPage;
