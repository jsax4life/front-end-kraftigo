"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import toast from "react-hot-toast";

import Header from "@/components/shared/Header";

const SecurityPage = () => {
  const router = useRouter();
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  const handleUpdate = () => {
    if (passwords.new !== passwords.confirm) {
        toast.error("Passwords do not match");
        return;
    }
    toast.success("Password updated successfully!");
    router.back();
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

        {/* Password Section */}
        <div className="bg-white p-6 rounded-2xl border border-[#F2F4F7] shadow-sm mb-10">
            <h3 className="text-[12px] font-poppins font-bold text-[#98A2B3] uppercase tracking-widest mb-6">Change Password</h3>
            <div className="space-y-6">
              <Input 
                label="Current password"
                type="password"
                value={passwords.current}
                onChange={(val) => setPasswords({...passwords, current: val})}
                placeholder="Enter current password"
              />
              <Input 
                label="New password"
                type="password"
                value={passwords.new}
                onChange={(val) => setPasswords({...passwords, new: val})}
                placeholder="Enter new password"
              />
              <Input 
                label="Confirm password"
                type="password"
                value={passwords.confirm}
                onChange={(val) => setPasswords({...passwords, confirm: val})}
                placeholder="Confirm new password"
              />
            </div>
            <div className="pt-8">
              <Button variant="primary" fullWidth onClick={handleUpdate}>
                Change Password
              </Button>
            </div>
        </div>

        {/* Device Information */}
        <div className="bg-white p-6 rounded-2xl border border-[#F2F4F7] shadow-sm">
            <h3 className="text-[12px] font-poppins font-bold text-[#98A2B3] uppercase tracking-widest mb-6">Device History</h3>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 bg-gray-50 text-gray-300 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-[14px] font-poppins font-semibold text-[#98A2B3]">No device history available</p>
              <p className="text-[12px] font-poppins text-[#D0D5DD] mt-1">Devices that access your account will appear here</p>
            </div>
        </div>

        {/* Delete Account */}
        <div className="pt-16 pb-10 text-center">
            <button className="text-[13px] font-poppins font-bold text-[#F04438] uppercase tracking-widest hover:text-red-700 transition-colors">
                Delete Account
            </button>
        </div>
      </div>
    </main>
  );
};

export default SecurityPage;
