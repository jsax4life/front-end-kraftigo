"use client";

import { X, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useState } from "react";
import Button from "@/components/ui/button";

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  selectedTime?: string;
  onSelectDate?: (date: Date, time: string) => void;
}

const DatePickerModal = ({
  isOpen,
  onClose,
  selectedDate,
  selectedTime = "6:00 PM",
  onSelectDate,
}: DatePickerModalProps) => {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(
    selectedDate ? selectedDate.getDate() : null,
  );
  const [time, setTime] = useState(selectedTime);
  const [showTimePicker, setShowTimePicker] = useState(false);

  if (!isOpen) return null;

  const timeOptions = [
    "6:00 AM",
    "7:00 AM",
    "8:00 AM",
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
    "6:00 PM",
    "7:00 PM",
    "8:00 PM",
    "9:00 PM",
    "10:00 PM",
  ];

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
      onSelectDate(finalDate, time);
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

          {/* Time Picker */}
          <div className="relative">
            <button
              onClick={() => setShowTimePicker(!showTimePicker)}
              className="w-full p-4 bg-[#F6F6F6] border border-[#0000001A] rounded-full flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-gray-600" />
                <span className="text-[15px] font-poppins text-gray-900">
                  {time}
                </span>
              </div>
              <ChevronRight
                size={20}
                className={`text-gray-400 transition-transform ${
                  showTimePicker ? "rotate-90" : ""
                }`}
              />
            </button>

            {/* Time Dropdown */}
            {showTimePicker && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#0000001A] rounded-xl shadow-lg max-h-48 overflow-y-auto z-10">
                {timeOptions.map((timeOption) => (
                  <button
                    key={timeOption}
                    onClick={() => {
                      setTime(timeOption);
                      setShowTimePicker(false);
                    }}
                    className={`w-full p-3 text-left text-[14px] font-poppins hover:bg-gray-100 transition-colors ${
                      time === timeOption
                        ? "bg-brand-orange/10 text-brand-orange font-semibold"
                        : "text-gray-900"
                    }`}
                  >
                    {timeOption}
                  </button>
                ))}
              </div>
            )}
          </div>

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
