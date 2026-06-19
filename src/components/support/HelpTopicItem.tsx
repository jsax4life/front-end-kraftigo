"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface HelpTopicItemProps {
  label: string;
  answer: string;
  onClick?: () => void;
}

const HelpTopicItem = ({ label, answer, onClick }: HelpTopicItemProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    setIsOpen((prev) => !prev);
    onClick?.();
  };

  return (
    <div className="border-b border-[#F2F4F7]">
      <button
        onClick={handleClick}
        className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-50 transition-colors px-1"
      >
        <span className="text-[16px] text-[#344054] font-poppins pr-4">{label}</span>
        <ChevronDown
          className={`w-5 h-5 text-[#98A2B3] shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="px-1 pb-4">
          <p className="text-[14px] text-[#667085] font-poppins leading-relaxed">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
};

export default HelpTopicItem;
