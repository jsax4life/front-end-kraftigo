"use client";

import { Suspense } from "react";
import TaskerNav from "@/components/shared/taskerNav";
import TaskItem from "@/components/ui/taskItem";
import TaskDetailModal from "@/components/shared/TaskDetailModal";
import ActiveJobModal from "@/components/shared/ActiveJobModal";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useBookingsStore } from "@/store/useBookingsStore";
import type { Booking } from "@/types";
import { type Booking as LegacyBooking } from "@/store/useBookingStore";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

/* ─── calendar helpers ───────────────────────────────────────────── */
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

/** Returns true when the booking is 24 h or less away (including past/today jobs) */
function isWithin24Hours(dateIso: string): boolean {
  const diff = new Date(dateIso).getTime() - Date.now();
  return diff <= 24 * 60 * 60 * 1000; // ≤ 24 h (negative = already past → also true)
}

function buildGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Mon-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array(startOffset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
/* Adapts the global Booking type to the legacy shape ActiveJobModal expects */
function toActiveJobBooking(b: Booking): LegacyBooking {
  return {
    id: b.id,
    title: b.service?.title ?? "Booking",
    location: b.location,
    date: b.scheduled_date,
    time: b.scheduled_time ?? "TBD",
    status: b.status as LegacyBooking["status"],
    price: b.price,
  };
}

const SchedulePage = () => {
  const { bookings, isLoading, error, fetchArtisanBookings } = useBookingsStore();
  const today = new Date();
  const searchParams = useSearchParams();

  // Calendar state
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  /* ── bookings come from the store; dummy fallback is handled inside fetchTaskerBookings ── */
  const displayBookings = bookings;

  // Booking dates for calendar orange highlights
  const bookingDates = displayBookings
    .map((b) => (b.scheduled_date ? new Date(b.scheduled_date) : null))
    .filter((d): d is Date => d !== null && !isNaN(d.getTime()));

  useEffect(() => {
    fetchArtisanBookings();
  }, [fetchArtisanBookings]);

  // Auto-open ActiveJobModal when navigated from dashboard with ?openJob=<id>
  useEffect(() => {
    const openJobId = searchParams.get("openJob");
    if (openJobId && bookings.length > 0) {
      const match = bookings.find((b) => b.id === openJobId);
      if (match) setSelectedBooking(match);
    }
  }, [searchParams, bookings]);

  // static week strip – 7 days starting from Monday of the selected date's week
  const getWeekDays = (date: Date) => {
    const dayOfWeek = (date.getDay() + 6) % 7; // Mon=0
    const monday = new Date(date);
    monday.setDate(date.getDate() - dayOfWeek);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const weekDays = getWeekDays(selectedDate);

  const goPrev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const goNext = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setShowFullCalendar(false); // collapse back to week view
  };

  const grid = buildGrid(viewYear, viewMonth);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "COMPLETED": return { color: "bg-green-100 text-green-700", dot: "bg-green-500" };
      case "CONFIRMED": return { color: "bg-orange-100 text-brand-orange", dot: "bg-brand-orange" };
      case "PENDING":   return { color: "bg-blue-100 text-blue-600", dot: "bg-blue-400" };
      case "CANCELLED": return { color: "bg-red-100 text-red-600", dot: "bg-red-500" };
      default:          return { color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };
    }
  };

  return (
    <main className="relative w-full min-h-screen bg-white pb-24">
      <div className="w-full sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">

          {/* ── Calendar Header ── */}
          <div className="bg-[#F6F6F6] pt-8 px-4 mb-6 pb-6">

            {/* Title + toggle icon */}
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-[20px] sm:text-[24px] font-gerat font-bold">
                Schedule
              </h1>
              <button
                onClick={() => setShowFullCalendar((prev) => !prev)}
                className={`p-1.5 rounded-full transition-colors ${
                  showFullCalendar ? "bg-brand-orange/10 text-brand-orange" : "hover:bg-gray-200"
                }`}
                aria-label={showFullCalendar ? "Collapse calendar" : "Expand calendar"}
              >
                <Calendar size={20} />
              </button>
            </div>

            {/* ── WEEK STRIP (collapsed view) ── */}
            {!showFullCalendar && (
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {weekDays.map((date, index) => {
                  const isTdy   = isSameDay(date, today);
                  const hasTask = bookingDates.some((bd) => isSameDay(bd, date));
                  const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

                  // today = blue, task day = orange, otherwise plain
                  const bgCls = isTdy
                    ? "bg-brand-blue text-white"
                    : hasTask
                    ? "bg-brand-orange text-white"
                    : "text-gray-500 hover:bg-gray-200";

                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedDate(date)}
                      className={`flex flex-col items-center py-2 sm:py-3 rounded-lg transition-colors ${bgCls}`}
                    >
                      <span className="text-[10px] sm:text-[12px] font-poppins mb-1">
                        {DAY_LABELS[index]}
                      </span>
                      <span className="text-[16px] sm:text-[20px] font-gerat font-bold">
                        {date.getDate()}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── FULL MONTH CALENDAR (expanded view) ── */}
            {showFullCalendar && (
              <div>
                {/* Month navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={goPrev}
                    className="p-1.5 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <ChevronLeft size={18} className="text-gray-600" />
                  </button>
                  <span className="text-[14px] font-semibold text-gray-800">
                    {MONTH_NAMES[viewMonth]} {viewYear}
                  </span>
                  <button
                    onClick={goNext}
                    className="p-1.5 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <ChevronRight size={18} className="text-gray-600" />
                  </button>
                </div>

                {/* Day-of-week labels */}
                <div className="grid grid-cols-7 mb-1">
                  {WEEK_DAYS.map((d) => (
                    <div
                      key={d}
                      className="text-center text-[11px] text-gray-400 font-medium py-1"
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {/* Date grid */}
                <div className="grid grid-cols-7 gap-y-1">
                  {grid.map((date, idx) => {
                    if (!date) return <div key={idx} />;

                    const isToday    = isSameDay(date, today);
                    const isUpcoming = bookingDates.some((bd) => isSameDay(bd, date)) && date >= today;
                    const isSelected = isSameDay(date, selectedDate);

                    let cls =
                      "w-9 h-9 mx-auto flex items-center justify-center rounded-lg text-[13px] font-medium transition-colors cursor-pointer select-none";

                    if (isToday) {
                      cls += " bg-brand-blue text-white";
                    } else if (isUpcoming || isSelected) {
                      cls += " bg-brand-orange text-white";
                    } else {
                      cls += " text-gray-700 hover:bg-gray-200";
                    }

                    return (
                      <div key={idx} className="flex justify-center py-0.5">
                        <button className={cls} onClick={() => handleSelectDate(date)}>
                          {date.getDate()}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-5 mt-4 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand-blue inline-block" />
                    <span className="text-[11px] text-gray-600">Today</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand-orange inline-block" />
                    <span className="text-[11px] text-gray-600">Booking date</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Tasks Timeline ── */}
          <div className="space-y-4 px-4">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange" />
              </div>
            ) : (() => {
              const dayBookings = displayBookings.filter((b) =>
                b.scheduled_date && isSameDay(new Date(b.scheduled_date), selectedDate)
              );
              return dayBookings.length > 0 ? (
                dayBookings.map((booking, index) => {
                  const statusInfo = getStatusInfo(booking.status);
                  return (
                    <TaskItem
                      key={booking.id}
                      time={booking.scheduled_time || "TBD"}
                      title={booking.service?.title || "Craft"}
                      client={`Client: Customer`}
                      location={booking.location}
                      status={booking.status}
                      statusColor={statusInfo.color}
                      dotColor={statusInfo.dot}
                      isLast={index === dayBookings.length - 1}
                      onClick={() => setSelectedBooking(booking)}
                    />
                  );
                })
              ) : (
                <div className="text-center py-20">
                  <p className="text-gray-500 font-poppins">
                    No tasks for this day.
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <TaskerNav />

      {/* ── Modal switcher: show ActiveJobModal within 24h, TaskDetailModal otherwise ── */}
      {selectedBooking && isWithin24Hours(selectedBooking.scheduled_date) ? (
        <ActiveJobModal
          booking={selectedBooking ? toActiveJobBooking(selectedBooking) : null}
          onClose={() => setSelectedBooking(null)}
        />
      ) : (
        <TaskDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </main>
  );
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SchedulePage />
    </Suspense>
  );
}
