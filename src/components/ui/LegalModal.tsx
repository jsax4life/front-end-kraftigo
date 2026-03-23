"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import Image from "next/image";

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export const LegalModal = ({ isOpen, onClose, title, children }: LegalModalProps) => {
  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white animate-in fade-in duration-200">
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/craft.svg"
              alt="Kraftigö"
              width={90}
              height={30}
              className="h-7 w-auto object-contain"
            />
            <span className="text-gray-300 text-lg">|</span>
            <h2 className="text-[16px] sm:text-[18px] font-gerat font-bold text-[#1D2939]">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X size={18} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 pb-16">
          {children}
        </div>
      </div>

      {/* ── Footer CTA ── */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-4">
          <button
            onClick={onClose}
            className="w-full bg-[#FF6600] text-white font-poppins font-semibold text-[15px] py-4 rounded-full hover:bg-[#e65c00] active:scale-[0.98] transition-all duration-150"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
