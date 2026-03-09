"use client";

import React from "react";
import Image from "next/image";
import { X, Check } from "lucide-react";
import Button from "@/components/ui/button";

interface Step {
  id: string;
  label: string;
  sublabel?: string;
  completed: boolean;
}

interface FinishProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  onMaybeLater: () => void;
  completedPercentage: number;
  completedStepIds: string[];
}

const steps = [
  { id: "personal", label: "Add Personal Details", sublabel: "Let customers know you better" },
  { id: "skills", label: "Add Your Skills To Your Profile", sublabel: "Show users what you worked" },
  { id: "eligibility", label: "Add Your Work Eligibility", sublabel: "Tell them about your expertise" },
  { id: "identity", label: "Add Legal Identity & Document", sublabel: "Help customers recognize you" },
  { id: "payout", label: "Add Payout Information", sublabel: "Help customers recognize you" },
  { id: "verify", label: "Verify Identity", sublabel: "Completed" },
];

const FinishProfileModal: React.FC<FinishProfileModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  onMaybeLater,
  completedPercentage,
  completedStepIds = ["verify"], // Verify Identity is usually done at signup
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center bg-black/40 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] overflow-hidden animate-in slide-in-from-bottom duration-500">
        {/* Handle for drag indicator */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header Illustration */}
        <div className="relative h-48 w-full flex items-center justify-center pt-4">
          <button 
            onClick={onClose}
            className="absolute top-4 right-6 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
          
          <div className="w-40 h-40 relative flex items-center justify-center">
            {/* Dashed outer circle */}
            <div className="absolute inset-0 border-2 border-dashed border-brand-orange/60 rounded-[32px]" />
            {/* Inner avatar icon */}
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center shadow-sm">
                <div className="w-16 h-16 relative">
                    <Image src="/avatar.svg" alt="User avatar" fill className="opacity-60" />
                </div>
            </div>
            {/* Bottom line in illustration */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-24 h-1 bg-brand-orange/40 rounded-full" />
          </div>
        </div>

        <div className="px-8 pb-10 text-center">
          <h2 className="text-[24px] font-gerat font-bold text-[#1D2939] mb-2">
            Finish Your Profile
          </h2>
          <p className="text-[14px] font-poppins text-[#667085] mb-8 px-4">
            Youre already {completedPercentage}% of the way there! Complete these steps to start accepting jobs
          </p>

          <div className="space-y-0 text-left mb-8">
            {steps.map((step) => {
              const isCompleted = completedStepIds.includes(step.id);
              return (
                <div 
                  key={step.id}
                  className="flex items-start gap-4 py-4 border-b border-gray-50 last:border-0"
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                    isCompleted 
                      ? "bg-brand-orange border-brand-orange text-white" 
                      : "border-gray-300"
                  }`}>
                    {isCompleted && <Check size={14} strokeWidth={3} />}
                  </div>
                  <div>
                    <h4 className={`text-[15px] font-gerat font-bold ${
                      isCompleted ? "text-[#1D2939]" : "text-[#475467]"
                    }`}>
                      {step.label}
                    </h4>
                    <p className="text-[13px] font-poppins text-[#667085]">
                      {step.sublabel}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-4">
            <Button 
              variant="primary" 
              fullWidth 
              onClick={onComplete}
              className="py-4 text-[16px] font-gerat font-bold"
            >
              Complete Now
            </Button>
            <button 
              onClick={onMaybeLater}
              className="w-full text-[15px] font-gerat font-bold text-[#475467] hover:text-[#1D2939] transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinishProfileModal;
