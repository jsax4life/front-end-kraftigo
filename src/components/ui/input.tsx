import React from "react";

interface InputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const Input = ({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  className = "",
}: InputProps) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-[14px] font-qurova text-gray-800">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full max-w-md lg:max-w-2xl h-13 px-4 py-2 bg-[#F6F6F6] rounded-xl border border-[#0000001A] outline-none text-[14px] font-poppins placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {error && <span className="text-red-500 text-[12px]">{error}</span>}
    </div>
  );
};

export default Input;
