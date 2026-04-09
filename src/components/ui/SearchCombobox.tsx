import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown } from "lucide-react";

interface SearchComboboxProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  isLoading?: boolean;
  placeholder?: string;
  required?: boolean;
  emptyMessage?: string;
}

export const SearchCombobox = ({
  label,
  value,
  onChange,
  options,
  isLoading = false,
  placeholder = "Search…",
  required = false,
  emptyMessage,
}: SearchComboboxProps) => {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        if (!options.includes(query)) setQuery(value);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [query, value, options]);

  // Sync when parent resets value
  useEffect(() => {
    setQuery(value);
  }, [value]);

  const handleSelect = (opt: string) => {
    setQuery(""); // Clear immediately after selecting so they can search again
    onChange(opt);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative space-y-1.5 w-full">
      <label className="text-[14px] font-poppins text-gray-800 font-medium block">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="text"
          value={query}
          placeholder={isLoading ? "Loading…" : placeholder}
          disabled={isLoading}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (e.target.value !== value) onChange("");
          }}
          className="w-full px-4 pl-10 pr-10 py-4 rounded-2xl bg-[#F6F6F6] border border-[#EAECF0] outline-none font-poppins text-[15px] focus:border-brand-orange transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <ChevronDown
          size={16}
          className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* Dropdown */}
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-[#EAECF0] rounded-2xl shadow-xl max-h-56 overflow-y-auto mt-1 py-1">
          {filtered.slice(0, 100).map((opt) => (
            <li key={opt}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); 
                  handleSelect(opt);
                }}
                className={`w-full text-left px-4 py-2.5 font-poppins text-[14px] hover:bg-[#FFF4EE] hover:text-brand-orange transition-colors ${
                  opt === value
                    ? "text-brand-orange font-semibold bg-[#FFF4EE]"
                    : "text-[#1D2939]"
                }`}
              >
                {opt}
              </button>
            </li>
          ))}
          {filtered.length > 100 && (
            <li className="px-4 py-2 text-[12px] text-gray-400 font-poppins italic">
              Keep typing to narrow results…
            </li>
          )}
        </ul>
      )}

      {/* Empty state */}
      {open && query.trim() && filtered.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full bg-white border border-[#EAECF0] rounded-2xl shadow-xl mt-1 px-4 py-3 text-[14px] font-poppins text-gray-400">
          {emptyMessage ?? `No results for "${query}"`}
        </div>
      )}
    </div>
  );
};
