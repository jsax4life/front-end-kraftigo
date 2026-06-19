"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

// ─── Country data ─────────────────────────────────────────────────────────────
// Each entry: [flag emoji, dial code, ISO name, subscriber number length]
// Length = typical national subscriber digits (without country code / leading 0)
const COUNTRIES: [string, string, string, number][] = [
  ["🇩🇪", "+49", "Germany", 10],
  ["🇬🇧", "+44", "United Kingdom", 10],
  ["🇺🇸", "+1", "United States", 10],
  ["🇨🇦", "+1", "Canada", 10],
  ["🇫🇷", "+33", "France", 9],
  ["🇳🇬", "+234", "Nigeria", 10],
  ["🇿🇦", "+27", "South Africa", 9],
  ["🇬🇭", "+233", "Ghana", 9],
  ["🇰🇪", "+254", "Kenya", 9],
  ["🇳🇱", "+31", "Netherlands", 9],
  ["🇧🇪", "+32", "Belgium", 9],
  ["🇨🇭", "+41", "Switzerland", 9],
  ["🇦🇹", "+43", "Austria", 10],
  ["🇮🇹", "+39", "Italy", 10],
  ["🇪🇸", "+34", "Spain", 9],
  ["🇵🇹", "+351", "Portugal", 9],
  ["🇸🇪", "+46", "Sweden", 9],
  ["🇳🇴", "+47", "Norway", 8],
  ["🇩🇰", "+45", "Denmark", 8],
  ["🇫🇮", "+358", "Finland", 9],
  ["🇵🇱", "+48", "Poland", 9],
  ["🇷🇴", "+40", "Romania", 9],
  ["🇬🇷", "+30", "Greece", 10],
  ["🇨🇿", "+420", "Czech Republic", 9],
  ["🇭🇺", "+36", "Hungary", 9],
  ["🇮🇳", "+91", "India", 10],
  ["🇨🇳", "+86", "China", 11],
  ["🇯🇵", "+81", "Japan", 10],
  ["🇰🇷", "+82", "South Korea", 10],
  ["🇧🇷", "+55", "Brazil", 11],
  ["🇲🇽", "+52", "Mexico", 10],
  ["🇦🇺", "+61", "Australia", 9],
  ["🇳🇿", "+64", "New Zealand", 9],
  ["🇸🇬", "+65", "Singapore", 8],
  ["🇲🇾", "+60", "Malaysia", 9],
  ["🇵🇭", "+63", "Philippines", 10],
  ["🇮🇩", "+62", "Indonesia", 11],
  ["🇦🇪", "+971", "UAE", 9],
  ["🇸🇦", "+966", "Saudi Arabia", 9],
  ["🇪🇬", "+20", "Egypt", 10],
  ["🇲🇦", "+212", "Morocco", 9],
  ["🇹🇳", "+216", "Tunisia", 8],
  ["🇨🇲", "+237", "Cameroon", 9],
  ["🇸🇳", "+221", "Senegal", 9],
  ["🇿🇼", "+263", "Zimbabwe", 9],
  ["🇹🇿", "+255", "Tanzania", 9],
  ["🇺🇬", "+256", "Uganda", 9],
  ["🇪🇹", "+251", "Ethiopia", 9],
  ["🇮🇪", "+353", "Ireland", 9],
  ["🇷🇺", "+7", "Russia", 10],
  ["🇹🇷", "+90", "Turkey", 10],
  ["🇵🇰", "+92", "Pakistan", 10],
  ["🇧🇩", "+880", "Bangladesh", 10],
];

const DEFAULT_COUNTRY = COUNTRIES[0]; // Germany

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

// ─── Component ────────────────────────────────────────────────────────────────
const PhoneInput = ({
  label,
  placeholder = "000 000 0000",
  value,
  onChange,
  onDialCodeChange,
  error,
  required = false,
  disabled = false,
  className = "",
}: PhoneInputProps) => {
  const [selectedCountry, setSelectedCountry] =
    useState<(typeof COUNTRIES)[number]>(DEFAULT_COUNTRY);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [flag, dialCode, , maxDigits] = selectedCountry;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleCountrySelect = (country: (typeof COUNTRIES)[number]) => {
    setSelectedCountry(country);
    setDropdownOpen(false);
    // Notify parent of the new dial code
    onDialCodeChange?.(country[1]);
    // Clear number when switching country so length validation resets
    onChange("");
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, maxDigits);
    onChange(digits);
  };

  // Expose the full E.164-ish value (dialCode + number) via a data attribute
  // so the parent can read it. The `value` prop stores only the subscriber digits.
  const fullNumber = `${dialCode}${value}`;

  return (
    <div className={`flex flex-col gap-2 ${className}`} data-full={fullNumber}>
      {label && (
        <label className="text-[14px] font-mabry text-gray-800">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative flex h-13 bg-[#F6F6F6] rounded-xl border border-[#0000001A] overflow-visible">
        {/* ── Country selector ── */}
        <div ref={dropdownRef} className="relative shrink-0">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3 h-full border-r border-[#0000001A] hover:bg-gray-100 transition-colors rounded-l-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-lg leading-none">{flag}</span>
            <span className="text-[13px] font-poppins text-gray-700 font-medium">
              {dialCode}
            </span>
            <ChevronDown
              size={14}
              className={`text-gray-500 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* ── Dropdown ── */}
          {dropdownOpen && (
            <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <ul className="max-h-56 overflow-y-auto">
                {COUNTRIES.map(([f, code, name, digits]) => (
                  <li key={`${code}-${name}`}>
                    <button
                      type="button"
                      onClick={() => handleCountrySelect([f, code, name, digits])}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                        selectedCountry[2] === name && selectedCountry[1] === code
                          ? "bg-orange-50"
                          : ""
                      }`}
                    >
                      <span className="text-base leading-none">{f}</span>
                      <span className="text-[13px] font-poppins text-gray-700 flex-1 truncate">
                        {name}
                      </span>
                      <span className="text-[12px] font-poppins text-gray-400 shrink-0">
                        {code}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ── Number input ── */}
        <input
          type="tel"
          inputMode="numeric"
          placeholder={placeholder}
          value={value}
          onChange={handleNumberChange}
          disabled={disabled}
          maxLength={maxDigits}
          className="flex-1 h-full px-4 py-2 bg-transparent outline-none text-[14px] font-poppins placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {error && <span className="text-red-500 text-[12px]">{error}</span>}
    </div>
  );
};

export default PhoneInput;
