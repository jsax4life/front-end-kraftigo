"use client";

import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, Clock, AlertCircle } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  formatLocalDateYmd,
  isCalendarDayBeforeToday,
  isDateTimeTooSoon,
  isSameLocalDay,
  minScheduleTimeInputForToday,
} from "@/utils/date";
import TimePickerModal, { formatTime12h } from "@/components/shared/TimePickerModal";
import { useTranslations } from "next-intl";

interface RescheduleModalProps {
  booking: {
    artisan?: { image?: string; name?: string; location?: string };
    service?: string;
    date?: string;
    time?: string;
    timeLabel?: string;
  };
  onClose: () => void;
  onConfirm: (newDateYmd: string, newTime24: string) => void;
}

const generateCalendar = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const cells: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
};

const RescheduleModal = ({ booking, onClose, onConfirm }: RescheduleModalProps) => {
  const t = useTranslations("reschedule");
  const tShared = useTranslations("shared.datePicker");
  
  const DAYS = [
    tShared("weekDays.mo"),
    tShared("weekDays.tu"),
    tShared("weekDays.we"),
    tShared("weekDays.th"),
    tShared("weekDays.fr"),
    tShared("weekDays.sa"),
    tShared("weekDays.su"),
  ];
  const MONTHS = [
    tShared("months.january"),
    tShared("months.february"),
    tShared("months.march"),
    tShared("months.april"),
    tShared("months.may"),
    tShared("months.june"),
    tShared("months.july"),
    tShared("months.august"),
    tShared("months.september"),
    tShared("months.october"),
    tShared("months.november"),
    tShared("months.december"),
  ];
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState("18:00");
  const [showTimePicker, setShowTimePicker] = useState(false);

  const cells = generateCalendar(viewYear, viewMonth);

  const selectedDate =
    selectedDay != null ? new Date(viewYear, viewMonth, selectedDay) : null;
  const isSelectedToday = selectedDate ? isSameLocalDay(selectedDate, today) : false;
  const minTimeToday = minScheduleTimeInputForToday();

  useEffect(() => {
    if (!selectedDate || !isSelectedToday) return;
    if (isDateTimeTooSoon(selectedDate, selectedTime)) {
      setSelectedTime(minTimeToday);
    }
  }, [selectedDay, viewMonth, viewYear, isSelectedToday, minTimeToday, selectedDate, selectedTime]);

  const prevMonth = () => {
    const nextMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const nextYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const lastDay = new Date(nextYear, nextMonth + 1, 0).getDate();
    if (isCalendarDayBeforeToday(nextYear, nextMonth, lastDay)) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const newDateLabel = selectedDate
    ? `${selectedDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}, ${selectedTime}`
    : "—";

  const handleConfirm = () => {
    if (!selectedDay || !selectedDate) return;
    if (isDateTimeTooSoon(selectedDate, selectedTime)) {
      toast.error(t("timeTooSoon"));
      return;
    }
    onConfirm(formatLocalDateYmd(selectedDate), selectedTime);
  };

  const modal = (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-[101] bg-white rounded-t-[32px] max-h-[96vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reschedule-modal-title"
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="flex items-start justify-between px-5 pt-4 pb-3 shrink-0">
          <div>
            <h2 id="reschedule-modal-title" className="text-[20px] font-gerat font-bold text-black">
              {t("title")}
            </h2>
            <p className="text-[12px] font-poppins text-gray-500 mt-0.5">
              {t("modalSubtitle")}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 mt-1" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6">
          <p className="text-[12px] font-poppins font-semibold text-black mb-2">
            {t("currentAppointment")}
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
                {booking.date} ({booking.timeLabel || booking.time})
              </p>
            </div>
          </div>

          <p className="text-[13px] font-poppins font-semibold text-black mb-3">
            {t("selectDate")}
          </p>

          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[11px] font-poppins text-gray-400 py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={prevMonth} className="p-1">
              <ChevronLeft size={18} className="text-gray-500" />
            </button>
            <span className="text-[13px] font-poppins font-semibold text-black">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth} className="p-1">
              <ChevronRight size={18} className="text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1 mb-5">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const isPast = isCalendarDayBeforeToday(viewYear, viewMonth, day);
              const isToday =
                day === today.getDate() &&
                viewMonth === today.getMonth() &&
                viewYear === today.getFullYear();
              const isSelected = day === selectedDay;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={isPast}
                  onClick={() => !isPast && setSelectedDay(day)}
                  className={`w-8 h-8 mx-auto rounded-full text-[13px] font-poppins font-medium transition-colors ${
                    isPast
                      ? "text-gray-300 cursor-not-allowed"
                      : isSelected
                        ? "bg-brand-blue text-white"
                        : isToday
                          ? "bg-brand-orange text-white"
                          : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <p className="text-[13px] font-poppins font-semibold text-black mb-2">
            {t("selectTime")}
          </p>
          <button 
            type="button"
            onClick={() => setShowTimePicker(true)}
            className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 mb-4 w-full text-left bg-white focus:outline-none focus:border-brand-orange"
          >
            <Clock size={16} className="text-gray-400 shrink-0" />
            <span className="flex-1 text-[14px] font-poppins text-gray-700">
              {formatTime12h(selectedTime) || t("selectTimeLabel")}
            </span>
          </button>

          <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-5 flex gap-2">
            <AlertCircle size={16} className="text-brand-orange shrink-0 mt-0.5" />
            <div>
              <p className="text-[12px] font-poppins font-semibold text-brand-orange mb-0.5">
                {t("policyTitle")}
              </p>
              <p className="text-[11px] font-poppins text-orange-500">
                {t("policyDesc")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] font-poppins text-gray-400 mb-1">{t("oldDate")}</p>
              <div className="flex items-center gap-1.5 text-[12px] font-poppins text-gray-600">
                <span>{booking.date}, {booking.time}</span>
              </div>
            </div>
            <div className="bg-orange-50 rounded-xl p-3">
              <p className="text-[10px] font-poppins text-brand-orange mb-1">{t("newDate")}</p>
              <div className="flex items-center gap-1.5 text-[12px] font-poppins text-brand-orange">
                <span>{newDateLabel}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedDay}
            className={`w-full py-4 rounded-2xl text-[15px] font-poppins font-semibold transition-colors ${
              selectedDay
                ? "bg-brand-orange text-white hover:bg-orange-600"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {t("confirm")}
          </button>
        </div>
      </div>

      <TimePickerModal
        isOpen={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        selectedTime={selectedTime}
        onSelectTime={(time) => {
          if (selectedDate && isSelectedToday && time && isDateTimeTooSoon(selectedDate, time)) {
            toast.error(t("timeTooSoon"));
            setSelectedTime(minTimeToday);
          } else {
            setSelectedTime(time);
          }
        }}
      />
    </>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
};

export default RescheduleModal;
