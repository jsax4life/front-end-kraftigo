"use client";

import React from "react";

// ─── Props ────────────────────────────────────────────────────────────────────
interface PhoneInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onDialCodeChange?: (dialCode: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const GERMANY_DIAL_CODE = "+49";
const MAX_DIGITS = 11;

// ─── Component ────────────────────────────────────────────────────────────────
const PhoneInput = ({
  label,
  placeholder = "000 000 0000",
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  className = "",
}: PhoneInputProps) => {
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, MAX_DIGITS);
    onChange(digits);
  };

  const fullNumber = `${GERMANY_DIAL_CODE}${value}`;

  return (
    <div className={`flex flex-col gap-2 ${className}`} data-full={fullNumber}>
      {label && (
        <label className="text-[14px] font-mabry text-gray-800">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative flex h-13 bg-[#F6F6F6] rounded-xl border border-[#0000001A] overflow-visible">
        {/* ── Fixed Germany prefix ── */}
        <div className="flex items-center gap-1.5 px-3 h-full border-r border-[#0000001A] shrink-0">
          <span className="text-lg leading-none">🇩🇪</span>
          <span className="text-[13px] font-poppins text-gray-700 font-medium">
            {GERMANY_DIAL_CODE}
          </span>
        </div>

        {/* ── Number input ── */}
        <input
          type="tel"
          inputMode="numeric"
          placeholder={placeholder}
          value={value}
          onChange={handleNumberChange}
          disabled={disabled}
          maxLength={MAX_DIGITS}
          className="flex-1 h-full px-4 py-2 bg-transparent outline-none text-[14px] font-poppins placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {error && <span className="text-red-500 text-[12px]">{error}</span>}
    </div>
  );
};

export default PhoneInput;
