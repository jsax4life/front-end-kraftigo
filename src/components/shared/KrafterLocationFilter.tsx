"use client";

import type { KrafterLocationOption } from "@/lib/api/customerKrafters";
import { locationOptionKey } from "@/lib/api/customerKrafters";

type KrafterLocationFilterProps = {
  locations: KrafterLocationOption[];
  selected: KrafterLocationOption | null;
  onSelect: (location: KrafterLocationOption | null) => void;
  allLabel: string;
  loading?: boolean;
};

export default function KrafterLocationFilter({
  locations,
  selected,
  onSelect,
  allLabel,
  loading = false,
}: KrafterLocationFilterProps) {
  if (loading && locations.length === 0) {
    return (
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-gray-200"
          />
        ))}
      </div>
    );
  }

  if (locations.length === 0) return null;

  const selectedKey = selected ? locationOptionKey(selected) : null;

  return (
    <div className="mb-4 -mx-4 px-4 overflow-x-auto scrollbar-hide">
      <div className="flex gap-2 pb-1">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`shrink-0 rounded-full border px-4 py-2 font-poppins text-[13px] font-semibold transition-colors ${
            selectedKey === null
              ? "border-brand-orange bg-brand-orange text-white"
              : "border-[#0000001A] bg-white text-[#1D2939] hover:border-brand-orange/40"
          }`}
        >
          {allLabel}
        </button>
        {locations.map((location) => {
          const key = locationOptionKey(location);
          const active = selectedKey === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(location)}
              className={`shrink-0 rounded-full border px-4 py-2 font-poppins text-[13px] font-semibold transition-colors ${
                active
                  ? "border-brand-orange bg-brand-orange text-white"
                  : "border-[#0000001A] bg-white text-[#1D2939] hover:border-brand-orange/40"
              }`}
            >
              {location.label}
              <span className={`ml-1.5 text-[11px] font-medium ${active ? "text-white/85" : "text-gray-500"}`}>
                ({location.krafterCount})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
