import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import Image from "next/image";

interface Option {
  value: string;
  label: string;
  image?: string;
}

interface ImageSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

const ImageSelect = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Select",
  required = false,
  error,
  disabled = false,
}: ImageSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-2 w-full" ref={containerRef}>
      {label && (
        <label className="text-[14px] font-qurova text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full h-13 px-4 py-2 bg-[#F6F6F6] rounded-xl border ${
            isOpen ? "border-brand-orange" : "border-[#0000001A]"
          } outline-none text-[14px] font-poppins text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between transition-colors`}
        >
          <div className="flex items-center gap-3">
            {selectedOption ? (
              <>
                {selectedOption.image && (
                  <div className="relative w-6 h-4 shrink-0 overflow-hidden rounded-sm">
                    <Image
                      src={selectedOption.image}
                      alt={selectedOption.label}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <span className="truncate">{selectedOption.label}</span>
              </>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-600 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            strokeWidth={2}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-[#0000001A] shadow-lg z-50 max-h-60 overflow-y-auto py-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors ${
                  value === option.value ? "bg-gray-50 font-medium" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {option.image && (
                    <div className="relative w-6 h-4 shrink-0 overflow-hidden rounded-sm">
                      <Image
                        src={option.image}
                        alt={option.label}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <span className="text-[14px] font-poppins text-gray-700">
                    {option.label}
                  </span>
                </div>
                {value === option.value && (
                  <Check size={16} className="text-brand-orange" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <span className="text-red-500 text-[12px]">{error}</span>}
    </div>
  );
};

export default ImageSelect;
