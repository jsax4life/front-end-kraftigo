"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Clock, AlertCircle } from "lucide-react";
import Image from "next/image";

interface RescheduleModalProps {
  booking: any;
  onClose: () => void;
  onConfirm: (newDate: string, newTime: string) => void;
}

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const generateCalendar = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const cells: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
};

const RescheduleModal = ({ booking, onClose, onConfirm }: RescheduleModalProps) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState("6:00pm");

  const cells = generateCalendar(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const newDateLabel = selectedDay
    ? `${selectedDay}th ${MONTHS[viewMonth].slice(0, 3)}, ${viewYear}, ${selectedTime}`
    : "—";

  const handleConfirm = () => {
    if (!selectedDay) return;
    onConfirm(newDateLabel, selectedTime);
  };

  return (
    <>
      <div className="fixed inset-0 z-60 bg-black/40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-60 bg-white rounded-t-[32px] max-h-[96vh] flex flex-col">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-3 shrink-0">
          <div>
            <h2 className="text-[20px] font-gerat font-bold text-black">
              Reschedule Appointment
            </h2>
            <p className="text-[12px] font-poppins text-gray-500 mt-0.5">
              Are You Sure You Want To Cancel?<br />
              Please confirm the details of the booking you wish to cancel.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 mt-1">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {/* Current Appointment */}
          <p className="text-[12px] font-poppins font-semibold text-black mb-2">
            Current Appointment
          </p>
          <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3 mb-5">
            <Image
              src={booking.artisan?.image || "/images/pro.jpg"}
              alt="artisan"
              width={52}
              height={52}
              className="rounded-xl object-cover w-13 h-13 shrink-0"
            />
            <div>
              <p className="text-[13px] font-poppins font-bold text-black">
                {booking.artisan?.name || booking.service}
              </p>
              <p className="text-[12px] font-poppins text-gray-500">
                {booking.artisan?.location}
              </p>
              <p className="text-[12px] font-poppins text-gray-500">
                {booking.date} ({booking.timeLabel})
              </p>
            </div>
          </div>

          {/* Select new date */}
          <p className="text-[13px] font-poppins font-semibold text-black mb-3">
            Select new date
          </p>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[11px] font-poppins text-gray-400 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Month nav */}
          <div className="flex items-center justify-between mb-2">
            <button onClick={prevMonth} className="p-1">
              <ChevronLeft size={18} className="text-gray-500" />
            </button>
            <span className="text-[13px] font-poppins font-semibold text-black">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button onClick={nextMonth} className="p-1">
              <ChevronRight size={18} className="text-gray-500" />
            </button>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-y-1 mb-5">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const isToday =
                day === today.getDate() &&
                viewMonth === today.getMonth() &&
                viewYear === today.getFullYear();
              const isSelected = day === selectedDay;
              const isHighlighted = [1, 9, 3].includes(day) && !isSelected; // design accent days
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(day)}
                  className={`w-8 h-8 mx-auto rounded-full text-[13px] font-poppins font-medium transition-colors ${
                    isSelected
                      ? "bg-brand-blue text-white"
                      : isToday
                      ? "bg-brand-orange text-white"
                      : isHighlighted
                      ? "bg-brand-orange/20 text-brand-orange font-semibold"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Select new time */}
          <p className="text-[13px] font-poppins font-semibold text-black mb-2">
            Select new Time
          </p>
          <div className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 mb-4">
            <div className="flex items-center gap-2 text-[14px] font-poppins text-gray-700">
              <Clock size={16} className="text-gray-400" />
              <span>{selectedTime}</span>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </div>

          {/* Reschedule Policy */}
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-5 flex gap-2">
            <AlertCircle size={16} className="text-brand-orange shrink-0 mt-0.5" />
            <div>
              <p className="text-[12px] font-poppins font-semibold text-brand-orange mb-0.5">
                Reschedule Policy
              </p>
              <p className="text-[11px] font-poppins text-orange-500">
                Rescheduling 24 hours of the agreed time may incur a $9.99 late notice fee.{" "}
                <span className="underline cursor-pointer">Learn more</span>
              </p>
            </div>
          </div>

          {/* Old / New Date Summary */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] font-poppins text-gray-400 mb-1">Old Date</p>
              <div className="flex items-center gap-1.5 text-[12px] font-poppins text-gray-600">
                <span>📅</span>
                <span>{booking.date}, {booking.time}</span>
              </div>
            </div>
            <div className="bg-orange-50 rounded-xl p-3">
              <p className="text-[10px] font-poppins text-brand-orange mb-1">New Proposed Date</p>
              <div className="flex items-center gap-1.5 text-[12px] font-poppins text-brand-orange">
                <span>📅</span>
                <span>{newDateLabel}</span>
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleConfirm}
            disabled={!selectedDay}
            className={`w-full py-4 rounded-2xl text-[15px] font-poppins font-semibold transition-colors ${
              selectedDay
                ? "bg-brand-orange text-white hover:bg-orange-600"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            Confirm reschedule
          </button>
        </div>
      </div>
    </>
  );
};

export default RescheduleModal;
