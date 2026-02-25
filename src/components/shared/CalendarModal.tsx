"use client";

import React, { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Dates that have at least one booking — displayed with orange highlight */
  bookingDates?: Date[];
  /** Called when the user taps a date cell */
  onSelectDate?: (date: Date) => void;
}

const WEEK_DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Returns an array of Date | null representing the grid (Mon-first, 6 rows × 7 cols) */
function buildGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  // getDay() is 0=Sun … 6=Sat; convert to Mon-first index (0=Mon … 6=Sun)
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = Array(startOffset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month, d));
  }
  // Pad to complete the last row
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function CalendarModal({
  isOpen,
  onClose,
  bookingDates = [],
  onSelectDate,
}: CalendarModalProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<Date | null>(null);

  if (!isOpen) return null;

  const grid = buildGrid(viewYear, viewMonth);

  const goPrev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const goNext = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleSelect = (date: Date) => {
    setSelected(date);
    onSelectDate?.(date);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-t-3xl w-full max-w-md mx-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[18px] font-bold text-gray-900">Schedule</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goPrev}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
          <span className="text-[15px] font-semibold text-gray-800">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button
            onClick={goNext}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronRight size={18} className="text-gray-600" />
          </button>
        </div>

        {/* Day-of-week labels */}
        <div className="grid grid-cols-7 mb-1">
          {WEEK_DAYS.map((d) => (
            <div
              key={d}
              className="text-center text-[12px] text-gray-400 font-medium py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Date grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {grid.map((date, idx) => {
            if (!date) return <div key={idx} />;

            const isToday = isSameDay(date, today);
            const isBooking = bookingDates.some((bd) => isSameDay(bd, date));
            const isSelected = selected && isSameDay(date, selected);

            let cellStyle =
              "w-9 h-9 mx-auto flex items-center justify-center rounded-full text-[14px] font-medium transition-colors cursor-pointer select-none";

            if (isToday) {
              cellStyle += " bg-brand-blue text-white";
            } else if (isBooking) {
              cellStyle += " bg-brand-orange text-white";
            } else if (isSelected) {
              cellStyle += " bg-orange-100 text-brand-orange";
            } else {
              cellStyle += " text-gray-700 hover:bg-gray-100";
            }

            return (
              <div key={idx} className="flex justify-center py-0.5">
                <button className={cellStyle} onClick={() => handleSelect(date)}>
                  {date.getDate()}
                  {isToday && (
                    <span className="sr-only">Today</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-blue inline-block" />
            <span className="text-[12px] text-gray-600">Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-orange inline-block" />
            <span className="text-[12px] text-gray-600">Booking date</span>
          </div>
        </div>
      </div>
    </div>
  );
}
