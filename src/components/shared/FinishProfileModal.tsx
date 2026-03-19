"use client";

import React from "react";
import Image from "next/image";
import { X, Check, User as UserIcon } from "lucide-react";
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
        <div className="relative h-64 w-full flex items-center justify-center pt-8">
          <button 
            onClick={onClose}
            className="absolute top-6 right-8 p-1.5 text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <X size={24} strokeWidth={1.5} />
          </button>
          
          <div className="w-56 h-44 relative flex items-center justify-center">
            {/* Dashed outer rounded box/circle */}
            <div className="absolute inset-0 border-2 border-dashed border-brand-orange rounded-[40px] opacity-80" />
            <div className="absolute inset-4 border border-[#0000000D] rounded-[32px] bg-white flex items-center justify-center shadow-sm">
                <div className="w-24 h-24 relative flex items-center justify-center border-2 border-brand-orange border-dashed rounded-full p-2">
                    <div className="w-full h-full bg-orange-50 rounded-full flex items-center justify-center">
                      <UserIcon size={40} className="text-brand-orange opacity-80" />
                    </div>
                </div>
            </div>
            {/* Bottom line in illustration */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-28 h-1 bg-brand-orange rounded-full opacity-60" />
          </div>
        </div>

        <div className="px-8 pb-10 text-center -mt-4">
          <h2 className="text-[26px] font-gerat font-bold text-[#1D2939] mb-1">
            Finish Your Profile
          </h2>
          <p className="text-[14px] font-poppins text-[#667085] mb-8">
            Youre already {completedPercentage}% of the way there! Complete these steps to start accepting jobs
          </p>

          <div className="space-y-0 text-left mb-10">
            {steps.map((step) => {
              const isCompleted = completedStepIds.includes(step.id);
              return (
                <div 
                  key={step.id}
                  className="flex items-center justify-between py-4 border-b border-[#F2F4F7] last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isCompleted 
                        ? "bg-brand-orange border-brand-orange text-white" 
                        : "border-gray-300"
                    }`}>
                      {isCompleted ? (
                        <Check size={12} strokeWidth={4} />
                      ) : (
                        <div className="w-1.5 h-1.5 bg-transparent" />
                      )}
                    </div>
                    <div>
                      <h4 className={`text-[15px] font-gerat font-bold ${
                        isCompleted ? "text-[#98A2B3]" : "text-[#1D2939]"
                      }`}>
                        {step.label}
                      </h4>
                      {!isCompleted && step.sublabel && (
                        <p className="text-[13px] font-poppins text-[#667085]">
                          {step.sublabel}
                        </p>
                      )}
                      {isCompleted && (
                        <p className="text-[13px] font-poppins text-[#98A2B3]">Completed</p>
                      )}
                    </div>
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
