import { ChevronDown } from "lucide-react";

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
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
  className,
}: SelectProps) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label className="text-[14px] font-mabry text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full h-13 px-4 bg-[#F6F6F6] rounded-xl border border-[#0000001A] outline-none text-[14px] font-poppins text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer appearance-none pr-10 ${className}`}
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
          className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 pointer-events-none ${className?.includes("bg-brand-orange") ? "text-white" : ""}`}
          strokeWidth={2}
        />
      </div>
      {error && <span className="text-red-500 text-[12px]">{error}</span>}
    </div>
  );
};

export default Select;
