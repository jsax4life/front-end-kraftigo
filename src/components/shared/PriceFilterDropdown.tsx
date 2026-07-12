"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const BAR_HEIGHTS = [12,14,23,34,36,53,69,63,43,27,18,18,12,8,12,23,30,51,55,23,30,30,37,30,47,30,18,53,30,43,30,30,30,27,20,20,22,30,35,30,16,10,6,6,3,8];
const BAR_COLORS = ["#FEBA00","#FEBA00","#FEBA00","#FDA800","#FD9F00","#FD9600","#FD8E00","#FC8500","#FC7D00","#FC7400","#FB6C00","#FB6500","#FB5D00","#FB5D00","#FB5D00","#FB5D00","#FB5D00","#FB5D00","#FB5D00","#FB5D00","#FB5D00","#FB5D00","#FB5D00","#FB5D00","#FB5D00","#FB5D00","#FB5D00","#FB5D00","#FB5D00","#FB5D00","#FB5D00","#FB5D00","#FB5D00","#FB5D00","#FB5D00","#FB5D00","#FB5D00","#FB5D00","#FB5D00","#FB5D00","#FB5D00","#FB5D00","#FB5D00","#FB5D00","#FB5D00","#FB5D00"];
const MAX_BAR = 69;
const MIN_PRICE = 0;
const MAX_PRICE = 1000;

interface PriceFilterDropdownProps {
  onApply?: (min: number, max: number) => void;
  inline?: boolean;
}

export default function PriceFilterDropdown({ onApply, inline }: PriceFilterDropdownProps) {
  const [minVal, setMinVal] = useState(10);
  const [maxVal, setMaxVal] = useState(100);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<"min" | "max" | null>(null);

  const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

  const posToVal = useCallback((clientX: number) => {
    if (!trackRef.current) return 0;
    const { left, width } = trackRef.current.getBoundingClientRect();
    const pct = clamp((clientX - left) / width, 0, 1);
    return Math.round(pct * (MAX_PRICE - MIN_PRICE) + MIN_PRICE);
  }, []);

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!dragging.current) return;
    const val = posToVal(e.clientX);
    if (dragging.current === "min") {
      setMinVal(v => clamp(val, MIN_PRICE, maxVal - 5));
    } else {
      setMaxVal(v => clamp(val, minVal + 5, MAX_PRICE));
    }
  }, [posToVal, minVal, maxVal]);

  const startDrag = (handle: "min" | "max") => (e: React.PointerEvent) => {
    e.preventDefault();
    dragging.current = handle;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", () => {
      dragging.current = null;
      window.removeEventListener("pointermove", onPointerMove);
    }, { once: true });
  };

  const minPct = ((minVal - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;
  const maxPct = ((maxVal - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;

  useEffect(() => {
    onApply?.(minVal, maxVal);
  }, [minVal, maxVal, onApply]);

  return (
    <div className={inline ? "flex flex-col gap-4 w-full" : "bg-white rounded-[20px] border border-[#0000001A] shadow-2xl p-5 w-full flex flex-col gap-4"}>
      {/* Title */}
      <p className="text-[16px] font-poppins font-bold text-[#2F2C2C]">Price range</p>

      {/* Bar chart */}
      <div className="flex items-end gap-[2px] h-[69px]">
        {BAR_HEIGHTS.map((h, i) => {
          const barMinIdx = Math.round((minVal / MAX_PRICE) * (BAR_HEIGHTS.length - 1));
          const barMaxIdx = Math.round((maxVal / MAX_PRICE) * (BAR_HEIGHTS.length - 1));
          const inRange = i >= barMinIdx && i <= barMaxIdx;
          return (
            <div
              key={i}
              className="flex-1 rounded-sm transition-colors duration-150"
              style={{
                height: `${(h / MAX_BAR) * 100}%`,
                backgroundColor: inRange ? BAR_COLORS[i] : "#E5E7EB",
              }}
            />
          );
        })}
      </div>

      {/* Track + handles */}
      <div className="relative h-7 flex items-center -mt-7" ref={trackRef}>
        {/* Full track */}
        <div className="absolute inset-x-0 h-[7px] rounded-full bg-gray-200" />
        {/* Active segment */}
        <div
          className="absolute h-[7px] rounded-full"
          style={{
            left: `${minPct}%`,
            right: `${100 - maxPct}%`,
            background: "linear-gradient(to right, #FFD600 0%, #FB5D00 50%, #FB5D00 100%)",
          }}
        />
        {/* Min handle */}
        <div
          className="absolute w-5 h-5 bg-white border-2 border-[#FB5D00] rounded-full shadow-md cursor-grab active:cursor-grabbing touch-none"
          style={{ left: `calc(${minPct}% - 10px)` }}
          onPointerDown={startDrag("min")}
        />
        {/* Max handle */}
        <div
          className="absolute w-5 h-5 bg-white border-2 border-[#FB5D00] rounded-full shadow-md cursor-grab active:cursor-grabbing touch-none"
          style={{ left: `calc(${maxPct}% - 10px)` }}
          onPointerDown={startDrag("max")}
        />
      </div>

      {/* Min / Max cards */}
      <div className="flex gap-30 -mt-3 -mb-2">
        <div className="flex-1 rounded-lg border border-[#0000001A] p-1.5  ">
          <p className="text-[12px] font-poppins text-[#0B0B0B66] mt-0.5">Minimum</p>
          <div className="flex items-baseline gap-0.5">
            <span className="text-[16px]font-poppins font-regular text-[#000000CC]">$</span>
            <input
              type="number"
              value={minVal}
              min={MIN_PRICE}
              max={maxVal - 5}
              onChange={(e) => setMinVal(clamp(parseInt(e.target.value) || 0, MIN_PRICE, maxVal - 5))}
              className="w-full text-[16px] font-poppins font-regular text-[#000000CC] outline-none bg-transparent"
            />
          </div>
    
        </div>
        <div className="flex-1 rounded-lg border border-[#0000001A] p-1.5 ">
         <p className="text-[12px] font-poppins text-[#0B0B0B66] mt-0.5">Maximum</p>
          <div className="flex items-baseline gap-0.5">
            <span className="text-[16px]font-poppins font-regular text-[#000000CC]">$</span>
            <input
              type="number"
              value={maxVal}
              min={minVal + 5}
              max={MAX_PRICE}
              onChange={(e) => setMaxVal(clamp(parseInt(e.target.value) || 0, minVal + 5, MAX_PRICE))}
              className="w-full text-[16px] font-poppins font-regular text-[#000000CC] outline-none bg-transparent"
            />
          </div>
          
        </div>
      </div>
    </div>
  );
}
