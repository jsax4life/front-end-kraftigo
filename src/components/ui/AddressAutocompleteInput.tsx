"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { Search } from "lucide-react";
import { parseGeoapifyLatLon } from "@/lib/geoapify";

export interface AddressSuggestion {
  label: string;
  street: string;
  postcode: string;
  city: string;
  latitude?: number;
  longitude?: number;
}

interface AddressAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion?: (suggestion: AddressSuggestion) => void;
  placeholder?: string;
  label?: string;
  inputClassName?: string;
  icon?: ReactNode;
}

export function AddressAutocompleteInput({
  value,
  onChange,
  onSelectSuggestion,
  placeholder = "Search for Area, Street Name",
  label,
  inputClassName = "w-full p-3 bg-[#F6F6F6] border border-[#0000001A] rounded-xl text-[14px] font-poppins text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange",
  icon,
}: AddressAutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const searchAddress = (query: string) => {
    onChange(query);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        // Geoapify Autocomplete — Germany only
        const res = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&filter=countrycode:de&format=json&limit=8&apiKey=21f120cab34b44fdad5b5f4cc2a8105f`
        );
        const json = await res.json();

        const results = (json.results ?? [])
          .filter((r: any) => r.housenumber || r.street || r.city || r.name)
          .map((r: any) => {
            const street =
              r.address_line1 ??
              (r.street
                ? `${r.street}${r.housenumber ? " " + r.housenumber : ""}`
                : (r.name ?? ""));
            const postcode = r.postcode ?? "";
            const city = r.city ?? r.town ?? r.village ?? r.county ?? "";
            
            // Construct a cleaner label without state abbreviations (like RP, BE)
            const cityPart = `${postcode} ${city}`.trim();
            const cleanLabel = [street, cityPart].filter(Boolean).join(", ");
            const label = cleanLabel || r.formatted || query;
            
            const coords = parseGeoapifyLatLon(r as Record<string, unknown>);
            return {
              label,
              street,
              postcode,
              city,
              ...(coords ?? {}),
            };
          });

        const seen = new Set<string>();
        const unique = results.filter((r: any) => {
          if (seen.has(r.label)) return false;
          seen.add(r.label);
          return true;
        });

        setSuggestions(unique);
        setOpen(unique.length > 0);
      } catch (err) {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const handleSelect = (s: AddressSuggestion) => {
    if (onSelectSuggestion) {
      onSelectSuggestion(s);
    } else {
      onChange(s.label);
    }
    setOpen(false);
    setSuggestions([]);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <div>
          <label className="text-[13px] font-mabry text-gray-600 mb-1 block">
          {label}
        </label>
        
        </div>
      )}
      <div className="relative">
        {icon}
        <input
          type="text"
          value={value}
          onChange={(e) => searchAddress(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className={inputClassName}
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
        {value.trim().length > 0 && ( 
          <p className="text-[8.5px] font-poppins text-brand-orange mt-1 ml-1">Only availble for germany</p>
        )}

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-[#EAECF0] rounded-xl shadow-xl max-h-56 overflow-y-auto mt-1 py-1">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(s)}
                className="w-full text-left px-4 py-2.5 font-poppins text-[14px] text-[#1D2939] hover:bg-[#FFF4EE] hover:text-brand-orange transition-colors"
              >
                <span className="font-semibold">{s.street || s.label.split(',')[0]}</span>
                {(s.postcode || s.city) && (
                  <span className="text-gray-400 text-[12px] ml-1">
                    — {[s.postcode, s.city].filter(Boolean).join(" ")}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
