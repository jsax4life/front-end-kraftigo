"use client";

import { X, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useState } from "react";
import Button from "@/components/ui/button";

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
}

const DatePickerModal = ({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
}: DatePickerModalProps) => {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(
    selectedDate ? selectedDate.getDate() : null,
  );

  if (!isOpen) return null;

  const weekDays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    // Convert Sunday (0) to 7, and shift Monday to 1
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
  };

  const handleDone = () => {
    if (selectedDay && onSelectDate) {
      const finalDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        selectedDay,
      );
      onSelectDate(finalDate);
    }
    onClose();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = day === selectedDay;
      days.push(
        <button
          key={day}
          onClick={() => handleDayClick(day)}
          className={`aspect-square flex items-center justify-center text-[16px] font-poppins font-medium rounded-lg transition-colors ${
            isSelected
              ? "bg-brand-orange text-white"
              : "text-gray-900 hover:bg-gray-100"
          }`}
        >
          {day}
        </button>,
      );
    }

    return days;
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5">
          <h2 className="text-[18px] sm:text-[20px] font-poppins font-bold text-gray-900">
            Choose Date
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={22} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-[13px] font-poppins text-gray-500"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-900" />
            </button>
            <h3 className="text-[16px] font-poppins font-semibold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} className="text-gray-900" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 mb-6">{renderCalendar()}</div>

          {/* Done Button */}
          <Button variant="primary" fullWidth onClick={handleDone}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DatePickerModal;
