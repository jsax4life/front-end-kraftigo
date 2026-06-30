"use client";

import { MapPin } from "lucide-react";
import { formatDistanceDisplay, readDistanceFields } from "@/utils/distance";

export interface DistanceBadgeProps {
  /** Pre-formatted label, e.g. `"2km away"`. */
  label?: string | null;
  /** Objects to read `distanceKm` / `distanceLabel` from (API rows). */
  sources?: unknown[];
  className?: string;
  size?: "xs" | "sm";
  align?: "left" | "right" | "center";
}

const sizeClasses: Record<NonNullable<DistanceBadgeProps["size"]>, string> = {
  xs: "text-[10px] gap-1 px-2 py-0.5 [&_svg]:size-3",
  sm: "text-[12px] gap-1 px-2.5 py-1 [&_svg]:size-3.5",
};

const alignClasses: Record<NonNullable<DistanceBadgeProps["align"]>, string> = {
  left: "",
  right: "ml-auto",
  center: "mx-auto",
};

export function DistanceBadge({
  label,
  sources,
  className = "",
  size = "sm",
  align = "left",
}: DistanceBadgeProps) {
  const text =
    (typeof label === "string" && label.trim()) ||
    (sources?.length
      ? formatDistanceDisplay(readDistanceFields(...sources))
      : null);

  if (!text) return null;

  return (
    <span
      className={`inline-flex w-fit max-w-full items-center shrink-0 font-poppins font-semibold leading-none text-[#C4320A] bg-[#FFF4ED] border border-[#FDBA74] rounded-full shadow-sm ${sizeClasses[size]} ${alignClasses[align]} ${className}`}
    >
      <MapPin
        className="shrink-0 text-brand-orange"
        strokeWidth={2.25}
        aria-hidden
      />
      <span className="truncate">{text}</span>
    </span>
  );
}
