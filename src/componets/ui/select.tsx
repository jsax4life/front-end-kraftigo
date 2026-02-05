import React from "react";
import { ChevronDown } from "lucide-react";


interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

const Select = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Select",
  required = false,
  error,
  disabled = false,
}: SelectProps) => {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-[14px] font-qurova text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full max-w-md lg:max-w-2xl h-13 px-4 py-2 bg-[#F6F6F6] rounded-xl border border-[#0000001A] outline-none text-[14px] font-poppins text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-10"
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 pointer-events-none"
          strokeWidth={2}
        />
      </div>
      {error && <span className="text-red-500 text-[12px]">{error}</span>}
    </div>
  );
};

export default Select;
