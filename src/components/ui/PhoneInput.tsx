"use client";

import React from "react";

interface PhoneInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const PhoneInput = ({
  label,
  placeholder = "Phone number",
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  className = "",
}: PhoneInputProps) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-[14px] font-mabry text-gray-800">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="flex h-13 bg-[#F6F6F6] rounded-xl border border-[#0000001A] overflow-hidden">
        {/* Country code prefix */}
        <div className="flex items-center gap-1.5 px-3 border-r border-[#0000001A] shrink-0">
          <span className="text-lg leading-none">🇩🇪</span>
          <span className="text-[14px] font-poppins text-gray-700 font-medium">
            +49
          </span>
        </div>

        {/* Phone number input */}
        <input
          type="tel"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "");
            onChange(val);
          }}
          disabled={disabled}
          className="flex-1 h-full px-4 py-2 bg-transparent outline-none text-[14px] font-poppins placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
      {error && <span className="text-red-500 text-[12px]">{error}</span>}
    </div>
  );
};

export default PhoneInput;
