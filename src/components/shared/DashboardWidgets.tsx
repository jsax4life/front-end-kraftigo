"use client";

import React from "react";
import { AlertOctagon } from "lucide-react";

export const PendingApprovalBanner = () => {
    return (
        <div className="w-full bg-[#FFB900] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <AlertOctagon size={20} className="text-[#1D2939]" />
                <p className="text-[14px] font-gerat font-bold text-[#1D2939]">
                    Your profile is pending approval
                </p>
            </div>
            <p className="text-[12px] font-poppins font-medium text-[#1D2939] opacity-80">
                Est 24-48h
            </p>
        </div>
    );
};

interface ProfileCompletionWidgetProps {
    totalSteps: number;
    completedSteps: number;
    onClick?: () => void;
}

export const ProfileCompletionWidget: React.FC<ProfileCompletionWidgetProps> = ({
    totalSteps = 6,
    completedSteps = 1,
    onClick
}) => {
    // Signup is step 1. So 5 steps of profile completion remain.
    const stepsToComplete = totalSteps - (completedSteps > 0 ? 1 : 0); 

    return (
        <div 
            onClick={onClick}
            className="w-full bg-[#EEF4FF] rounded-[24px] p-5 cursor-pointer hover:bg-[#E0EAFF] transition-all border border-[#00000008] shadow-sm animate-in fade-in duration-500"
        >
            <h3 className="text-[20px] font-gerat font-bold text-[#1D2939] mb-1">
                Complete your profile
            </h3>
            <p className="text-[14px] font-poppins text-[#475467] mb-5 leading-tight">
                <span className="font-bold text-[#1D2939]">5 steps</span> to complete your profile to start seeing jobs
            </p>
            
            <div className="flex gap-1 w-full h-2">
                {Array.from({ length: totalSteps }).map((_, idx) => (
                    <div 
                        key={idx}
                        className={`h-full flex-1 rounded-full transition-all duration-700 ${
                            idx < completedSteps ? "bg-[#3538CD]" : "bg-white"
                        }`}
                    />
                ))}
            </div>
        </div>
    );
};
