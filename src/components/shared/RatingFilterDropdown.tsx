"use client";

import { useState } from "react";

interface RatingFilterDropdownProps {
  onApply?: (rating: number) => void;
  inline?: boolean;
}

export default function RatingFilterDropdown({ onApply, inline }: RatingFilterDropdownProps) {
  const [selectedRating, setSelectedRating] = useState<number>(0);

  const ratings = [
    { value: 0, label: "0+" },
    { value: 1, label: "1" },
    { value: 2, label: "2" },
    { value: 3, label: "3" },
    { value: 4, label: "4" },
    { value: 5, label: "5+" },
  ];

  return (
    <div className={inline ? "flex flex-col justify-center gap-[15px]" : "bg-white rounded-[20px] border border-[#0000001A] shadow-2xl p-[20px] w-full sm:w-[286px] h-auto sm:h-[105px] flex flex-col justify-center gap-[15px]"}>
      <p className="text-[16px] font-poppins font-bold text-[#2F2C2C]">Rating</p>
      
      <div className="flex justify-between items-center w-full">
        {ratings.map(({ value, label }) => {
          const isSelected = selectedRating === value;
          return (
            <button
              key={value}
              onClick={() => {
                setSelectedRating(value);
                onApply?.(value);
              }}
              className="relative flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
              style={{ width: "36px", height: "34px" }}
            >
              <svg 
                width="36" 
                height="34" 
                viewBox="0 0 36 34" 
                fill={isSelected ? "#FB5D00" : "none"} 
                stroke="#FB5D00"
                strokeWidth={isSelected ? "0" : "0.8"}
                xmlns="http://www.w3.org/2000/svg"
                className="absolute inset-0"
              >
                <path d="M17.5259 0L23.8948 9.6616L35.0517 12.7333L27.831 21.7761L28.3574 33.3361L17.5259 29.2633L6.6943 33.3361L7.2207 21.7761L0 12.7333L11.1569 9.6616Z" />
              </svg>
              <span 
                className={`relative z-10 text-[10px] font-bold font-poppins mt-[2px] ${isSelected ? "text-white" : "text-[#FB5D00]"}`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
