"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

export const PendingApprovalBanner = () => {
    return (
        <div className="w-full bg-[#FFB900] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <AlertCircle size={20} className="text-[#1D2939]" />
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
    totalSteps = 5,
    completedSteps = 1,
    onClick
}) => {
    return (
        <div 
            onClick={onClick}
            className="w-full bg-[#EEF4FF] rounded-xl p-4 cursor-pointer hover:bg-[#E0EAFF] transition-colors border border-blue-100"
        >
            <h3 className="text-[16px] font-gerat font-bold text-[#1D2939] mb-1">
                Complete your profile
            </h3>
            <p className="text-[13px] font-poppins text-[#475467] mb-4">
                <span className="font-bold text-[#3538CD]">{totalSteps} steps</span> to complete your profile to start seeing jobs
            </p>
            
            <div className="flex gap-1.5 w-full">
                {Array.from({ length: totalSteps }).map((_, idx) => (
                    <div 
                        key={idx}
                        className={`h-1.5 flex-1 rounded-full transition-all ${
                            idx < completedSteps ? "bg-[#3538CD]" : "bg-white"
                        }`}
                    />
                ))}
            </div>
        </div>
    );
};
