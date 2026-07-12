"use client";

import { useState } from "react";
import { Check } from "lucide-react";

interface AvailabilityFilterDropdownProps {
  onApply?: (availability: string) => void;
  inline?: boolean;
}

export default function AvailabilityFilterDropdown({ onApply, inline }: AvailabilityFilterDropdownProps) {
  const [selectedAvailability, setSelectedAvailability] = useState<string>("flexible");

  const options = [
    { 
      id: "today", 
      title: "Available today", 
      description: "Find krafters who can help right now" 
    },
    { 
      id: "flexible", 
      title: "Flexible", 
      description: "Show krafters with flexible schedules" 
    },
  ];

  return (
    <div className={inline ? "flex flex-col gap-5 w-full" : "bg-white rounded-[20px] border border-[#0000001A] shadow-2xl p-6 w-full sm:w-[350px] flex flex-col gap-5"}>
      <p className="text-[16px] font-poppins font-bold text-[#2F2C2C]">{inline ? "Availability" : "Availability"}</p>
      
      <div className="flex flex-col gap-6 mt-1">
        {options.map(({ id, title, description }) => {
          const isSelected = selectedAvailability === id;
          return (
            <button
              key={id}
              onClick={() => {
                setSelectedAvailability(id);
                onApply?.(id);
              }}
              className="flex items-start gap-3 group w-full text-left"
            >
              <div 
                className={`flex-shrink-0 w-5 h-5 rounded-[6px] border-[2px] flex items-center justify-center transition-colors mt-0.5 ${
                  isSelected ? 'border-[#FB5D00] bg-[#FB5D00]' : 'border-gray-800 group-hover:border-[#FB5D00]'
                }`}
              >
                {isSelected && <Check size={12} strokeWidth={4} className="text-white" />}
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[14px] font-bold font-poppins text-[#2F2C2C]">
                  {title}
                </span>
                <span className="text-[14px] font-poppins text-[#0B0B0BCC] leading-snug">
                  {description}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

