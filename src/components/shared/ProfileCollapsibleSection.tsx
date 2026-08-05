"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";

type ProfileCollapsibleSectionProps = {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export function ProfileInfoRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value?.trim()) return null;
  return (
    <div className="py-2.5 border-b border-[#F2F4F7] last:border-0">
      <p className="text-[11px] font-poppins font-semibold uppercase tracking-wide text-[#98A2B3]">
        {label}
      </p>
      <p className="text-[14px] font-poppins text-[#1D2939] mt-0.5 break-words">{value}</p>
    </div>
  );
}

export default function ProfileCollapsibleSection({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: ProfileCollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-[#EAECF0] overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="min-w-0">
          <p className="text-[15px] font-gerat font-bold text-[#1D2939]">{title}</p>
          {subtitle ? (
            <p className="text-[12px] font-poppins text-[#667085] mt-0.5 truncate">{subtitle}</p>
          ) : null}
        </div>
        <ChevronRight
          size={18}
          className={`text-gray-400 shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>
      {open ? (
        <div className="px-4 pb-4 pt-1 border-t border-[#F2F4F7]">{children}</div>
      ) : null}
    </div>
  );
}
