"use client";

import React from "react";
import Image from "next/image";
import { X, Check } from "lucide-react";

interface FinishProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  completedPercentage: number;
  completedStepIds: string[];
  pendingStepIds?: string[];
  onStepClick?: (stepId: string) => void;
}

const steps = [
  
  {
    id: "eligibility",
    label: "Add Your Work Eligibility",
    sublabel: "Tell them about your expertise",
  },
  {
    id: "identity",
    label: "Add Legal Document",
    sublabel: "Let customers know you better",
  },
  {
    id: "personal",
    label: "Add Personal Details",
    sublabel: "Let customers know you better",
  },
  {
    id: "skills",
    label: "Add Your Skills To Your Profile",
    sublabel: "Show users what you worked",
  },
  {
    id: "payout",
    label: "Add Payout Information",
    sublabel: "Help customers recognize you",
  },
];

const FinishProfileModal: React.FC<FinishProfileModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  completedPercentage,
  completedStepIds = [],
  pendingStepIds = [],
  onStepClick,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center bg-black/40 animate-in fade-in duration-300">
      <div className="bg-white w-full h-[90vh] overflow-scroll max-w-lg rounded-t-2xl sm:rounded-4xl animate-in slide-in-from-bottom duration-500 mt-30">
        {/* Handle for drag indicator */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-25 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header Illustration */}
        <div className="relative h-64 w-full flex items-center justify-center pt-8">
          <button
            onClick={onClose}
            className="absolute top-2 right-8 p-1.5 text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <X size={30} strokeWidth={1.5} />
          </button>

          <div className="w-95 h-50 relative flex items-center justify-center mt-5">
            {/* Dashed outer rounded box/circle */}
            <div className="absolute inset-0 border-2 border-dashed border-brand-orange bg-[#FF66001A] rounded-2xl opacity-80" />

            <Image src="/taskpro.svg" alt="taskpro" width={140} height={140} />
          </div>
        </div>

        <div className="px-8 pb-10 text-center mt-5">
          <h2 className="text-[26px] font-gerat font-bold text-[#1D2939] mb-1">
            Finish Your Profile
          </h2>
          <p className="text-[14px] font-poppins text-[#667085] mb-8">
            Youre already {completedPercentage}% of the way there! Complete
            these steps to start accepting jobs
          </p>

          <div className="space-y-0 text-left mb-10">
            {steps.map((step) => {
              const isCompleted = completedStepIds.includes(step.id);
              const isPending = pendingStepIds.includes(step.id);
              const isChecked = isCompleted || isPending;

              return (
                <div
                  key={step.id}
                  onClick={() => {
                    // Do not allow clicking if it says pending to avoid overriding uploads
                    if (isPending) return;
                    
                    if (onStepClick) {
                      onStepClick(step.id);
                    } else {
                      onComplete();
                    }
                  }}
                  className={`flex items-center justify-between py-4 border-b border-[#0000001A] last:border-0 hover:bg-gray-50 transition-colors px-2 -mx-2 rounded-lg ${isPending ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-4" >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isChecked
                          ? "bg-brand-orange border-brand-orange text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {isChecked ? (
                        <Check size={12} strokeWidth={4} />
                      ) : (
                        <div className="w-1.5 h-1.5 bg-transparent" />
                      )}
                    </div>
                    <div>
                      <h4
                        className={`text-[15px] font-gerat font-bold ${
                          isCompleted ? "text-[#98A2B3]" : "text-[#1D2939]"
                        }`}
                      >
                        {step.label}
                      </h4>
                      {!isChecked && step.sublabel && (
                        <p className="text-[13px] font-poppins text-[#667085]">
                          {step.sublabel}
                        </p>
                      )}
                      {isCompleted && (
                        <p className="text-[13px] font-poppins text-[#98A2B3]">
                          Completed
                        </p>
                      )}
                      {isPending && (
                        <p className="text-[13px] font-poppins text-brand-orange mt-0.5">
                          Waiting for approval
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinishProfileModal;
