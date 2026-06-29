"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, BellRing } from "lucide-react";
import TaskerNav from "@/components/shared/taskerNav";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import type { NotificationKey } from "@/lib/notificationPreferences";

interface ToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  onChange: () => void;
}

const NotificationToggle = ({ label, description, enabled, disabled, onChange }: ToggleProps) => (
  <div className="flex items-start justify-between py-6 border-b border-[#F2F4F7] last:border-0 gap-6">
    <div className="flex-1">
      <h3 className="text-[15px] font-poppins font-bold text-[#1D2939] mb-1">{label}</h3>
      <p className="text-[12px] text-[#667085] font-poppins leading-relaxed">{description}</p>
    </div>
    <button
      type="button"
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
        enabled ? "bg-brand-orange" : "bg-gray-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  </div>
);

const TOGGLE_META: { key: NotificationKey; label: string; description: string }[] = [
  {
    key: "booking",
    label: "Booking Info",
    description: "New requests, confirmations, and booking updates.",
  },
  {
    key: "support",
    label: "Customer Support",
    description: "Communication with our customer support team.",
  },
  {
    key: "promo",
    label: "Promotional Notifications",
    description: "Keep up with promotions and exclusive deals.",
  },
  {
    key: "late",
    label: "Late Notifications",
    description: "Alerts when a job runs past the scheduled time.",
  },
  {
    key: "news",
    label: "Newsletter & Articles",
    description: "News, products, and everything happening in Kraft.",
  },
];

const TaskerNotificationsPage = () => {
  const router = useRouter();
  const { settings, toggle, isLoading, isSaving } = useNotificationPreferences();

  return (
    <main className="min-h-screen bg-[#F9FAFB] pb-28">
      <div className="w-full flex items-center justify-between py-6 px-4 bg-white border-b border-[#F2F4F7]">
        <button type="button" onClick={() => router.back()} className="p-1 hover:opacity-70 transition-opacity">
          <ChevronLeft className="w-8 h-8 text-[#1D2939]" strokeWidth={1.5} />
        </button>
        <div className="text-center pr-10 flex-1">
          <h1 className="text-[20px] font-gerat font-bold text-[#1D2939]">Notifications</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h2 className="text-[28px] font-gerat font-bold text-[#1D2939] leading-tight">Notifications</h2>
          <p className="text-[14px] text-[#667085] font-poppins mt-2">
            Choose what you want to be notified about
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#F2F4F7] shadow-sm">
          {isLoading ? (
            <p className="text-[13px] font-poppins text-gray-500 py-4">Loading preferences…</p>
          ) : (
            <div className="flex flex-col">
              {TOGGLE_META.map((item) => (
                <NotificationToggle
                  key={item.key}
                  label={item.label}
                  description={item.description}
                  enabled={settings[item.key]}
                  disabled={isSaving}
                  onChange={() => toggle(item.key)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-10 flex items-center gap-3 p-5 bg-orange-50/50 rounded-2xl border border-orange-100">
          <BellRing className="text-brand-orange shrink-0" size={24} />
          <p className="text-[13px] font-poppins text-[#667085]">
            Important updates about your jobs may still be sent even when toggles are off.
          </p>
        </div>
      </div>

      <TaskerNav />
    </main>
  );
};

export default TaskerNotificationsPage;
