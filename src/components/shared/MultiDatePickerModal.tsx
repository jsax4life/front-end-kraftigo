"use client";

import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import Button from "@/components/ui/button";
import { formatLocalDateYmd } from "@/utils/date";
import { MAX_ADDITIONAL_PREFERRED_DATES } from "@/lib/flexibleSchedule";

interface MultiDatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Dates already selected (including primary date from parent). */
  selectedDates: Date[];
  onSelectDates: (dates: Date[]) => void;
  minDate?: Date;
  /** First/primary day — always selected and cannot be toggled off. */
  lockedDate?: Date;
  maxAdditional?: number;
  title?: string;
}

const MultiDatePickerModal = ({
  isOpen,
  onClose,
  selectedDates,
  onSelectDates,
  minDate,
  lockedDate,
  maxAdditional = MAX_ADDITIONAL_PREFERRED_DATES,
  title = "Add more days",
}: MultiDatePickerModalProps) => {
  const lockedYmd = lockedDate ? formatLocalDateYmd(lockedDate) : undefined;
  const [currentDate, setCurrentDate] = useState(selectedDates[0] || new Date());
  const [picked, setPicked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      const initial = new Set(selectedDates.map((d) => formatLocalDateYmd(d)));
      if (lockedYmd) initial.add(lockedYmd);
      setPicked(initial);
      setCurrentDate(lockedDate ?? selectedDates[0] ?? new Date());
    }
  }, [isOpen, selectedDates, lockedDate, lockedYmd]);

  if (!isOpen) return null;

  const weekDays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const minStart = minDate ? new Date(minDate) : new Date();
  minStart.setHours(0, 0, 0, 0);

  const getDaysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  const toggleDay = (day: number) => {
    const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const ymd = formatLocalDateYmd(cellDate);
    if (lockedYmd && ymd === lockedYmd) return;

    const next = new Set(picked);
    if (next.has(ymd)) {
      next.delete(ymd);
    } else {
      const extraCount = lockedYmd
        ? [...next].filter((d) => d !== lockedYmd).length
        : next.size;
      if (extraCount < maxAdditional) {
        next.add(ymd);
      }
    }
    if (lockedYmd) next.add(lockedYmd);
    setPicked(next);
  };

  const handleDone = () => {
    const dates = Array.from(picked)
      .sort()
      .map((ymd) => {
        const [y, m, d] = ymd.split("-").map(Number);
        return new Date(y, m - 1, d);
      });
    onSelectDates(dates);
    onClose();
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const ymd = formatLocalDateYmd(cellDate);
    const isLocked = lockedYmd != null && ymd === lockedYmd;
    const isPast = !isLocked && cellDate < minStart;
    const isSelected = picked.has(ymd);
    const extraCount = lockedYmd
      ? [...picked].filter((d) => d !== lockedYmd).length
      : picked.size;
    const atMax = !isSelected && !isLocked && extraCount >= maxAdditional;

    days.push(
      <button
        key={day}
        type="button"
        onClick={() => !isPast && !atMax && !isLocked && toggleDay(day)}
        disabled={isPast || atMax || isLocked}
        className={`aspect-square flex items-center justify-center text-[16px] font-poppins font-medium rounded-lg transition-colors ${
          isPast || atMax
            ? "text-gray-400 opacity-40 cursor-not-allowed bg-transparent"
            : isLocked
              ? "bg-gray-200 text-gray-600 cursor-default ring-2 ring-brand-orange ring-inset"
              : isSelected
                ? "bg-brand-orange text-white cursor-pointer"
                : "text-gray-900 hover:bg-gray-100 cursor-pointer"
        }`}
        title={isLocked ? "Your first date (change it above)" : undefined}
      >
        {day}
      </button>,
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5">
          <h2 className="text-[18px] sm:text-[20px] font-poppins font-bold text-gray-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={22} className="text-gray-500" />
          </button>
        </div>

        <div className="px-5 pb-2">
          <p className="text-[13px] text-gray-600 font-poppins">
            Your first date is fixed. Tap other days to add up to {maxAdditional} more.
          </p>
          {picked.size > 0 && (
            <p className="text-[12px] text-brand-orange font-poppins mt-1">
              {lockedYmd
                ? `${Math.max(0, picked.size - 1)} extra day${picked.size - 1 !== 1 ? "s" : ""} added`
                : `${picked.size} day${picked.size !== 1 ? "s" : ""} selected`}
            </p>
          )}
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-[13px] font-poppins text-gray-500">
                {day}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() =>
                setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
              }
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-900" />
            </button>
            <h3 className="text-[16px] font-poppins font-semibold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <button
              type="button"
              onClick={() =>
                setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
              }
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} className="text-gray-900" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-6">{days}</div>

          <Button variant="primary" fullWidth onClick={handleDone}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MultiDatePickerModal;
